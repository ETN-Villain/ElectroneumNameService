import React from "react";
import { Wallet } from "lucide-react";

import NeonButton from "./NeonButton.jsx";
import { green, panel, border } from "../styles/theme.js";
import { PlanetZephyrosAE, PlanetZephyrosText, electroneumnameservicetext } from "../../assets/media.js";

function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Header({
  wallet,
  isMobile,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "stretch",
        justifyContent: "space-between",
        gap: isMobile ? 10 : 18,
        width: "100%",
        marginBottom: 10,
      }}
    >
      {/* WALLET SECTION - Right aligned on mobile */}
      <div
        style={{
          display: "flex",
          justifyContent: isMobile ? "flex-end" : "flex-end",   // ← Right aligned on mobile
          alignItems: "center",
          width: isMobile ? "100%" : "auto",
          gap: 8,
          flexShrink: 0,
          order: isMobile ? 0 : 2,
        }}
      >
        {wallet.account ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: panel,
              padding: "8px 14px",
              borderRadius: 14,
              border: `1px solid ${border}`,
              boxShadow: "0 0 12px rgba(0,0,0,0.45)",
            }}
          >
            <Wallet size={16} color={green} />
            <span
              style={{
                fontSize: isMobile ? 12 : 14,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: 0.4,
              }}
            >
              {shortAddress(wallet.account)}
            </span>
            <div style={{ width: 1, height: 16, background: "#333" }} />
            <button
              type="button"
              onClick={wallet.disconnectWallet}
              style={{
                background: "transparent",
                border: "none",
                color: "#ff6b6b",
                fontWeight: 700,
                fontSize: isMobile ? 11 : 13,
                cursor: "pointer",
                padding: "2px 6px",
              }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <NeonButton onClick={wallet.connectWallet}>
            Connect Wallet
          </NeonButton>
        )}
      </div>

{/* BRANDING SECTION */}
<div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: isMobile ? "center" : "center",
    justifyContent: "center",
    gap: isMobile ? 6 : 8,
    minWidth: 0,
    flex: 1,
    width: "100%",
    order: isMobile ? 1 : 1,
  }}
>
  {/* PlanetZephyrosAE + PlanetZephyrosText (tight) */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 2,
      justifyContent: "center",
    }}
  >
    {/* Planet Zephyros Video Logo */}
    {PlanetZephyrosAE && (
      <video
        src={PlanetZephyrosAE}
        autoPlay
        loop
        muted
        playsInline
        style={{
          height: isMobile ? 60 : 80,
          width: "auto",
          display: "block",
          pointerEvents: "none",
          animation: "logoPulse 2.4s ease-in-out infinite",
          filter: "drop-shadow(0 0 14px rgba(0,255,140,0.18))",
          borderRadius: 8,
          objectFit: "contain",
          flexShrink: 0,
        }}
      />
    )}

    {/* PlanetZephyrosText */}
    {PlanetZephyrosText && (
      <img
        src={PlanetZephyrosText}
        alt="Planet Zephyros"
        style={{
          height: isMobile ? 60 : 80,
          width: "auto",
          display: "block",
          filter: "drop-shadow(0 0 12px rgba(0,255,140,0.25))",
          animation: "vaultPulse 2.2s infinite",
          objectFit: "contain",
          flexShrink: 0,
        }}
      />
    )}
  </div>

  {/* Electroneum Name Service Text */}
  {electroneumnameservicetext && (
    <img
      src={electroneumnameservicetext}
      alt="Electroneum Name Service"
      style={{
        width: isMobile ? "280px" : "520px",
        maxWidth: "100%",
        height: "auto",
        filter: "drop-shadow(0 0 16px rgba(0,255,140,0.35))",
        animation: "vaultPulse 2.2s infinite",
        objectFit: "contain",
      }}
    />
  )}

  {/* Tagline - Styled better */}
  <div
    style={{
      marginTop: 4,
      fontSize: isMobile ? 12 : 14,
      fontWeight: 700,
      letterSpacing: 1.2,
      color: "#18bb1a",
      textTransform: "uppercase",
      textShadow: "0 0 16px rgba(24,187,26,0.4), 0 0 32px rgba(24,187,26,0.15)",
      animation: "glow 2s ease-in-out infinite",
    }}
  >
    Simplify Your Wallet
  </div>
</div>
    </div>
  );
}