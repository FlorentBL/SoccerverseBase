// lib/contracts.js
import { parseAbi } from "viem";

// Contrat XayaAccounts (username → tokenId → owner)
export const XAYA_ACCOUNTS = "0x8C12253F71091b9582908C8a44F78870Ec6F304F";
export const XAYA_ABI = parseAbi([
  "function tokenIdForName(string name) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
]);

// SwappingPackSale par tier
export const SWAP_SALE_ADDR = {
  1: "0x8501A9018A5625b720355A5A05c5dA3D5E8bB003",
  2: "0x0bF818f3A69485c8B05Cf6292D9A04C6f58ADF08",
  3: "0x4259D89087b6EBBC8bE38A30393a2F99F798FE2f",
  4: "0x167360A54746b82e38f700dF0ef812c269c4e565",
  5: "0x3d25Cb3139811c6AeE9D5ae8a01B2e5824b5dB91",
};

export const SWAP_SALE_ABI = parseAbi([
  // NB: même signature sur les 5 contrats
  "function preview(uint256 clubId, uint256 numPacks) view returns (uint256 primaryClubId, uint256 numPacks, uint256 priceUSDC, uint256 discountedUSDC, uint256[] clubIds, uint256[] influences)",
]);
