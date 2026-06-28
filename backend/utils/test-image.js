import { generateNftImage } from "./imageGenerator.js";

async function run() {
  try {
    const result = await generateNftImage(
      "etn-villain.planetzephyros.etn",
      "8607034444057300214419640742371266237737643979798175560172819860381375338986"
    );

    console.log("Image generated:", result);
  } catch (err) {
    console.error("Generation failed:", err);
  }
}

run();