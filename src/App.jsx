import React, { useState, useEffect } from "react";
import { useReownWallet } from "./hooks/useReownWallet.jsx";
import { panel, muted } from "./styles/theme.js";
import SearchBar from "./components/SearchBar.jsx";
import RegistrationFlow from "./components/RegistrationFlow.jsx";
import NamespaceFlow from "./components/NamespaceFlow.jsx";
import ManageSubdomain from "./components/ManageSubdomain.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import NeonButton from "./components/NeonButton.jsx";

function AppContent() {
  const SUSPENDED = true; // flip to false to restore access

  if (SUSPENDED) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#011528",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        textAlign: "center",
        padding: 20,
      }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Temporarily Unavailable</h1>
          <p style={{ color: "#999" }}>We'll be back shortly.</p>
        </div>
      </div>
    );
  }

  const wallet = useReownWallet();
  // ...rest of your existing component unchanged
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [selectedName, setSelectedName] = useState(null);
  const [showNamespaceFlow, setShowNamespaceFlow] = useState(false);
  const [showManageSubdomain, setShowManageSubdomain] = useState(false);

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

  const handleBack = () => setSelectedName(null);

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

  const handleBackFromNamespace = () => setShowNamespaceFlow(false);

  const handleManageSubdomain = async () => {
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
    setShowManageSubdomain(true);
  };

  const handleBackFromManage = () => setShowManageSubdomain(false);

  const handleRegistrationSuccess = (result) => {
    console.log("Registration successful:", result);
  };

  const handleNamespaceSuccess = (result) => {
    console.log("Namespace created:", result);
  };

  const showingMainSearch = !selectedName && !showNamespaceFlow && !showManageSubdomain;

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
      <Header wallet={wallet} isMobile={isMobile} />

      <div style={{ width: "100%", marginBottom: 40 }}>
        {showingMainSearch ? (
          <>
            <SearchBar
              key={wallet.isConnected ? "connected" : "disconnected"}
              wallet={wallet}
              onNameSelected={handleNameSelected}
              onNamespaceFlow={handleNamespaceFlow}
            />
            <div style={{ width: "100%", maxWidth: 600, margin: "16px auto 0", padding: "0 16px" }}>
              <NeonButton
                variant="dark"
                onClick={handleManageSubdomain}
                style={{ width: "100%", justifyContent: "center" }}
              >
                Manage Subdomain
              </NeonButton>
            </div>
          </>
        ) : selectedName ? (
          <RegistrationFlow
            nameData={selectedName}
            wallet={wallet}
            onBack={handleBack}
            onSuccess={handleRegistrationSuccess}
          />
        ) : showNamespaceFlow ? (
          <NamespaceFlow
            wallet={wallet}
            onBack={handleBackFromNamespace}
            onSuccess={handleNamespaceSuccess}
          />
        ) : (
          <ManageSubdomain
            wallet={wallet}
            onBack={handleBackFromManage}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}

export default AppContent;