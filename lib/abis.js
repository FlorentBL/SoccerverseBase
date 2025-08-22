// lib/abis.js
// ABI minimal pour appeler preview(clubId, numPacks).
// Certains builds renvoient un tuple fixe ; ici on lit comme uint256[]
// et on gère le parsing côté route. Si besoin d’un tuple exact, tu peux l’ajouter.

export const SWAPPING_PACK_SALE_ABI = [
  {
    type: "function",
    name: "preview",
    stateMutability: "view",
    inputs: [
      { name: "clubId", type: "uint256" },
      { name: "numPacks", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256[]" }],
  },
];

export const XAYA_ACCOUNTS_ABI = [
  {
    type: "function",
    name: "tokenIdForName",
    stateMutability: "view",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
];
