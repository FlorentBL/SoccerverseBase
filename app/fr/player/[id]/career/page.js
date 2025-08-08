import PlayerCareerTimeline from "@/components/PlayerCareerTimeline";

export default function Page({ params }) {
  const { id } = params;
  return <PlayerCareerTimeline playerId={id} lang="fr" />;
}
