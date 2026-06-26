import { generateNftImage } from "./imageGenerator.js";
import { uploadImage } from "./storage.js";
import path from "path";

/**
 * Processes a single NameRegistered event: generates the image,
 * uploads it, and writes the resulting URL back on-chain.
 *
 * @param {object} params
 * @param {string} params.node       - bytes32 node hash (hex string)
 * @param {string} params.name       - the label that was registered (not full name)
 * @param {string} params.tld        - always "etn" currently
 * @param {string} params.registrant - address that registered the name
 * @param {ethers.Contract} params.registrarWrite - contract instance connected to the signer
 * @param {string} params.fullDisplayName - full dotted name, e.g. "alice.gaming.etn"
 */
export async function processRegistration({
  node,
  name,
  tld,
  registrant,
  registrarWrite,
  fullDisplayName,
}) {
  console.log(`\n📝 New registration detected`);
  console.log(`   Node:       ${node}`);
  console.log(`   Name:       ${fullDisplayName}`);
  console.log(`   Registrant: ${registrant}`);

  try {
    // 1. Generate the image with the name printed on it
    console.log(`   🎨 Generating image...`);
    const localFilePath = await generateNftImage(fullDisplayName, node);
    const filename = path.basename(localFilePath);
    console.log(`   ✅ Image generated: ${filename}`);

    // 2. Upload it (or, for local storage, it's already in the served directory)
    console.log(`   ☁️  Uploading...`);
    const imageUrl = await uploadImage(localFilePath, filename);
    console.log(`   ✅ Image available at: ${imageUrl}`);

    // 3. Write the URL back to the contract
    console.log(`   ⛓️  Writing to chain...`);
    const tx = await registrarWrite.setNodeImage(node, imageUrl);
    console.log(`   ⏳ Tx submitted: ${tx.hash}`);
    await tx.wait();
    console.log(`   ✅ Confirmed — ${fullDisplayName} now has its NFT image set\n`);

    return { success: true, imageUrl, txHash: tx.hash };
  } catch (err) {
    console.error(`   ❌ Failed to process ${fullDisplayName}:`, err.message);
    return { success: false, error: err.message };
  }
}
