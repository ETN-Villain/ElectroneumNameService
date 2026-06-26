import React, { useState } from "react";
import { useReownWallet } from "./hooks/useReownWallet.jsx";
import { panel, muted } from "./theme.js";
import SearchBar from "./components/SearchBar.jsx";
import RegistrationFlow from "./components/RegistrationFlow.jsx";
import NamespaceFlow from "./components/NamespaceFlow.jsx";

function AppContent() {
  const wallet = useReownWallet();
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
        <w3m-connect-button />
      </div>

      {/* Main content */}
      <div style={{ width: "100%", marginBottom: 40 }}>
        {!selectedName && !showNamespaceFlow ? (
          // Search view
          <SearchBar
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