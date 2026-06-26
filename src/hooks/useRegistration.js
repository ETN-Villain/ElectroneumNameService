import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { REGISTRAR_ADDRESS, RPC_URL } from "../config.js";

// Minimal ABI for registration
const REGISTRAR_ABI = [
  "function getBasicYearPrice() view returns (uint256)",
  "function getBasicLifetimePrice() view returns (uint256)",
  "function getProjectNameYearPrice() view returns (uint256)",
  "function getProjectNameLifetimePrice() view returns (uint256)",
  "function registerBasic(string calldata name, address resolver, bool lifetime) external payable",
  "function registerProject(string calldata name, string calldata project, address resolver, bool lifetime) external payable",
];

export function useRegistration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch price from contract
  const getPrice = useCallback(async (type, lifetime) => {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const registrar = new ethers.Contract(REGISTRAR_ADDRESS, REGISTRAR_ABI, provider);

      let price;
      if (type === "basic") {
        price = lifetime 
          ? await registrar.getBasicLifetimePrice()
          : await registrar.getBasicYearPrice();
      } else {
        price = lifetime
          ? await registrar.getProjectNameLifetimePrice()
          : await registrar.getProjectNameYearPrice();
      }

      return price;
    } catch (err) {
      console.error("Failed to fetch price:", err);
      throw err;
    }
  }, []);

  // Register a basic name
  const registerBasicName = useCallback(async (name, signer, lifetime, resolver = null) => {
    setLoading(true);
    setError(null);

    try {
      const registrar = new ethers.Contract(REGISTRAR_ADDRESS, REGISTRAR_ABI, signer);
      
      // Get the price for this name
      const price = await getPrice("basic", lifetime);

      // Call registerBasic with the price as msg.value
      const tx = await registrar.registerBasic(
        name,
        resolver || ethers.ZeroAddress,
        lifetime,
        { value: price }
      );

      // Wait for confirmation
      const receipt = await tx.wait();

      if (!receipt) throw new Error("Registration failed");

      return {
        success: true,
        txHash: tx.hash,
        name: `${name}.etn`,
      };
    } catch (err) {
      console.error("Registration failed:", err);
      setError(err?.reason || err?.message || "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getPrice]);

  // Register a project name
  const registerProjectName = useCallback(async (name, project, signer, lifetime, resolver = null) => {
    setLoading(true);
    setError(null);

    try {
      const registrar = new ethers.Contract(REGISTRAR_ADDRESS, REGISTRAR_ABI, signer);

      // Get the price for this name
      const price = await getPrice("project", lifetime);

      // Call registerProject with the price as msg.value
      const tx = await registrar.registerProject(
        name,
        project,
        resolver || ethers.ZeroAddress,
        lifetime,
        { value: price }
      );

      // Wait for confirmation
      const receipt = await tx.wait();

      if (!receipt) throw new Error("Registration failed");

      return {
        success: true,
        txHash: tx.hash,
        name: `${name}.${project}.etn`,
      };
    } catch (err) {
      console.error("Registration failed:", err);
      setError(err?.reason || err?.message || "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getPrice]);

  return {
    getPrice,
    registerBasicName,
    registerProjectName,
    loading,
    error,
  };
}