import express from "express";
import { generateNftImage } from "../utils/imageGenerator.js";
import { uploadNftToR2 } from "../utils/r2Upload.js";

const router = express.Router();

router.post("/generate-nft", async (req, res) => {
  const { fullName, nodeHex } = req.body;

  if (!fullName || !nodeHex) {
    return res.status(400).json({ error: "fullName and nodeHex are required" });
  }

  try {
    const { buffer, filename } = await generateNftImage(fullName, nodeHex);

    // Respond to the frontend immediately with the image as a data URL,
    // so the user sees it right away without waiting on the R2 upload.
    const base64 = buffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    res.json({
      success: true,
      image: dataUrl,
      filename,
    });

    // Fire-and-forget: upload to R2 AFTER responding. Errors here are
    // logged but don't affect the user-facing response, since it already
    // went out above.
    uploadNftToR2(buffer, filename).catch((err) => {
      console.error(`R2 upload failed for ${filename}:`, err.message);
    });

  } catch (err) {
    console.error("NFT generation failed:", err);
    res.status(500).json({ error: "Image generation failed", details: err.message });
  }
});

export default router;