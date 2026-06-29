import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { green, greenGlow, muted, mutedLight, error, panel2, border } from "../styles/theme.js";
import { useCheckAvailability } from "../hooks/useCheckAvailability.js";
import NeonButton from "./NeonButton.jsx";

export default function SearchBar({ wallet, onNameSelected = null, onNamespaceFlow = null }) {
  const [view, setView] = useState("main");
  const [nameInput, setNameInput] = useState("");
  const [registrationType, setRegistrationType] = useState("basic");
  const [projectInput, setProjectInput] = useState("");
  const [availability, setAvailability] = useState(null);
  const [checkingDebounce, setCheckingDebounce] = useState(false);
  const [namespaceValid, setNamespaceValid] = useState(null);
  const [namespaceChecking, setNamespaceChecking] = useState(false);
  const { checkBasicAvailability, checkProjectAvailability, checkNamespaceExists } = useCheckAvailability();

  // Monitor wallet changes
  useEffect(() => {
    console.log("SearchBar - wallet.isConnected:", wallet.isConnected);
  }, [wallet.isConnected]);

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

// Debounced namespace existence check
useEffect(() => {
  if (registrationType !== "project" || !projectInput) {
    setNamespaceValid(null);
    return;
  }

  const timer = setTimeout(async () => {
    setNamespaceChecking(true);
    const exists = await checkNamespaceExists(projectInput);
    setNamespaceValid(exists);
    setNamespaceChecking(false);
  }, 500);

  return () => clearTimeout(timer);
}, [projectInput, registrationType, checkNamespaceExists]);

  const displayName = registrationType === "basic"
    ? `${nameInput}.etn`
    : `${nameInput}.${projectInput}.etn`;

const canProceed = wallet?.isConnected && availability === true &&
  (registrationType === "basic" || namespaceValid === true);

  const handleContinue = () => {
    if (!canProceed) return;
    onNameSelected?.({
      name: nameInput,
      type: registrationType,
      project: projectInput,
    });
  };

const handleCreateName = useCallback(() => {
  console.log("handleCreateName called - wallet.isConnected:", wallet?.isConnected);
  if (!wallet?.isConnected) {
    console.log("Not connected, calling connectWallet");
    wallet?.connectWallet?.();
    return;
  }
  console.log("Connected! Setting view to 'name'");
  setView("name");
}, [wallet?.isConnected, wallet?.connectWallet, setView]);

  const handleCreateSubdomain = () => {
    if (!wallet?.isConnected) {
      wallet?.connectWallet();
      return;
    }
    onNamespaceFlow?.();
  };

  return (
    <div style={{ width: "100%", maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
      {/* MAIN VIEW */}
{view === "main" && (
  <>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <NeonButton
        variant="green"
        onClick={handleCreateName}
        style={{ width: "100%", justifyContent: "center", padding: "16px" }}
      >
        {wallet?.isConnected ? "Create Name" : "Create Name"}
      </NeonButton>
      <NeonButton
        variant="green"
        onClick={handleCreateSubdomain}
        style={{ width: "100%", justifyContent: "center", padding: "16px" }}
      >
        {wallet?.isConnected ? "Create Subdomain" : "Create Subdomain"}
      </NeonButton>
    </div>
    </>
      )}

      {/* NAME CREATION VIEW */}
      {view === "name" && (
        <>
{/* Back button */}
<div style={{ marginBottom: 20 }}>
  <button
    onClick={() => {
      setView("main");
      setNameInput("");
      setProjectInput("");
      setAvailability(null);
    }}
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
  <>
    <input
      type="text"
      placeholder="project-namespace"
      value={projectInput}
      onChange={(e) => setProjectInput(e.target.value.toLowerCase().trim())}
      style={{
        width: "100%",
        padding: "14px 16px",
        borderRadius: 12,
        border: `1px solid ${
          projectInput.length === 0
            ? border
            : namespaceValid === null
            ? border
            : namespaceValid
            ? green
            : error
        }`,
        background: panel2,
        color: "#fff",
        fontSize: 16,
        fontWeight: 600,
        boxSizing: "border-box",
        outline: "none",
        marginBottom: 8,
        boxShadow:
          projectInput.length === 0 || namespaceValid === null
            ? "none"
            : `0 0 12px ${namespaceValid ? greenGlow : "rgba(255,107,107,0.25)"}`,
      }}
      onFocus={(e) => {
        if (namespaceValid === null) {
          e.currentTarget.style.borderColor = green;
          e.currentTarget.style.boxShadow = `0 0 12px ${greenGlow}`;
        }
      }}
      onBlur={(e) => {
        if (namespaceValid === null) {
          e.currentTarget.style.borderColor = border;
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    />
    {projectInput && !namespaceChecking && namespaceValid === false && (
      <div style={{ fontSize: 12, color: error, marginBottom: 12 }}>
        ✗ "{projectInput}.etn" doesn't exist or has expired
      </div>
    )}
    {projectInput && !namespaceChecking && namespaceValid === true && (
      <div style={{ fontSize: 12, color: green, marginBottom: 12 }}>
        ✓ "{projectInput}.etn" found
      </div>
    )}
    {namespaceChecking && (
      <div style={{ fontSize: 12, color: muted, marginBottom: 12 }}>
        Checking...
      </div>
    )}
  </>
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
    <div style={{
      fontSize: 18,
      fontWeight: 700,
      color: "#fff",
      marginTop: checkingDebounce ? 4 : 0,
      fontFamily: '"Orbitron", sans-serif',
    }}>
      {displayName}
    </div>
  </div>
)}

{/* Availability status */}
{availability !== null && !checkingDebounce && (
  <div style={{
    padding: 14,
    borderRadius: 10,
    background: (registrationType === "project" && namespaceValid === false)
      ? `rgba(255,107,107,0.1)`
      : availability
      ? `rgba(24,187,26,0.1)`
      : `rgba(255,107,107,0.1)`,
    border: `1px solid ${
      (registrationType === "project" && namespaceValid === false)
        ? error
        : availability ? green : error
    }`,
    marginBottom: 16,
    fontSize: 13,
    color: (registrationType === "project" && namespaceValid === false)
      ? error
      : availability ? green : error,
    fontWeight: 600,
    textAlign: "center",
  }}>
    {registrationType === "project" && namespaceValid === false
      ? "✗ Not a registered subdomain"
      : availability
      ? "✓ Available — Ready to register"
      : "✗ Taken or expired"}
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
        </>
      )}
    </div>
  );
}