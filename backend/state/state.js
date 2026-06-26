import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, "..", "data", "state.json");

/**
 * Tiny file-based state store. Just tracks the last block we've fully
 * processed, so a restart doesn't have to guess how far back to scan.
 *
 * NOTE on Render specifically: Render's default filesystem is ephemeral —
 * it resets on every deploy/restart UNLESS you attach a persistent disk.
 * Without one, this file (and therefore your "last processed block" memory)
 * disappears on every redeploy, and STARTUP_LOOKBACK_BLOCKS becomes your
 * only safety net again. If you want true durability across deploys,
 * add a Render persistent disk and mount it at this project's /data path,
 * or swap this for a tiny external store (e.g. a single row in Postgres,
 * or even a GitHub Gist / S3 object) instead of local disk.
 */

function ensureDataDir() {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getLastProcessedBlock() {
  try {
    if (!fs.existsSync(STATE_FILE)) return null;
    const raw = fs.readFileSync(STATE_FILE, "utf-8");
    const data = JSON.parse(raw);
    return typeof data.lastProcessedBlock === "number" ? data.lastProcessedBlock : null;
  } catch (err) {
    console.error("⚠️  Failed to read state file:", err.message);
    return null;
  }
}

export function setLastProcessedBlock(blockNumber) {
  try {
    ensureDataDir();
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify({ lastProcessedBlock: blockNumber, updatedAt: new Date().toISOString() }, null, 2)
    );
  } catch (err) {
    console.error("⚠️  Failed to write state file:", err.message);
  }
}