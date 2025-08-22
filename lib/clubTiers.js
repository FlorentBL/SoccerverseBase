// /lib/clubTiers.js
import tiers from "@/lib/data/club_tiers.json";

/**
 * Retourne le tier (number) d’un clubId, ou null si inconnu.
 */
export function getClubTier(clubId) {
  const key = String(clubId);
  const entry = tiers[key];
  return entry && typeof entry.tier === "number" ? entry.tier : null;
}
