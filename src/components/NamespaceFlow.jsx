import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ArrowLeft } from "lucide-react";
import { green, greenGlow, muted, mutedLight, error, panel2, border, orange } from "../styles/theme.js";
import { useNamespace } from "../hooks/useNamespace.js";
import NeonButton from "./NeonButton.jsx";
import { containsBlockedWord } from "../utils/obscenity.js";

export default function NamespaceFlow({
  wallet,
  onBack = null,
  onSuccess = null,
}) {
  const [namespaceInput, setNamespaceInput] = useState("");
  const [lifetime, setLifetime] = useState(false);
  const [priceYear, setPriceYear] = useState(null);
  const [priceLifetime, setPriceLifetime] = useState(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [step, setStep] = useState("choose");
  const [txHash, setTxHash] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [nftImage, setNftImage] = useState(null);

const { getPrice, buyNamespace, getProjectPriceFloors, setNamespacePricing } = useNamespace();

const [yearFloor, setYearFloor] = useState(null);
const [lifetimeFloor, setLifetimeFloor] = useState(null);
const [yearPriceInput, setYearPriceInput] = useState("");
const [lifetimePriceInput, setLifetimePriceInput] = useState("");
const [pricingError, setPricingError] = useState(null);
const [pricingTxLoading, setPricingTxLoading] = useState(false);

  // Fetch BOTH prices on mount
  useEffect(() => {
    (async () => {
      setPriceLoading(true);
      try {
        const pYear = await getPrice(false);
        const pLifetime = await getPrice(true);
        setPriceYear(pYear);
        setPriceLifetime(pLifetime);
      } catch (err) {
        console.error("Price fetch failed:", err);
        setPriceYear(null);
        setPriceLifetime(null);
      }
      setPriceLoading(false);
    })();
  }, [getPrice]);

const handleBuy = async () => {
  if (!wallet.isConnected) {
    setErrorMsg("Wallet not connected");
    return;
  }

  if (!namespaceInput || namespaceInput.length < 1) {
    setErrorMsg("Namespace name required");
    return;
  }

  if (containsBlockedWord(namespaceInput)) {
    setErrorMsg("This name isn't allowed");
    return;
  }

  setTxLoading(true);
  setErrorMsg(null);

  try {
    const signer = await wallet.getSigner();
    const result = await buyNamespace(namespaceInput, signer, lifetime);

    setTxHash(result.txHash);

    if (result.node) {
      generateNamespaceNft(`${namespaceInput}.etn`, result.node);
    } else {
      console.warn("No node found in namespace receipt — skipping NFT generation");
    }

    // Load price floors before showing the pricing step
    try {
      const { yearFloor: yf, lifetimeFloor: lf } = await getProjectPriceFloors();
      setYearFloor(yf);
      setLifetimeFloor(lf);
      setYearPriceInput(ethers.formatEther(yf));
      setLifetimePriceInput(ethers.formatEther(lf));
    } catch (err) {
      console.error("Failed to load price floors:", err);
    }

    setStep("setPricing");
    onSuccess?.(result);
  } catch (err) {
    console.error("Namespace creation error:", err);
    setErrorMsg(err?.reason || err?.message || "Creation failed");
    setStep("error");
  } finally {
    setTxLoading(false);
  }
};

const handleSetPricing = async () => {
  setPricingError(null);

  const yearWei = ethers.parseEther(yearPriceInput || "0");
  const lifetimeWei = ethers.parseEther(lifetimePriceInput || "0");

  if (yearFloor !== null && yearWei < yearFloor) {
    setPricingError(`1-year price must be at least ${ethers.formatEther(yearFloor)} ETN`);
    return;
  }
  if (lifetimeFloor !== null && lifetimeWei < lifetimeFloor) {
    setPricingError(`Lifetime price must be at least ${ethers.formatEther(lifetimeFloor)} ETN`);
    return;
  }

  setPricingTxLoading(true);
  try {
    const signer = await wallet.getSigner();
    await setNamespacePricing(namespaceInput, yearWei, lifetimeWei, signer);
    setStep("success");
  } catch (err) {
    setPricingError(err?.reason || err?.message || "Failed to set pricing");
  } finally {
    setPricingTxLoading(false);
  }
};

const handleSkipPricing = () => {
  setStep("success");
};

const generateNamespaceNft = async (fullName, nodeHex) => {
  try {
    const res = await fetch("https://electroneumnameservice.onrender.com/api/generate-nft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, nodeHex, template: "namespace" }),
    });
    const data = await res.json();
    if (data.success) {
      setNftImage(data.image);
    }
  } catch (err) {
    console.error("NFT generation request failed:", err);
  }
};

  const priceYearEth = priceYear ? parseFloat(ethers.formatEther(priceYear)).toFixed(2) : "0.00";
  const priceLifetimeEth = priceLifetime ? parseFloat(ethers.formatEther(priceLifetime)).toFixed(2) : "0.00";
  const selectedPrice = lifetime ? priceLifetimeEth : priceYearEth;

  return (
    <div style={{ width: "100%", maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
      {step === "choose" && (
        <>
{/* Back button */}
<div style={{ marginBottom: 20 }}>
  <button
    onClick={onBack}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 13,
      fontWeight: 600,
      color: green,
      background: "rgba(0, 255, 140, 0.06)",
      border: `1px solid ${border}`,
      borderRadius: 10,
      cursor: "pointer",
      padding: "8px 14px",
      transition: "background 0.15s ease, transform 0.1s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "rgba(0, 255, 140, 0.14)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "rgba(0, 255, 140, 0.06)";
    }}
    onMouseDown={(e) => {
      e.currentTarget.style.transform = "scale(0.97)";
    }}
    onMouseUp={(e) => {
      e.currentTarget.style.transform = "scale(1)";
    }}
  >
    <ArrowLeft size={14} />
    Back
  </button>
</div>

{/* Header */}
<div style={{ marginBottom: 32, textAlign: "center" }}>
  <div style={{
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: muted,
    marginBottom: 10,
  }}>
    New Namespace
  </div>
  <h2 style={{
    fontSize: 30,
    fontWeight: 900,
    margin: "0 0 12px 0",
    color: "#fff",
    letterSpacing: 0.5,
    textShadow: `0 0 16px ${greenGlow}`,
  }}>
    Create Subdomain
  </h2>
  <div style={{
    width: 40,
    height: 2,
    background: green,
    margin: "0 auto 14px",
    borderRadius: 2,
    boxShadow: `0 0 8px ${greenGlow}`,
  }} />
  <p style={{ fontSize: 13, color: mutedLight, margin: 0, lineHeight: 1.5 }}>
    Your own "project".etn namespace for team members or community supporters
  </p>
</div>

          {/* Namespace input */}
          <div style={{ marginBottom: 24 }}>
            <input
              type="text"
              placeholder="supplychainltd"
              value={namespaceInput}
              onChange={(e) => setNamespaceInput(e.target.value.toLowerCase().trim())}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: `1px solid ${border}`,
                background: panel2,
                color: "#fff",
                fontSize: 16,
                fontWeight: 600,
                boxSizing: "border-box",
                outline: "none",
                marginBottom: 12,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = green;
                e.currentTarget.style.boxShadow = `0 0 12px ${greenGlow}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = border;
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            {namespaceInput && (
              <div style={{
                padding: 12,
                borderRadius: 10,
                background: panel2,
                border: `1px solid ${border}`,
                fontSize: 12,
                color: mutedLight,
                textAlign: "center",
                fontFamily: "monospace",
              }}>
                {namespaceInput}.etn
              </div>
            )}
          </div>

          {/* Duration choice with BOTH prices visible */}
          <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
            <button
              onClick={() => setLifetime(false)}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 12,
                border: `2px solid ${!lifetime ? green : border}`,
                background: !lifetime ? `rgba(24,187,26,0.1)` : panel2,
                color: "#fff",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: !lifetime ? `0 0 12px ${greenGlow}` : "none",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>1 Year</div>
              {priceLoading ? (
                <div style={{ fontSize: 12, color: muted }}>Loading...</div>
              ) : (
                <div style={{ fontSize: 18, fontWeight: 900, color: green }}>
                  {priceYearEth} ETN
                </div>
              )}
            </button>

            <button
              onClick={() => setLifetime(true)}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 12,
                border: `2px solid ${lifetime ? green : border}`,
                background: lifetime ? `rgba(24,187,26,0.1)` : panel2,
                color: "#fff",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: lifetime ? `0 0 12px ${greenGlow}` : "none",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Lifetime</div>
              {priceLoading ? (
                <div style={{ fontSize: 12, color: muted }}>Loading...</div>
              ) : (
                <div style={{ fontSize: 18, fontWeight: 900, color: green }}>
                  {priceLifetimeEth} ETN
                </div>
              )}
            </button>
          </div>

          {/* Info box */}
          <div style={{
            padding: 14,
            borderRadius: 10,
            background: panel2,
            border: `1px solid ${border}`,
            marginBottom: 24,
            fontSize: 12,
            color: mutedLight,
            lineHeight: 1.6,
          }}>
            <div style={{ marginBottom: 8 }}>
              <strong>What you get:</strong>
            </div>
            <div>✓ Custom "project".etn subdomain</div>
            <div>✓ Mint names under it (warehouse.supplychainltd.etn)</div>
            <div>✓ Full control & ownership</div>
            {!lifetime && (
              <div>✓ Renewable after 1 year</div>
            )}
          </div>

          {/* Warning */}
          <div style={{
            padding: 12,
            borderRadius: 10,
            background: `rgba(255,122,0,0.1)`,
            border: `1px solid ${orange}`,
            marginBottom: 24,
            fontSize: 12,
            color: "#ffb366",
            textAlign: "center",
          }}>
            Creating a subdomain involves a blockchain transaction
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12 }}>
            {onBack && (
              <NeonButton
                variant="dark"
                onClick={onBack}
                style={{ flex: 1 }}
              >
                Back
              </NeonButton>
            )}
            <NeonButton
              variant="green"
              onClick={handleBuy}
              disabled={priceLoading || txLoading || !namespaceInput}
              loading={txLoading}
              style={{ flex: 1 }}
            >
              {txLoading ? "Creating..." : `Create for ${selectedPrice} ETN`}
            </NeonButton>
          </div>
        </>
      )}

{step === "setPricing" && (
  <div style={{ textAlign: "center", padding: "40px 20px" }}>
    <h2 style={{
      fontSize: 24,
      fontWeight: 900,
      color: green,
      marginBottom: 8,
    }}>
      Set Your Pricing
    </h2>
    <p style={{ fontSize: 13, color: mutedLight, marginBottom: 24, lineHeight: 1.5 }}>
      Set prices for names registered under <strong>{namespaceInput}.etn</strong>.
      You'll earn 80% of every registration.
    </p>

    <div style={{ marginBottom: 16, textAlign: "left" }}>
      <label style={{ fontSize: 12, color: muted, display: "block", marginBottom: 6 }}>
        1 Year Price (ETN)
      </label>
      <input
        type="number"
        value={yearPriceInput}
        onChange={(e) => setYearPriceInput(e.target.value)}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 10,
          border: `1px solid ${border}`,
          background: panel2,
          color: "#fff",
          fontSize: 15,
          fontWeight: 600,
          boxSizing: "border-box",
          outline: "none",
        }}
      />
      {yearFloor !== null && (
        <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>
          Minimum: {ethers.formatEther(yearFloor)} ETN
        </div>
      )}
    </div>

    <div style={{ marginBottom: 16, textAlign: "left" }}>
      <label style={{ fontSize: 12, color: muted, display: "block", marginBottom: 6 }}>
        Lifetime Price (ETN)
      </label>
      <input
        type="number"
        value={lifetimePriceInput}
        onChange={(e) => setLifetimePriceInput(e.target.value)}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 10,
          border: `1px solid ${border}`,
          background: panel2,
          color: "#fff",
          fontSize: 15,
          fontWeight: 600,
          boxSizing: "border-box",
          outline: "none",
        }}
      />
      {lifetimeFloor !== null && (
        <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>
          Minimum: {ethers.formatEther(lifetimeFloor)} ETN
        </div>
      )}
    </div>

    {pricingError && (
      <div style={{ fontSize: 12, color: error, marginBottom: 16 }}>
        {pricingError}
      </div>
    )}

    <div style={{ display: "flex", gap: 12 }}>
      <NeonButton
        variant="dark"
        onClick={handleSkipPricing}
        disabled={pricingTxLoading}
        style={{ flex: 1 }}
      >
        Skip (use defaults)
      </NeonButton>
      <NeonButton
        variant="green"
        onClick={handleSetPricing}
        disabled={pricingTxLoading}
        loading={pricingTxLoading}
        style={{ flex: 1 }}
      >
        {pricingTxLoading ? "Setting..." : "Set Prices"}
      </NeonButton>
    </div>
  </div>
)}

{step === "success" && (
  <div style={{ textAlign: "center", padding: "40px 20px" }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
    <h2 style={{
      fontSize: 28,
      fontWeight: 900,
      color: green,
      marginBottom: 8,
    }}>
      Subdomain Created!
    </h2>

    {nftImage ? (
      <img
        src={nftImage}
        alt={`${namespaceInput}.etn`}
        style={{
          width: "100%",
          maxWidth: 280,
          borderRadius: 14,
          border: `1px solid ${border}`,
          boxShadow: `0 0 20px ${greenGlow}`,
          marginBottom: 20,
        }}
      />
    ) : (
      <div style={{
        width: "100%",
        maxWidth: 280,
        aspectRatio: "1 / 1",
        margin: "0 auto 20px",
        borderRadius: 14,
        border: `1px solid ${border}`,
        background: panel2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        color: muted,
      }}>
        Generating artwork...
      </div>
    )}

    <p style={{
      fontSize: 13,
      color: mutedLight,
      marginBottom: 24,
      lineHeight: 1.6,
    }}>
      <strong>{namespaceInput}.etn</strong> is now your subdomain.
      {nftImage ? (
        <>
          <br />
          You can now mint names under it using Create Name | Project Name
        </>
      ) : (
        <>
          <br />
          Your NFT is being generated and will appear shortly.
          <br />
          You can now mint names under it using Create Name | Project Name
        </>
      )}
    </p>

    {txHash && (
    <a  
        href={`https://blockexplorer.electroneum.com/tx/${txHash}`}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-block",
          fontSize: 12,
          color: green,
          textDecoration: "none",
          marginBottom: 24,
          borderBottom: `1px solid ${green}`,
        }}
      >
        View Transaction →
      </a>
    )}

    <NeonButton
      variant="green"
      onClick={() => window.location.reload()}
      style={{ width: "100%" }}
    >
      Create Another Subdomain
    </NeonButton>
  </div>
)}

      {step === "error" && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: error }}>✗</div>
          <h2 style={{
            fontSize: 24,
            fontWeight: 900,
            color: error,
            marginBottom: 8,
          }}>
            Creation Failed
          </h2>
          <p style={{
            fontSize: 13,
            color: mutedLight,
            marginBottom: 24,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {errorMsg || "Something went wrong. Please try again."}
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <NeonButton
              variant="dark"
              onClick={() => setStep("choose")}
              style={{ flex: 1 }}
            >
              Back
            </NeonButton>
            <NeonButton
              variant="green"
              onClick={handleBuy}
              disabled={txLoading}
              loading={txLoading}
              style={{ flex: 1 }}
            >
              Try Again
            </NeonButton>
          </div>
        </div>
      )}
    </div>
  );
}