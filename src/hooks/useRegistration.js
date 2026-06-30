import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { REGISTRAR_ADDRESS, RPC_URL } from "../config.js";

// Minimal ABI for registration
const ETN_NODE = "0x69a3977d40595dbc343e3fa6ddbd26dbe31cc237836622384941b3c5148974cd";

function getProjectNode(project) {
  const labelHash = ethers.keccak256(ethers.toUtf8Bytes(project));
  return ethers.keccak256(ethers.concat([ETN_NODE, labelHash]));
}

const REGISTRAR_ABI = [
  "function getBasicYearPrice() view returns (uint256)",
  "function getBasicLifetimePrice() view returns (uint256)",
  "function getProjectNameYearPrice() view returns (uint256)",
  "function getProjectNameLifetimePrice() view returns (uint256)",
  "function namespaceProjectYearPrice(bytes32 projectNode) view returns (uint256)",
  "function namespaceProjectLifetimePrice(bytes32 projectNode) view returns (uint256)",
  "function fallbackProjectYearPrice() view returns (uint256)",
  "function fallbackProjectLifetimePrice() view returns (uint256)",
  "function registerBasic(string calldata name, address resolver, bool lifetime) external payable",
  "function registerProject(string calldata name, string calldata project, address resolver, bool lifetime) external payable",
  "event NameRegistered(bytes32 indexed node, string name, string tld, address indexed registrant, bool lifetime, uint256 expiresAt)",
];

export function useRegistration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch price from contract
const getPrice = useCallback(async (type, lifetime, project = null) => {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const registrar = new ethers.Contract(REGISTRAR_ADDRESS, REGISTRAR_ABI, provider);

    if (type === "basic") {
      return lifetime
        ? await registrar.getBasicLifetimePrice()
        : await registrar.getBasicYearPrice();
    }

    // Project name — check for namespace-specific custom pricing first
    if (project) {
      const projectNode = getProjectNode(project);
      const customPrice = lifetime
        ? await registrar.namespaceProjectLifetimePrice(projectNode)
        : await registrar.namespaceProjectYearPrice(projectNode);

      if (customPrice > 0n) {
        return customPrice;
      }
    }

    // No custom price set — fall back to global default
    return lifetime
      ? await registrar.getProjectNameLifetimePrice()
      : await registrar.getProjectNameYearPrice();
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
    const price = await getPrice("basic", lifetime);

    const tx = await registrar.registerBasic(
      name,
      resolver || ethers.ZeroAddress,
      lifetime,
      { value: price }
    );

    const receipt = await tx.wait();
    if (!receipt) throw new Error("Registration failed");

    // Extract node from the NameRegistered event
    let node = null;
    for (const log of receipt.logs) {
      try {
        const parsed = registrar.interface.parseLog(log);
        if (parsed?.name === "NameRegistered") {
          node = parsed.args.node;
          break;
        }
      } catch {
        // not this event, skip
      }
    }

    return {
      success: true,
      txHash: tx.hash,
      name: `${name}.etn`,
      node, // bytes32 hex string, e.g. "0xabc123..."
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
    const price = await getPrice("project", lifetime, project); // ← pass project here

    const tx = await registrar.registerProject(
      name,
      project,
      resolver || ethers.ZeroAddress,
      lifetime,
      { value: price }
    );

    const receipt = await tx.wait();
    if (!receipt) throw new Error("Registration failed");

    // Extract node from the NameRegistered event
    let node = null;
    for (const log of receipt.logs) {
      try {
        const parsed = registrar.interface.parseLog(log);
        if (parsed?.name === "NameRegistered") {
          node = parsed.args.node;
          break;
        }
      } catch {
        // not this event, skip
      }
    }

    return {
      success: true,
      txHash: tx.hash,
      name: `${name}.${project}.etn`,
      node,
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