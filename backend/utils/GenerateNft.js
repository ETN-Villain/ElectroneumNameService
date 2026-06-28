import express from "express";
import { generateNftImage } from "../utils/imageGenerator.js";
import { uploadNftToR2 } from "../utils/R2Upload.js";
import { setNodeImageOnChain } from "../utils/setNodeImage.js";

const router = express.Router();

router.post("/generate-nft", async (req, res) => {
  const { fullName, nodeHex } = req.body;

  if (!fullName || !nodeHex) {
    return res.status(400).json({ error: "fullName and nodeHex are required" });
  }

  try {
    const { buffer, filename } = await generateNftImage(fullName, nodeHex);

    const base64 = buffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    res.json({
      success: true,
      image: dataUrl,
      filename,
    });

    // Fire-and-forget: upload to R2, then link on-chain once upload succeeds.
    uploadNftToR2(buffer, filename)
      .then((publicUrl) => setNodeImageOnChain(nodeHex, publicUrl))
      .catch((err) => {
        console.error(`R2 upload or on-chain link failed for ${filename}:`, err.message);
      });

  } catch (err) {
    console.error("NFT generation failed:", err);
    res.status(500).json({ error: "Image generation failed", details: err.message });
  }
});

export default router;