import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { green, greenGlow, muted, mutedLight, error, panel2, border, orange } from "../styles/theme.js";
import { useNamespace } from "../hooks/useNamespace.js";
import NeonButton from "./NeonButton.jsx";

export default function NamespaceFlow({
  wallet,
  onBack = null,
  onSuccess = null,
}) {
  const [namespaceInput, setNamespaceInput] = useState("");
  const [lifetime, setLifetime] = useState(false);
  const [price, setPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [step, setStep] = useState("choose"); // "choose", "success", "error"
  const [txHash, setTxHash] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const { getPrice, buyNamespace } = useNamespace();

  // Fetch price when component mounts or lifetime changes
  useEffect(() => {
    (async () => {
      setPriceLoading(true);
      try {
        const p = await getPrice(lifetime);
        setPrice(p);
      } catch (err) {
        console.error("Price fetch failed:", err);
        setPrice(null);
      }
      setPriceLoading(false);
    })();
  }, [lifetime, getPrice]);

  const handleBuy = async () => {
    if (!wallet.isConnected) {
      setErrorMsg("Wallet not connected");
      return;
    }

    if (!namespaceInput || namespaceInput.length < 1) {
      setErrorMsg("Namespace name required");
      return;
    }

    setTxLoading(true);
    setErrorMsg(null);

    try {
      const signer = await wallet.getSigner();

      const result = await buyNamespace(namespaceInput, signer, lifetime);

      setTxHash(result.txHash);
      setStep("success");
      onSuccess?.(result);
    } catch (err) {
      console.error("Namespace creation error:", err);
      setErrorMsg(err?.reason || err?.message || "Creation failed");
      setStep("error");
    } finally {
      setTxLoading(false);
    }
  };

  const priceInEth = price ? parseFloat(ethers.formatEther(price)).toFixed(2) : "0.00";

  return (
    <div style={{ width: "100%", maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
      {step === "choose" && (
        <>
          {/* Header */}
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 900,
              margin: "0 0 8px 0",
              color: green,
            }}>
              Create Subdomain
            </h2>
            <p style={{ fontSize: 13, color: mutedLight, margin: 0 }}>
              Your own .etn namespace for team members
            </p>
          </div>

          {/* Namespace input */}
          <div style={{ marginBottom: 24 }}>
            <input
              type="text"
              placeholder="mycompany"
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

          {/* Duration choice */}
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
                  {priceInEth} ETN
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
                  {priceInEth} ETN
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
            <div>✓ Custom .etn subdomain</div>
            <div>✓ Mint names under it (alice.mycompany.etn)</div>
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
            Creating a subdomain involves a blockchain transaction and gas fees
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
              {txLoading ? "Creating..." : `Create for ${priceInEth} ETN`}
            </NeonButton>
          </div>
        </>
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
          <p style={{
            fontSize: 13,
            color: mutedLight,
            marginBottom: 24,
            lineHeight: 1.6,
          }}>
            <strong>{namespaceInput}.etn</strong> is now your subdomain.
            <br />
            You can now mint names under it.
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