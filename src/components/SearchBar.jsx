import React, { useState, useEffect } from "react";
import { green, greenGlow, muted, mutedLight, error, panel2, border } from "../styles/theme.js";
import { useCheckAvailability } from "../hooks/useCheckAvailability.js";
import NeonButton from "../components/NeonButton.jsx";

export default function SearchBar({ wallet, onNameSelected = null }) {
  const [nameInput, setNameInput] = useState("");
  const [registrationType, setRegistrationType] = useState("basic");
  const [projectInput, setProjectInput] = useState("");
  const [availability, setAvailability] = useState(null);
  const [checkingDebounce, setCheckingDebounce] = useState(false);

  const { checkBasicAvailability, checkProjectAvailability } = useCheckAvailability();

  // Debounced availability check
  useEffect(() => {
    if (!nameInput || nameInput.length < 1) {
      setAvailability(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingDebounce(true);
      try {
        if (registrationType === "basic") {
          const isAvailable = await checkBasicAvailability(nameInput);
          setAvailability(isAvailable);
        } else {
          if (projectInput.length > 0) {
            const isAvailable = await checkProjectAvailability(nameInput, projectInput);
            setAvailability(isAvailable);
          }
        }
      } catch (err) {
        console.error("Availability check error:", err);
        setAvailability(null);
      }
      setCheckingDebounce(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [nameInput, registrationType, projectInput, checkBasicAvailability, checkProjectAvailability]);

  const displayName = registrationType === "basic" 
    ? `${nameInput}.etn`
    : `${nameInput}.${projectInput}.etn`;

  const canProceed = wallet?.isConnected && availability === true;

  const handleContinue = () => {
    if (!canProceed) return;
    
    onNameSelected?.({
      name: nameInput,
      type: registrationType,
      project: projectInput,
    });
  };

  return (
    <div style={{ width: "100%", maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
      {/* Hero headline */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <h1 style={{ 
          fontSize: 42, 
          fontWeight: 900, 
          margin: "0 0 8px 0",
          background: `linear-gradient(135deg, ${green}, #00ff88)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Electroneum Names
        </h1>
        <p style={{ fontSize: 14, color: mutedLight, margin: 0 }}>
          Claim your identity on the chain
        </p>
      </div>

      {/* Registration type toggle */}
      <div style={{ marginBottom: 20, display: "flex", gap: 8 }}>
        <button
          onClick={() => setRegistrationType("basic")}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            border: `1px solid ${registrationType === "basic" ? green : border}`,
            background: registrationType === "basic" ? `rgba(24,187,26,0.15)` : panel2,
            color: registrationType === "basic" ? green : muted,
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: registrationType === "basic" ? `0 0 8px ${greenGlow}` : "none",
          }}
        >
          Basic Name
        </button>
        <button
          onClick={() => setRegistrationType("project")}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            border: `1px solid ${registrationType === "project" ? green : border}`,
            background: registrationType === "project" ? `rgba(24,187,26,0.15)` : panel2,
            color: registrationType === "project" ? green : muted,
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: registrationType === "project" ? `0 0 8px ${greenGlow}` : "none",
          }}
        >
          Project Name
        </button>
      </div>

      {/* Search inputs */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder={registrationType === "basic" ? "alice" : "your-name"}
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value.toLowerCase().trim())}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 12,
            border: `1px solid ${availability === null ? border : availability ? green : error}`,
            background: panel2,
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            boxSizing: "border-box",
            boxShadow: availability === null ? "none" : `0 0 12px ${availability ? greenGlow : "rgba(255,107,107,0.25)"}`,
            outline: "none",
            transition: "all 0.2s ease",
            marginBottom: registrationType === "project" ? 12 : 0,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = green;
            e.currentTarget.style.boxShadow = `0 0 12px ${greenGlow}`;
          }}
          onBlur={(e) => {
            if (availability === null) {
              e.currentTarget.style.borderColor = border;
              e.currentTarget.style.boxShadow = "none";
            }
          }}
        />

        {registrationType === "project" && (
          <input
            type="text"
            placeholder="project-namespace"
            value={projectInput}
            onChange={(e) => setProjectInput(e.target.value.toLowerCase().trim())}
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
        )}
      </div>

      {/* Display name preview */}
      {nameInput && (
        <div style={{
          padding: 14,
          borderRadius: 10,
          background: panel2,
          border: `1px solid ${border}`,
          marginBottom: 16,
          fontSize: 12,
          color: mutedLight,
          textAlign: "center",
        }}>
          {checkingDebounce && "Checking..."}
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginTop: checkingDebounce ? 4 : 0, fontFamily: "monospace" }}>
            {displayName}
          </div>
        </div>
      )}

      {/* Availability status */}
      {availability !== null && !checkingDebounce && (
        <div style={{
          padding: 14,
          borderRadius: 10,
          background: availability 
            ? `rgba(24,187,26,0.1)` 
            : `rgba(255,107,107,0.1)`,
          border: `1px solid ${availability ? green : error}`,
          marginBottom: 16,
          fontSize: 13,
          color: availability ? green : error,
          fontWeight: 600,
          textAlign: "center",
        }}>
          {availability ? "✓ Available — Ready to register" : "✗ Taken or expired"}
        </div>
      )}

      {/* Wallet connection status */}
      {!wallet?.isConnected && (
        <div style={{
          padding: 12,
          borderRadius: 10,
          background: `rgba(62,166,255,0.1)`,
          border: `1px solid ${green}`,
          marginBottom: 16,
          fontSize: 12,
          color: "#fff",
          textAlign: "center",
        }}>
          Connect your wallet to continue
        </div>
      )}

      {/* CTA button */}
      <NeonButton
        variant={canProceed ? "green" : "dark"}
        disabled={!canProceed}
        onClick={handleContinue}
        style={{ width: "100%", justifyContent: "center" }}
      >
        {!wallet?.isConnected ? "Connect Wallet" : availability === true ? "Continue to Registration" : "Check Availability"}
      </NeonButton>

      {/* Info text */}
      <div style={{ marginTop: 20, fontSize: 11, color: muted, textAlign: "center", lineHeight: 1.6 }}>
        <div>Valid characters: lowercase letters, numbers, hyphens</div>
        <div>Length: 1–63 characters</div>
      </div>
    </div>
  );
}