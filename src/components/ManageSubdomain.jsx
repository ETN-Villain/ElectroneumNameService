import React, { useState } from "react";
import { ethers } from "ethers";
import { ArrowLeft } from "lucide-react";
import { green, greenGlow, muted, mutedLight, error, panel2, border } from "../styles/theme.js";
import { useNamespace } from "../hooks/useNamespace.js";
import NeonButton from "./NeonButton.jsx";

export default function ManageSubdomain({ wallet, onBack = null }) {
  const [namespaceInput, setNamespaceInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [verifiedNamespace, setVerifiedNamespace] = useState(null);

  const [yearPriceInput, setYearPriceInput] = useState("");
  const [lifetimePriceInput, setLifetimePriceInput] = useState("");
  const [yearFloor, setYearFloor] = useState(null);
  const [lifetimeFloor, setLifetimeFloor] = useState(null);
  const [pricingError, setPricingError] = useState(null);
  const [pricingTxLoading, setPricingTxLoading] = useState(false);
  const [pricingSuccess, setPricingSuccess] = useState(false);

  const [accruedFees, setAccruedFees] = useState(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const {
    getNamespaceOwner,
    getCurrentNamespacePricing,
    getAccruedFees,
    setNamespacePricing,
    withdrawFees,
  } = useNamespace();

  const handleLookup = async () => {
    if (!wallet.isConnected) {
      setLookupError("Connect your wallet first");
      return;
    }
    if (!namespaceInput) {
      setLookupError("Enter a namespace name");
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    setVerifiedNamespace(null);
    setPricingSuccess(false);
    setWithdrawSuccess(false);

    try {
      const owner = await getNamespaceOwner(namespaceInput);

      if (owner === ethers.ZeroAddress) {
        setLookupError(`"${namespaceInput}.etn" doesn't exist`);
        return;
      }

      if (owner.toLowerCase() !== wallet.account.toLowerCase()) {
        setLookupError("Your wallet doesn't own this namespace");
        return;
      }

      const pricing = await getCurrentNamespacePricing(namespaceInput);
      setYearPriceInput(ethers.formatEther(pricing.yearPrice));
      setLifetimePriceInput(ethers.formatEther(pricing.lifetimePrice));
      setYearFloor(pricing.yearFloor);
      setLifetimeFloor(pricing.lifetimeFloor);

      const fees = await getAccruedFees(wallet.account);
      setAccruedFees(fees);

      setVerifiedNamespace(namespaceInput);
    } catch (err) {
      console.error("Namespace lookup failed:", err);
      setLookupError(err?.reason || err?.message || "Lookup failed");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleUpdatePricing = async () => {
    setPricingError(null);
    setPricingSuccess(false);

    const yearWei = ethers.parseEther(yearPriceInput || "0");
    const lifetimeWei = ethers.parseEther(lifetimePriceInput || "0");

    if (yearFloor !== null && yearWei < yearFloor) {
      setPricingError(`1-year price must be at least ${ethers.formatEther(yearFloor)} ETN`);
      return;
    }
    if (lifetimeFloor !== null && lifetimeWei < lifetimeFloor) {
      setPricingError(`Lifetime price must be at least ${ethers.formatEther(lifetimeFloor)} ETN`);
      return;
    }

    setPricingTxLoading(true);
    try {
      const signer = await wallet.getSigner();
      await setNamespacePricing(verifiedNamespace, yearWei, lifetimeWei, signer);
      setPricingSuccess(true);
    } catch (err) {
      setPricingError(err?.reason || err?.message || "Failed to update pricing");
    } finally {
      setPricingTxLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawError(null);
    setWithdrawSuccess(false);
    setWithdrawLoading(true);

    try {
      const signer = await wallet.getSigner();
      await withdrawFees(signer);
      setWithdrawSuccess(true);
      setAccruedFees(0n);
    } catch (err) {
      setWithdrawError(err?.reason || err?.message || "Withdrawal failed");
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
      {/* Back button */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={onBack}
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
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: muted,
          marginBottom: 10,
        }}>
          Manage Subdomain
        </div>
        <h2 style={{
          fontSize: 28,
          fontWeight: 900,
          margin: "0 0 12px 0",
          color: "#fff",
          textShadow: `0 0 16px ${greenGlow}`,
        }}>
          Your Namespace
        </h2>
        <div style={{
          width: 40,
          height: 2,
          background: green,
          margin: "0 auto",
          borderRadius: 2,
          boxShadow: `0 0 8px ${greenGlow}`,
        }} />
      </div>

      {/* Namespace lookup */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="your-namespace"
          value={namespaceInput}
          onChange={(e) => {
            setNamespaceInput(e.target.value.toLowerCase().trim());
            setVerifiedNamespace(null);
          }}
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
        />
        <NeonButton
          variant="green"
          onClick={handleLookup}
          disabled={lookupLoading || !namespaceInput}
          loading={lookupLoading}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {lookupLoading ? "Checking..." : "Load Namespace"}
        </NeonButton>
        {lookupError && (
          <div style={{ fontSize: 12, color: error, marginTop: 8, textAlign: "center" }}>
            {lookupError}
          </div>
        )}
      </div>

      {verifiedNamespace && (
        <>
          {/* Pricing section */}
          <div style={{
            padding: 16,
            borderRadius: 12,
            background: panel2,
            border: `1px solid ${border}`,
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
              Pricing for {verifiedNamespace}.etn
            </div>

            <div style={{ marginBottom: 14, textAlign: "left" }}>
              <label style={{ fontSize: 12, color: muted, display: "block", marginBottom: 6 }}>
                1 Year Price (ETN)
              </label>
              <input
                type="number"
                value={yearPriceInput}
                onChange={(e) => setYearPriceInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1px solid ${border}`,
                  background: "#0a1c2e",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 600,
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
              {yearFloor !== null && (
                <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>
                  Minimum: {ethers.formatEther(yearFloor)} ETN
                </div>
              )}
            </div>

            <div style={{ marginBottom: 14, textAlign: "left" }}>
              <label style={{ fontSize: 12, color: muted, display: "block", marginBottom: 6 }}>
                Lifetime Price (ETN)
              </label>
              <input
                type="number"
                value={lifetimePriceInput}
                onChange={(e) => setLifetimePriceInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1px solid ${border}`,
                  background: "#0a1c2e",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 600,
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
              {lifetimeFloor !== null && (
                <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>
                  Minimum: {ethers.formatEther(lifetimeFloor)} ETN
                </div>
              )}
            </div>

            {pricingError && (
              <div style={{ fontSize: 12, color: error, marginBottom: 12 }}>
                {pricingError}
              </div>
            )}
            {pricingSuccess && (
              <div style={{ fontSize: 12, color: green, marginBottom: 12 }}>
                ✓ Pricing updated
              </div>
            )}

            <NeonButton
              variant="green"
              onClick={handleUpdatePricing}
              disabled={pricingTxLoading}
              loading={pricingTxLoading}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {pricingTxLoading ? "Updating..." : "Update Pricing"}
            </NeonButton>
          </div>

          {/* Withdraw section */}
          <div style={{
            padding: 16,
            borderRadius: 12,
            background: panel2,
            border: `1px solid ${border}`,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
              Accrued Earnings
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: green, marginBottom: 16 }}>
              {accruedFees !== null ? ethers.formatEther(accruedFees) : "0.00"} ETN
            </div>

            {withdrawError && (
              <div style={{ fontSize: 12, color: error, marginBottom: 12 }}>
                {withdrawError}
              </div>
            )}
            {withdrawSuccess && (
              <div style={{ fontSize: 12, color: green, marginBottom: 12 }}>
                ✓ Withdrawn successfully
              </div>
            )}

            <NeonButton
              variant="green"
              onClick={handleWithdraw}
              disabled={withdrawLoading || !accruedFees || accruedFees === 0n}
              loading={withdrawLoading}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {withdrawLoading ? "Withdrawing..." : "Withdraw Earnings"}
            </NeonButton>
          </div>
        </>
      )}
    </div>
  );
}