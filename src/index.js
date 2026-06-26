import "dotenv/config";
import { ethers } from "ethers";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import registrarABI from "./abis/ETNBaseRegistrarABI.json" assert { type: "json" };
import { processRegistration } from "./processRegistration.js";
import { getLastProcessedBlock, setLastProcessedBlock } from "../backend/state/state.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────
//  Config
// ─────────────────────────────────────────────

const RPC_URL                   = process.env.RPC_URL;
const REGISTRAR_ADDRESS         = process.env.REGISTRAR_ADDRESS;
const BACKEND_PRIVATE_KEY       = process.env.BACKEND_PRIVATE_KEY;
const PORT                      = process.env.PORT || 3000;
const STARTUP_LOOKBACK_BLOCKS   = parseInt(process.env.STARTUP_LOOKBACK_BLOCKS || "50000", 10);
const POLL_INTERVAL_MS          = parseInt(process.env.POLL_INTERVAL_MS || "15000", 10);
const MAX_BLOCK_RANGE_PER_QUERY = parseInt(process.env.MAX_BLOCK_RANGE_PER_QUERY || "5000", 10);

if (!RPC_URL || !REGISTRAR_ADDRESS || !BACKEND_PRIVATE_KEY) {
  console.error("❌ Missing required environment variables. Check .env against .env.example");
  process.exit(1);
}

// ─────────────────────────────────────────────
//  Chain connections
// ─────────────────────────────────────────────

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer   = new ethers.Wallet(BACKEND_PRIVATE_KEY, provider);

const registrarRead  = new ethers.Contract(REGISTRAR_ADDRESS, registrarABI, provider);
const registrarWrite = new ethers.Contract(REGISTRAR_ADDRESS, registrarABI, signer);

let isPolling = false; // simple lock to prevent overlapping poll cycles

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

/**
 * Builds the full dotted display name from event data.
 * Verified against the actual deployed contract's emit statements:
 *   registerBasic   emits (node, name, "etn", ...)   where name = bare label, e.g. "alice"
 *   registerProject emits (node, fname, "etn", ...)  where fname is ALREADY fully
 *                                                     formed, e.g. "alice.gaming.etn"
 * Both shapes are handled correctly by this function — confirmed by trace.
 */
function buildDisplayName(name, tld) {
  if (name.includes(".")) {
    return name.endsWith(`.${tld}`) ? name : `${name}.${tld}`;
  }
  return `${name}.${tld}`;
}

/**
 * Prefer reading the contract's own stored fullName(node) over reconstructing
 * it client-side — the contract is the source of truth and already computed
 * this exact string at registration time. Falls back to buildDisplayName()
 * only if the read fails for some reason (e.g. transient RPC error).
 */
async function resolveDisplayName(node, name, tld) {
  try {
    const stored = await registrarRead.fullName(node);
    if (stored && stored.length > 0) return stored;
  } catch (err) {
    console.warn(`   ⚠️  Could not read fullName(${node}) from contract, falling back: ${err.message}`);
  }
  return buildDisplayName(name, tld);
}

/**
 * Skips re-processing if an image is already set for this node —
 * makes both the catch-up scan and the regular poll loop idempotent,
 * so accidentally processing the same event twice is harmless.
 */
async function alreadyHasImage(node) {
  try {
    const existing = await registrarRead.nodeImageURI(node);
    return existing && existing.length > 0;
  } catch {
    return false;
  }
}

async function handleEvent(node, name, tld, registrant, lifetime, expiresAt) {
  const skip = await alreadyHasImage(node);
  if (skip) {
    console.log(`⏭️  Skipping ${node} — image already set`);
    return;
  }

  const fullDisplayName = await resolveDisplayName(node, name, tld);

  await processRegistration({
    node,
    name,
    tld,
    registrant,
    registrarWrite,
    fullDisplayName,
  });
}

/**
 * Queries a block range for NameRegistered events, automatically splitting
 * into smaller chunks if the range is large — many RPC providers cap how
 * many blocks you can query in one eth_getLogs call, and silently fail or
 * error out on overly large ranges.
 */
async function processBlockRange(fromBlock, toBlock) {
  const filter = registrarRead.filters.NameRegistered();
  let cursor = fromBlock;

  while (cursor <= toBlock) {
    const chunkEnd = Math.min(cursor + MAX_BLOCK_RANGE_PER_QUERY - 1, toBlock);

    const events = await registrarRead.queryFilter(filter, cursor, chunkEnd);
    if (events.length > 0) {
      console.log(`   Found ${events.length} registration(s) in blocks ${cursor}–${chunkEnd}`);
    }

    for (const event of events) {
      const { node, name, tld, registrant, lifetime, expiresAt } = event.args;
      await handleEvent(node, name, tld, registrant, lifetime, expiresAt);
    }

    cursor = chunkEnd + 1;
  }
}

