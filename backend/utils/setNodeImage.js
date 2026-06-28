import { ethers } from "ethers";

const REGISTRAR_ABI = [
  "function setNodeImage(bytes32 node, string calldata uri) external",
];

let cachedContract = null;

function getContract() {
  if (cachedContract) return cachedContract;

  const requiredVars = ["RPC_URL", "REGISTRAR_ADDRESS", "BACKEND_PRIVATE_KEY"];
  for (const key of requiredVars) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);

  cachedContract = new ethers.Contract(
    process.env.REGISTRAR_ADDRESS,
    REGISTRAR_ABI,
    wallet
  );

  return cachedContract;
}

/**
 * Calls setNodeImage(node, uri) on the registrar contract, linking the
 * NFT's on-chain metadata to its R2-hosted image.
 *
 * Intended to be called fire-and-forget after a successful R2 upload —
 * callers should attach a .catch() to log failures.
 */
export async function setNodeImageOnChain(nodeHex, imageUrl) {
  const registrar = getContract();

  const tx = await registrar.setNodeImage(nodeHex, imageUrl);
  const receipt = await tx.wait();

  console.log(`✅ setNodeImage confirmed for ${nodeHex}: ${tx.hash}`);

  return { txHash: tx.hash, blockNumber: receipt.blockNumber };
}