import { ethers } from "ethers";
import { generateNftImage } from "./imageGenerator.js";
import { uploadNftToR2 } from "./R2Upload.js";
import { setNodeImageOnChain } from "./setNodeImage.js";
import dotenv from "dotenv";

dotenv.config();

const REGISTRAR_ABI = [
  "event NameRegistered(bytes32 indexed node, string name, string tld, address indexed registrant, bool lifetime, uint256 expiresAt)",
  "event ProjectCreated(string project, bytes32 indexed projectNode, address indexed creator, bool lifetime, uint256 expiresAt)",
];

const CHUNK_SIZE = 500;

async function queryEventsInChunks(contract, eventName, fromBlock, toBlock) {
  const allEvents = [];
  let start = fromBlock;

  while (start <= toBlock) {
    const end = Math.min(start + CHUNK_SIZE - 1, toBlock);
    console.log(`  Querying ${eventName} blocks ${start} - ${end}...`);

    try {
      const events = await contract.queryFilter(eventName, start, end);
      allEvents.push(...events);
    } catch (err) {
      console.error(`  Failed on range ${start}-${end}:`, err.shortMessage || err.message);
      throw err;
    }

    start = end + 1;
  }

  return allEvents;
}

async function run() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const registrar = new ethers.Contract(process.env.REGISTRAR_ADDRESS, REGISTRAR_ABI, provider);

  const fromBlock = 14479792;
  const toBlock = await provider.getBlockNumber();

  console.log(`Scanning from block ${fromBlock} to ${toBlock} (${toBlock - fromBlock} blocks) in chunks of ${CHUNK_SIZE}...`);

  console.log("\nScanning NameRegistered events...");
  const nameEvents = await queryEventsInChunks(registrar, "NameRegistered", fromBlock, toBlock);

  console.log("\nScanning ProjectCreated events...");
  const projectEvents = await queryEventsInChunks(registrar, "ProjectCreated", fromBlock, toBlock);

  const targets = [];

  for (const evt of nameEvents) {
    const { node, name } = evt.args;
    targets.push({ fullName: name, nodeHex: node, template: "default" });
  }

  for (const evt of projectEvents) {
    const { project, projectNode } = evt.args;
    targets.push({ fullName: `${project}.etn`, nodeHex: projectNode, template: "namespace" });
  }

  console.log(`\nFound ${targets.length} tokens to backfill.`);

  for (const { fullName, nodeHex, template } of targets) {
    try {
      console.log(`\nProcessing ${fullName} (${nodeHex})...`);

      const { buffer, filename } = await generateNftImage(fullName, nodeHex, template);
      const publicUrl = await uploadNftToR2(buffer, filename);
      await setNodeImageOnChain(nodeHex, publicUrl);

      console.log(`✅ Done: ${fullName} -> ${publicUrl}`);
    } catch (err) {
      console.error(`❌ Failed for ${fullName} (${nodeHex}):`, err.message);
    }
  }

  console.log("\nBackfill complete.");
}

run();