// lib/abis/xayaAccounts.js
export const XAYA_ACCOUNTS_ADDRESS =
  "0x8C12253F71091b9582908C8a44F78870Ec6F304F";

// ABI minimal : juste ce dont on a besoin
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
    outputs: [{ name: "owner", type: "address" }],
  },
];
