import { createCanvas, loadImage, registerFont } from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --------------------------------------------------
// Config
// --------------------------------------------------

const STOCK_IMAGE_PATH =
  process.env.STOCK_IMAGE_PATH || "../assets/ETNNameServiceTemplate.png";

const FONT_SIZE = parseInt(process.env.FONT_SIZE || "64", 10);
const FONT_COLOR = process.env.FONT_COLOR || "#ffffff";

// --------------------------------------------------
// Font
// --------------------------------------------------

const fontPath = path.resolve(
  __dirname,
  "..",
  "fonts",
  "Orbitron-Bold.ttf"
);

try {
  registerFont(fontPath, {
    family: "Orbitron",
    weight: "700",
  });

  console.log("✅ Orbitron loaded");
} catch (err) {
  console.error("Font registration failed:", err.message);
}

let cachedStockImage = null;

// --------------------------------------------------

async function getStockImage() {
  if (cachedStockImage) return cachedStockImage;

  const fullPath = path.resolve(__dirname, "..", STOCK_IMAGE_PATH);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing template image: ${fullPath}`);
  }

  cachedStockImage = await loadImage(fullPath);

  return cachedStockImage;
}

// --------------------------------------------------
// ENS wrapping rules
// --------------------------------------------------

function wrapEnsName(fullName) {
  const parts = fullName.split(".");

  // alice.etn
  if (parts.length === 2) {
    const name = parts[0];

    if (name.length > 16) {
      return [
        name,
        ".etn"
      ];
    }

    return [fullName];
  }

  // alice.project.etn
  if (parts.length === 3) {
    const [name, project] = parts;

    if (project.length > 12) {
      return [
        name,
        `.${project}`,
        ".etn"
      ];
    }

    return [
      name,
      `.${project}.etn`
    ];
  }

  // Anything deeper
  return [fullName];
}

// --------------------------------------------------
// Generates the NFT image and returns the raw PNG buffer.
// Does NOT write to disk - caller decides what to do with the buffer
// (e.g. send to frontend, upload to R2, both).
// --------------------------------------------------

export async function generateNftImage(fullName, nodeHex) {
  const stockImage = await getStockImage();

  const canvas = createCanvas(
    stockImage.width,
    stockImage.height
  );

  const ctx = canvas.getContext("2d");

  ctx.drawImage(stockImage, 0, 0);

  const fontStack = '"Orbitron", Arial Black, sans-serif';

  let fontSize = FONT_SIZE;

  const maxWidth = stockImage.width * 0.70;

  let lines = wrapEnsName(fullName);

  while (fontSize > 20) {
    ctx.font = `700 ${fontSize}px ${fontStack}`;

    const widest = Math.max(
      ...lines.map(l => ctx.measureText(l).width)
    );

    if (widest <= maxWidth) break;

    fontSize -= 2;
  }

  ctx.font = `700 ${fontSize}px ${fontStack}`;
  ctx.fillStyle = FONT_COLOR;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Nice glow
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // --------------------------------------------------
  // Text box
  // --------------------------------------------------

  const box = {
    x: stockImage.width * 0.03,
    y: stockImage.height * 0.20,
    w: stockImage.width * 0.52,
    h: stockImage.height * 0.55
  };

  const lineHeight = fontSize * 1.18;

  const totalHeight = lines.length * lineHeight;

  const x = box.x + box.w / 2;

  const verticalOffset = stockImage.height * 0.07;

  let y =
    box.y +
    (box.h - totalHeight) / 2 +
    lineHeight / 2 +
    verticalOffset;

  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }

  const safeId = nodeHex.replace(/^0x/, "");
  const buffer = canvas.toBuffer("image/png");
  const filename = `${safeId}.png`;

  return { buffer, filename };
}