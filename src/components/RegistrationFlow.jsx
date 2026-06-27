import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { green, greenGlow, muted, mutedLight, error, panel2, border, orange } from "../styles/theme.js";
import { useRegistration } from "../hooks/useRegistration.js";
import NeonButton from "./NeonButton.jsx";

export default function RegistrationFlow({ 
  nameData, 
  wallet, 
  onBack = null, 
  onSuccess = null 
}) {
  const [lifetime, setLifetime] = useState(false);
  const [priceYear, setPriceYear] = useState(null);
  const [priceLifetime, setPriceLifetime] = useState(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [step, setStep] = useState("choose");
  const [txHash, setTxHash] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const { getPrice, registerBasicName, registerProjectName } = useRegistration();

  const displayName = nameData.type === "basic"
    ? `${nameData.name}.etn`
    : `${nameData.name}.${nameData.project}.etn`;

  // Fetch BOTH prices on mount
  useEffect(() => {
    (async () => {
      setPriceLoading(true);
      try {
        const pYear = await getPrice(nameData.type, false);
        const pLifetime = await getPrice(nameData.type, true);
        setPriceYear(pYear);
        setPriceLifetime(pLifetime);
      } catch (err) {
        console.error("Price fetch failed:", err);
        setPriceYear(null);
        setPriceLifetime(null);
      }
      setPriceLoading(false);
    })();
  }, [nameData.type, getPrice]);

  const handleRegister = async () => {
    if (!wallet.isConnected) {
      setErrorMsg("Wallet not connected");
      return;
    }

    setTxLoading(true);
    setErrorMsg(null);

    try {
      const signer = await wallet.getSigner();

      let result;
      if (nameData.type === "basic") {
        result = await registerBasicName(
          nameData.name,
          signer,
          lifetime,
          null
        );
      } else {
        result = await registerProjectName(
          nameData.name,
          nameData.project,
          signer,
          lifetime,
          null
        );
      }

      setTxHash(result.txHash);
      setStep("success");
      onSuccess?.(result);
    } catch (err) {
      console.error("Registration error:", err);
      setErrorMsg(err?.reason || err?.message || "Registration failed");
      setStep("error");
    } finally {
      setTxLoading(false);
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
                fontSize: 13,
                color: green,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ← Back
            </button>
          </div>

          {/* Header */}
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <h2 style={{ 
              fontSize: 28, 
              fontWeight: 900, 
              margin: "0 0 8px 0",
              color: green,
            }}>
              Register {displayName}
            </h2>
            <p style={{ fontSize: 13, color: mutedLight, margin: 0 }}>
              Choose your registration term
            </p>
          </div>

          {/* Duration choice with BOTH prices visible */}
          <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
            {/* 1-Year option */}
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
              onMouseEnter={(e) => {
                if (lifetime) {
                  e.currentTarget.style.borderColor = green;
                  e.currentTarget.style.boxShadow = `0 0 8px ${greenGlow}`;
                }
              }}
              onMouseLeave={(e) => {
                if (lifetime) {
                  e.currentTarget.style.borderColor = border;
                  e.currentTarget.style.boxShadow = "none";
                }
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

            {/* Lifetime option */}
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
              onMouseEnter={(e) => {
                if (!lifetime) {
                  e.currentTarget.style.borderColor = green;
                  e.currentTarget.style.boxShadow = `0 0 8px ${greenGlow}`;
                }
              }}
              onMouseLeave={(e) => {
                if (!lifetime) {
                  e.currentTarget.style.borderColor = border;
                  e.currentTarget.style.boxShadow = "none";
                }
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
            <div>✓ Permanent .etn name</div>
            <div>✓ Auto-generated NFT artwork</div>
            <div>✓ Address resolution</div>
            {!lifetime && (
              <div>✓ Renewable after 1 year</div>
            )}
          </div>

          {/* Warning about payments */}
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
            Registration involves a blockchain transaction and will cost gas
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
              onClick={handleRegister}
              disabled={priceLoading || txLoading}
              loading={txLoading}
              style={{ flex: 1 }}
            >
              {txLoading ? "Processing..." : `Register for ${selectedPrice} ETN`}
            </NeonButton>
          </div>
        </>
      )}

      {step === "success" && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16,
          }}>
            ✓
          </div>
          <h2 style={{
            fontSize: 28,
            fontWeight: 900,
            color: green,
            marginBottom: 8,
          }}>
            Name Registered!
          </h2>
          <p style={{
            fontSize: 13,
            color: mutedLight,
            marginBottom: 24,
            lineHeight: 1.6,
          }}>
            <strong>{displayName}</strong> is now yours.
            <br />
            Your NFT is being generated and will appear soon.
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
            Register Another Name
          </NeonButton>
        </div>
      )}

      {step === "error" && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16,
            color: error,
          }}>
            ✗
          </div>
          <h2 style={{
            fontSize: 24,
            fontWeight: 900,
            color: error,
            marginBottom: 8,
          }}>
            Registration Failed
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
              onClick={handleRegister}
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