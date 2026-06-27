import React, { useState, useEffect } from "react";
import { useReownWallet } from "./hooks/useReownWallet.jsx";
import { panel, muted } from "./styles/theme.js";
import SearchBar from "./components/SearchBar.jsx";
import RegistrationFlow from "./components/RegistrationFlow.jsx";
import NamespaceFlow from "./components/NamespaceFlow.jsx";

function AppContent() {
  const wallet = useReownWallet();

    useEffect(() => {
    console.log("AppContent re-render - wallet.isConnected:", wallet.isConnected, "account:", wallet.account);
  }, [wallet.isConnected, wallet.account]);

  const [selectedName, setSelectedName] = useState(null);
  const [showNamespaceFlow, setShowNamespaceFlow] = useState(false);

  const handleNameSelected = async (nameData) => {
    if (!wallet.isConnected) {
      await wallet.connectWallet();
      return;
    }

    try {
      await wallet.ensureCorrectNetwork();
    } catch (err) {
      console.error("Network switch failed:", err);
      return;
    }

    setSelectedName(nameData);
  };

  const handleBack = () => {
    setSelectedName(null);
  };

  const handleNamespaceFlow = async () => {
    if (!wallet.isConnected) {
      await wallet.connectWallet();
      return;
    }

    try {
      await wallet.ensureCorrectNetwork();
    } catch (err) {
      console.error("Network switch failed:", err);
      return;
    }

    setShowNamespaceFlow(true);
  };

  const handleBackFromNamespace = () => {
    setShowNamespaceFlow(false);
  };

  const handleRegistrationSuccess = (result) => {
    console.log("Registration successful:", result);
  };

  const handleNamespaceSuccess = (result) => {
    console.log("Namespace created:", result);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${panel}, #0a0a0a)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
{/* Header with wallet button */}
<div style={{
  position: "absolute",
  top: 20,
  right: 20,
}}>
  <button
    onClick={wallet.isConnected ? wallet.disconnectWallet : wallet.connectWallet}
    style={{
      padding: "10px 16px",
      borderRadius: 8,
      background: "#3ea6ff",
      color: "#fff",
      border: "none",
      cursor: "pointer",
      fontSize: 13,
      fontWeight: 600,
      fontWeight: 600,
      transition: "opacity 0.2s ease",
    }}
    onMouseEnter={(e) => e.target.style.opacity = "0.9"}
    onMouseLeave={(e) => e.target.style.opacity = "1"}
  >
    {wallet.isConnected 
      ? `${wallet.account?.slice(0, 6)}...${wallet.account?.slice(-4)}` 
      : "Connect Wallet"}
  </button>
</div>

      {/* Main content */}
      <div style={{ width: "100%", marginBottom: 40 }}>
        {!selectedName && !showNamespaceFlow ? (
          // Search view
<SearchBar
  key={wallet.isConnected ? "connected" : "disconnected"}
  wallet={wallet}
  onNameSelected={handleNameSelected}
  onNamespaceFlow={handleNamespaceFlow}
/>
        ) : selectedName ? (
          // Registration view
          <RegistrationFlow
            nameData={selectedName}
            wallet={wallet}
            onBack={handleBack}
            onSuccess={handleRegistrationSuccess}
          />
        ) : (
          // Namespace creation view
          <NamespaceFlow
            wallet={wallet}
            onBack={handleBackFromNamespace}
            onSuccess={handleNamespaceSuccess}
          />
        )}
      </div>

      {/* Footer */}
      <div style={{
        position: "absolute",
        bottom: 20,
        fontSize: 11,
        color: muted,
        textAlign: "center",
      }}>
        Planet Zephyros - Electroneum Name Service
      </div>
    </div>
  );
}

export default AppContent;