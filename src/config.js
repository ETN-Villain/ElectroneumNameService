// Chain
export const CHAIN_ID = import.meta.env.VITE_CHAIN_ID ? parseInt(import.meta.env.VITE_CHAIN_ID, 10) : 52014;
export const RPC_URL = import.meta.env.VITE_RPC_URL || "https://rpc.ankr.com/electroneum";
export const EXPLORER_BASE_URL = import.meta.env.VITE_EXPLORER_BASE_URL || "https://blockexplorer.electroneum.com";

// Contract addresses
export const REGISTRAR_ADDRESS = import.meta.env.VITE_REGISTRAR_ADDRESS || "0x10104FB5539c252E3d8b44FBCf48B791670c3e2c";
export const RESOLVER_ADDRESS = import.meta.env.VITE_RESOLVER_ADDRESS || "0x89CBcc827c71B21DFE3d65f544b72C992FC45AA4";

// Reown
export const REOWN_PROJECT_ID = import.meta.env.VITE_REOWN_PROJECT_ID || "146ee334d324044083b6427d4bbf9202";

// Backend
export const BACKEND_IMAGE_URL = import.meta.env.VITE_BACKEND_IMAGE_URL || "https://your-render-service.onrender.com";