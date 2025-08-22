// lib/abis.js
// ABI minimal pour les contrats SwappingPackSale (tiers 1..5)
export const SWAPPING_PACK_SALE_ABI = [
  // clubs(clubId) -> bool (permet de savoir si un club fait partie du tier)
  {
    type: "function",
    name: "clubs",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  // preview(primaryClubId, numPacks)
  // Plusieurs déploiements existent ; on décode les 4 premiers éléments
  // (clubId, numPacks, unitUSDC, totalUSDC) et on gère ensuite dynamiquement
  // les quantités (tableaux ou paires aplaties).
  {
    type: "function",
    name: "preview",
    stateMutability: "view",
    inputs: [
      { name: "clubId", type: "uint256" },
      { name: "numPacks", type: "uint256" },
    ],
    outputs: [
      { name: "clubId", type: "uint256" },
      { name: "numPacks", type: "uint256" },
      { name: "unitUSDC", type: "uint256" },
      { name: "totalUSDC", type: "uint256" },
      // Les versions récentes renvoient 2 tableaux :
      { name: "packedClubs", type: "uint256[]" },
      { name: "packedAmounts", type: "uint256[]" },
    ],
  },
];
