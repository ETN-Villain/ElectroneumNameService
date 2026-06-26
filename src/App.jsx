import React, { useState } from "react";
import { useReownWallet } from "./hooks/useReownWallet.jsx";
import { panel, muted } from "./theme.js";
import SearchBar from "./components/SearchBar.jsx";
import RegistrationFlow from "./components/RegistrationFlow.jsx";

function AppContent() {
  const wallet = useReownWallet();
  const [selectedName, setSelectedName] = useState(null);

  const handleNameSelected = async (nameData) => {
    // Not connected — open wallet modal
    if (!wallet.isConnected) {
      await wallet.connectWallet();
      return;
    }

    // Try to switch to correct network
    try {
      await wallet.ensureCorrectNetwork();
    } catch (err) {
      console.error("Network switch failed:", err);
      return;
    }

    // Success — store selection
    setSelectedName(nameData);
  };

  const handleBack = () => {
    setSelectedName(null);
  };

  const handleRegistrationSuccess = (result) => {
    console.log("Registration successful:", result);
    // Could show a modal, toast, or redirect here
    // For now, we let the user see the success screen and click to register another
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
        {!selectedName ? (
          // Search view
          <SearchBar 
            wallet={wallet}
            onNameSelected={handleNameSelected}
          />
        ) : (
          // Registration view
          <RegistrationFlow
            nameData={selectedName}
            wallet={wallet}
            onBack={handleBack}
            onSuccess={handleRegistrationSuccess}
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