// ─────────────────────────────────────────────
//  Startup catch-up — runs once before regular polling begins
// ─────────────────────────────────────────────

async function runStartupCatchUp() {
  const currentBlock = await provider.getBlockNumber();
  const persistedBlock = getLastProcessedBlock();

  const fromBlock = persistedBlock !== null
    ? persistedBlock + 1
    : Math.max(0, currentBlock - STARTUP_LOOKBACK_BLOCKS);

  if (persistedBlock !== null) {
    console.log(`🔁 Resuming from persisted block ${persistedBlock} (next: ${fromBlock})`);
  } else {
    console.log(`🔍 No persisted state found — scanning last ${STARTUP_LOOKBACK_BLOCKS} blocks`);
  }

  if (fromBlock > currentBlock) {
    console.log(`✅ Already up to date (persisted block is ahead of or equal to chain head).\n`);
    setLastProcessedBlock(currentBlock);
    return;
  }

  await processBlockRange(fromBlock, currentBlock);
  setLastProcessedBlock(currentBlock);

  console.log(`✅ Startup catch-up complete. Caught up to block ${currentBlock}.\n`);
}

// ─────────────────────────────────────────────
//  Regular polling loop (replaces the old live event subscription)
// ─────────────────────────────────────────────

/**
 * Polling instead of a persistent WebSocket/event subscription, because
 * public RPC providers frequently drop long-lived subscriptions silently —
 * no error, the listener just stops receiving events. Polling is slightly
 * higher latency (bounded by POLL_INTERVAL_MS) but far more reliable for
 * an unattended, long-running service.
 */
function startPolling() {
  console.log(`👂 Polling every ${POLL_INTERVAL_MS / 1000}s for new registrations...`);

  setInterval(async () => {
    if (isPolling) {
      console.log("⏳ Previous poll still running, skipping this tick");
      return;
    }
    isPolling = true;

    try {
      const lastProcessed = getLastProcessedBlock();
      const currentBlock = await provider.getBlockNumber();

      if (lastProcessed === null) {
        // Shouldn't happen since runStartupCatchUp always sets this,
        // but guard against it defensively.
        setLastProcessedBlock(currentBlock);
        return;
      }

      if (currentBlock <= lastProcessed) {
        return; // no new blocks yet
      }

      await processBlockRange(lastProcessed + 1, currentBlock);
      setLastProcessedBlock(currentBlock);
    } catch (err) {
      console.error("⚠️  Polling cycle error:", err.message);
      // Deliberately do NOT update lastProcessedBlock on error — next
      // tick will retry the same range rather than silently skipping it.
    } finally {
      isPolling = false;
    }
  }, POLL_INTERVAL_MS);
}

// ─────────────────────────────────────────────
//  Health check + manual regenerate endpoint + static image serving
// ─────────────────────────────────────────────

function startHealthServer() {
  const app = express();
  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({ status: "ok", service: "etn-nft-image-backend" });
  });

  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      lastProcessedBlock: getLastProcessedBlock(),
    });
  });

  /**
   * Manual trigger to (re)generate an image for a specific node — useful
   * for fixing a one-off failure without restarting the whole service.
   * Protected by a shared secret since it can trigger on-chain writes.
   */
  app.post("/regenerate/:node", async (req, res) => {
    const providedSecret = req.headers["x-admin-secret"];
    if (!process.env.ADMIN_SECRET || providedSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const node = req.params.node;
    try {
      const name = await registrarRead.fullName(node);
      if (!name || name.length === 0) {
        return res.status(404).json({ error: "node not found or has no stored name" });
      }

      const result = await processRegistration({
        node,
        name,
        tld: "etn",
        registrant: null,
        registrarWrite,
        fullDisplayName: name,
      });

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Serve generated images statically — only relevant if STORAGE_TYPE=local
  app.use("/images", express.static(path.join(__dirname, "..", "generated")));

  app.listen(PORT, () => {
    console.log(`🌐 Health check server listening on port ${PORT}`);
  });
}

// ─────────────────────────────────────────────
//  Main
// ─────────────────────────────────────────────

async function main() {
  console.log("🚀 ETN NFT Image Backend starting...");
  console.log(`   Registrar: ${REGISTRAR_ADDRESS}`);
  console.log(`   Backend wallet: ${signer.address}`);
  console.log(`   Storage type: ${process.env.STORAGE_TYPE || "local"}\n`);

  startHealthServer();
  await runStartupCatchUp();
  startPolling();
}

main().catch((err) => {
  console.error("💥 Fatal error during startup:", err);
  process.exit(1);
});