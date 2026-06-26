import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { REGISTRAR_ADDRESS, RPC_URL } from "../config.js";

const REGISTRAR_ABI = [
  "function getNamespaceYearPrice() view returns (uint256)",
  "function getNamespaceLifetimePrice() view returns (uint256)",
  "function buyProject(string calldata project, bool lifetime) external payable",
];

export function useNamespace() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getPrice = useCallback(async (lifetime) => {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const registrar = new ethers.Contract(REGISTRAR_ADDRESS, REGISTRAR_ABI, provider);

      const price = lifetime
        ? await registrar.getNamespaceLifetimePrice()
        : await registrar.getNamespaceYearPrice();

      return price;
    } catch (err) {
      console.error("Failed to fetch namespace price:", err);
      throw err;
    }
  }, []);

  const buyNamespace = useCallback(async (projectName, signer, lifetime) => {
    setLoading(true);
    setError(null);

    try {
      const registrar = new ethers.Contract(REGISTRAR_ADDRESS, REGISTRAR_ABI, signer);

      const price = await getPrice(lifetime);

      const tx = await registrar.buyProject(projectName, lifetime, {
        value: price,
      });

      const receipt = await tx.wait();

      if (!receipt) throw new Error("Namespace creation failed");

      return {
        success: true,
        txHash: tx.hash,
        namespace: `${projectName}.etn`,
      };
    } catch (err) {
      console.error("Namespace creation failed:", err);
      setError(err?.reason || err?.message || "Namespace creation failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getPrice]);

  return {
    getPrice,
    buyNamespace,
    loading,
    error,
  };
}