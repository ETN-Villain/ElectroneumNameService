import React, { useState, useEffect } from "react";
import { useReownWallet } from "./hooks/useReownWallet.jsx";
import { panel, muted } from "./styles/theme.js";
import SearchBar from "./components/SearchBar.jsx";
import RegistrationFlow from "./components/RegistrationFlow.jsx";
import NamespaceFlow from "./components/NamespaceFlow.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";

function AppContent() {
  const wallet = useReownWallet();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      background: "#011528",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* HEADER — Always render, includes wallet button */}
      <Header wallet={wallet} isMobile={isMobile} />

      {/* Main content — Conditional rendering */}
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

        <Footer />
    </div>
  );
}

export default AppContent;