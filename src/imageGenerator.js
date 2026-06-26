import { createCanvas, loadImage, registerFont } from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Config
const STOCK_IMAGE_PATH = process.env.STOCK_IMAGE_PATH || "./assets/ETNNameServiceTemplate.png";
const FONT_SIZE         = parseInt(process.env.FONT_SIZE || "64", 10);
const FONT_COLOR        = process.env.FONT_COLOR || "#ffffff";

const GENERATED_DIR = path.join(__dirname, "..", "generated");

// Font
const fontPath = path.resolve(__dirname, "..", "fonts", "Orbitron-Bold.ttf");

try {
  registerFont(fontPath, { family: "Orbitron", weight: "700" });
  console.log("✅ Orbitron Bold registered successfully");
} catch (err) {
  console.error("❌ Font registration failed:", err.message);
}

if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR, { recursive: true });

let cachedStockImage = null;

async function getStockImage() {
  if (cachedStockImage) return cachedStockImage;
  const fullPath = path.resolve(__dirname, "..", STOCK_IMAGE_PATH);
  if (!fs.existsSync(fullPath)) throw new Error(`Stock image not found: ${fullPath}`);
  cachedStockImage = await loadImage(fullPath);
  return cachedStockImage;
}

function wrapEnsName(name) {
  const parts = name.split(".");

  // Simple name (alice)
  if (parts.length === 1) {
    return [name];
  }

  // name.etn
  if (parts.length === 2) {
    const [label, tld] = parts;

    // If the label is long, move .etn to the next line
    if (label.length > 16) {
      return [
        label,
        `.${tld}`
      ];
    }

    return [name];
  }

  // name.project.etn
  if (parts.length === 3) {
    const [label, project, tld] = parts;

    // Always move the project onto a new line
    if (project.length > 12) {
      // Very long project -> 3 lines
      return [
        label,
        `.${project}`,
        `.${tld}`
      ];
    }

    // Normal project -> 2 lines
    return [
      label,
      `.${project}.${tld}`
    ];
  }

  // Future-proof:
  // name.one.two.three.etn
  const lines = [parts[0]];
  let current = "";

  for (let i = 1; i < parts.length; i++) {
    const piece = "." + parts[i];

    if ((current + piece).length > 16 && current) {
      lines.push(current);
      current = piece;
    } else {
      current += piece;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

export async function generateNftImage(fullName, nodeHex) {
  const stockImage = await getStockImage();
  const canvas = createCanvas(stockImage.width, stockImage.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(stockImage, 0, 0);

  let fontSize = FONT_SIZE;
  const maxWidth = stockImage.width * 0.72;

  const fontStack = '"Orbitron", Arial Black, sans-serif';

  // First pass to find best font size
  let bestLines = [];
  while (fontSize > 16) {
    ctx.font = `700 ${fontSize}px ${fontStack}`;
    bestLines = wrapEnsName(fullName);
    const widest = Math.max(
    ...bestLines.map(line => ctx.measureText(line).width)
);

if (widest < maxWidth * 0.95) {
    break;
}

fontSize -= 2;
  }

  // Final render with best size
  ctx.font = `700 ${fontSize}px ${fontStack}`;
  ctx.fillStyle = FONT_COLOR;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  const lineHeight = fontSize * 1.15;
  const totalHeight = bestLines.length * lineHeight;

  const box = { 
    x: stockImage.width * 0.02, 
    y: stockImage.height * 0.28, 
    w: stockImage.width * 0.55, 
    h: stockImage.height * 0.50 
  };

  const x = box.x + box.w / 2;
  let y = box.y + (box.h - totalHeight) / 2 + lineHeight / 2;

  for (const line of bestLines) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }

  const safeId = nodeHex.replace(/^0x/, "");
  const outputPath = path.join(GENERATED_DIR, `${safeId}.png`);

  fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));
  console.log(`Image generated: ${outputPath}`);
  return outputPath;
}