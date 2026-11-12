import { Flame, Zap, Snowflake, Link2, Timer } from "lucide-react";
import { RUNE_COLORS, type Rune } from "../../_lib/tactical";
const icons = {
  DROP_SET: Flame,
  REST_PAUSE: Zap,
  ISOMETRIC_HOLD: Snowflake,
  CLUSTER_SET: Link2,
  TEMPO_CONTROL: Timer,
};
export function TechniqueIcon({
  rune,
  size = 16,
}: {
  rune: Rune;
  size?: number;
}) {
  const Icon = icons[rune];
  return (
    <Icon
      size={size}
      aria-hidden="true"
      className="shrink-0"
      style={{ color: RUNE_COLORS[rune] }}
    />
  );
}
