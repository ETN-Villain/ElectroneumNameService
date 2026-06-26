import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { REGISTRAR_ADDRESS, RPC_URL } from "../config_VERCEL.js";

// Placeholder ABI — will be replaced once user uploads real ABI
const REGISTRAR_ABI = [
  "function isAvailableBasic(string calldata name) view returns (bool)",
  "function isAvailableProject(string calldata name, string calldata project) view returns (bool)",
  "function getOwner(bytes32 node) view returns (address)",
  "function getExpiry(bytes32 node) view returns (uint256 expiry, bool isLifetime, bool inGrace)",
];

export function useCheckAvailability() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkBasicAvailability = useCallback(async (name) => {
    if (!name || name.length === 0) return null;

    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const registrar = new ethers.Contract(REGISTRAR_ADDRESS, REGISTRAR_ABI, provider);

      const isAvailable = await registrar.isAvailableBasic(name);
      return isAvailable;
    } catch (err) {
      console.error("Availability check failed:", err);
      setError(err.message || "Failed to check availability");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkProjectAvailability = useCallback(async (name, project) => {
    if (!name || !project || name.length === 0 || project.length === 0) return null;

    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const registrar = new ethers.Contract(REGISTRAR_ADDRESS, REGISTRAR_ABI, provider);

      const isAvailable = await registrar.isAvailableProject(name, project);
      return isAvailable;
    } catch (err) {
      console.error("Availability check failed:", err);
      setError(err.message || "Failed to check availability");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    checkBasicAvailability,
    checkProjectAvailability,
    loading,
    error,
  };
}