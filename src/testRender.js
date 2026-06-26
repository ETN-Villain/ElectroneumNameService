import "dotenv/config";
import { generateNftImage } from "./imageGenerator.js";

/**
 * Quick local test — generates a sample image without touching the
 * blockchain at all. Run with: npm run test-render
 */
async function test() {
  const testNames = [
    "alice.etn",
    "etn-villain.etn",
    "claes.planetetn.etn",
    "a-very-long-name-to-test-shrinking.etn",
  ];

  for (const name of testNames) {
    const fakeNode = "0x" + Buffer.from(name).toString("hex").padEnd(64, "0").slice(0, 64);
    console.log(`Generating image for: ${name}`);
    const outputPath = await generateNftImage(name, fakeNode);
    console.log(`  → Saved to: ${outputPath}\n`);
  }

  console.log("✅ Test render complete. Check the /generated folder.");
}

test().catch((err) => {
  console.error("❌ Test render failed:", err);
  process.exit(1);
});
