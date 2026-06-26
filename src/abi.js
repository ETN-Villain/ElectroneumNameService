// Minimal ABI — only the pieces this service actually needs.
// Using a minimal ABI (rather than the full contract ABI) keeps things
// simple and avoids needing to regenerate this file every time the
// contract gains unrelated functions.

export const REGISTRAR_ABI = [
  // Event we listen for
  "event NameRegistered(bytes32 indexed node, string name, string tld, address indexed registrant, bool lifetime, uint256 expiresAt)",

  // Read functions we use to pull extra context if needed
  "function fullName(bytes32 node) view returns (string)",
  "function nodeType(bytes32 node) view returns (uint8)",
  "function parentProject(bytes32 node) view returns (string)",
  "function nodeImageURI(bytes32 node) view returns (string)",

  // Write function the backend calls once an image is generated
  "function setNodeImage(bytes32 node, string calldata uri) external"
];
