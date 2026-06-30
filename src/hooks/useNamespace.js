import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { REGISTRAR_ADDRESS, RPC_URL } from "../config.js";

const REGISTRAR_ABI = [
  "function getNamespaceYearPrice() view returns (uint256)",
  "function getNamespaceLifetimePrice() view returns (uint256)",
  "function buyProject(string calldata project, bool lifetime) external payable",
  "function setNamespacePrice(string calldata project, uint256 yearPrice, uint256 lifetimePrice) external",
  "function fallbackProjectYearPrice() view returns (uint256)",
  "function fallbackProjectLifetimePrice() view returns (uint256)",
  "event ProjectCreated(string project, bytes32 indexed projectNode, address indexed creator, bool lifetime, uint256 expiresAt)",
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
      gasLimit: 500000,
    });

    const receipt = await tx.wait();
    if (!receipt) throw new Error("Namespace creation failed");

    let node = null;
    for (const log of receipt.logs) {
      try {
        const parsed = registrar.interface.parseLog(log);
        if (parsed?.name === "ProjectCreated") {
          node = parsed.args.projectNode;
          break;
        }
      } catch {
        // not this event, skip
      }
    }

const getProjectPriceFloors = useCallback(async () => {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const registrar = new ethers.Contract(REGISTRAR_ADDRESS, REGISTRAR_ABI, provider);

    const [yearFloor, lifetimeFloor] = await Promise.all([
      registrar.fallbackProjectYearPrice(),
      registrar.fallbackProjectLifetimePrice(),
    ]);

    return { yearFloor, lifetimeFloor };
  } catch (err) {
    console.error("Failed to fetch project price floors:", err);
    throw err;
  }
}, []);

const setNamespacePricing = useCallback(async (projectName, yearPrice, lifetimePrice, signer) => {
  setLoading(true);
  setError(null);

  try {
    const registrar = new ethers.Contract(REGISTRAR_ADDRESS, REGISTRAR_ABI, signer);

    const tx = await registrar.setNamespacePrice(projectName, yearPrice, lifetimePrice, {
      gasLimit: 200000,
    });

    const receipt = await tx.wait();
    if (!receipt) throw new Error("Setting namespace price failed");

    return { success: true, txHash: tx.hash };
  } catch (err) {
    console.error("Setting namespace price failed:", err);
    setError(err?.reason || err?.message || "Setting namespace price failed");
    throw err;
  } finally {
    setLoading(false);
  }
}, []);

    return {
      success: true,
      txHash: tx.hash,
      namespace: `${projectName}.etn`,
      node,
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
  getProjectPriceFloors,
  setNamespacePricing,
  loading,
  error,
};
}