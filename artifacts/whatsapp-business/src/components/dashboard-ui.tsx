import type { LucideIcon } from "lucide-react";

export type Tone = "success" | "warning" | "danger" | "instagram" | "neutral";

const DOT_TONE: Record<Tone, string> = {
  success: "bg-green-500",
  warning: "bg-warning",
  danger: "bg-danger",
  instagram: "bg-instagram-600",
  neutral: "bg-neutral-500",
};

// danger uses a cream-50 fill, not a danger tint: at any tint strength light
// enough to read as a badge, danger-on-danger-tint falls short of the 4.5:1
// AA minimum for this text size — a bordered cream-50 fill keeps the danger
// text at ~4.6:1 while still reading as a distinct pill.
const PILL_TONE_LIGHT: Record<Tone, string> = {
  success: "bg-green-100 text-green-700",
  warning: "bg-orange-100 text-neutral-900",
  danger: "bg-cream-50 border border-danger/30 text-danger",
  instagram: "bg-instagram-100 text-instagram-600",
  neutral: "bg-neutral-100 text-neutral-500",
};

type StatusPillProps = {
  tone: Tone;
  icon?: LucideIcon;
  children: React.ReactNode;
  dark?: boolean;
  testId?: string;
  className?: string;
};

// Single status-pill treatment, reused everywhere a channel/state indicator
// appears (connection status, conversation status dots, digest badges).
export function StatusPill({ tone, icon: Icon, children, dark = false, testId, className = "" }: StatusPillProps) {
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap ${dark ? "bg-white/10 text-white" : PILL_TONE_LIGHT[tone]} ${className}`}
    >
      {Icon ? <Icon size={13} /> : <span className={`h-1.5 w-1.5 rounded-full ${dark ? "bg-white" : DOT_TONE[tone]}`} />}
      {children}
    </span>
  );
}

type DeltaTone = "positive" | "warning" | "danger" | "neutral";

const DELTA_LIGHT: Record<DeltaTone, string> = {
  positive: "bg-green-100 text-green-700",
  warning: "bg-orange-100 text-neutral-900",
  danger: "bg-cream-50 border border-danger/30 text-danger",
  neutral: "bg-neutral-200 text-neutral-500",
};

type StatTileProps = {
  value: string;
  label: string;
  delta?: string;
  deltaTone?: DeltaTone;
  dark?: boolean;
  testId?: string;
};

// Single stat-tile treatment: big bold number, small label, optional small
// delta pill. Reused everywhere this pattern appears — never re-implemented
// per screen.
export function StatTile({ value, label, delta, deltaTone = "neutral", dark = false, testId }: StatTileProps) {
  return (
    <div data-testid={testId} className={`rounded-xl px-4 py-3 ${dark ? "bg-white/10" : "border border-neutral-200 bg-cream-50"}`}>
      <p className={`font-['Space_Grotesk',ui-sans-serif,sans-serif] text-[32px] font-bold leading-none tracking-[-0.03em] ${dark ? "text-white" : "text-green-900"}`}>
        {value}
      </p>
      <p className={`mt-1.5 text-[13px] font-medium ${dark ? "text-white/70" : "text-neutral-500"}`}>{label}</p>
      {delta ? (
        <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[13px] font-semibold ${dark ? "bg-white/10 text-white" : DELTA_LIGHT[deltaTone]}`}>
          {delta}
        </span>
      ) : null}
    </div>
  );
}

type AvatarStackProps = {
  people: { initials: string; tone: string }[];
  max?: number;
};

// Single overlapping-avatar-stack treatment, for "who's involved" summaries.
export function AvatarStack({ people, max = 4 }: AvatarStackProps) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((person, index) => (
        <div
          key={`${person.initials}-${index}`}
          className={`grid h-8 w-8 place-items-center rounded-full border-2 border-cream-50 text-[13px] font-semibold tracking-[-0.04em] ${person.tone}`}
        >
          {person.initials}
        </div>
      ))}
      {overflow > 0 ? (
        <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-cream-50 bg-neutral-200 text-[13px] font-semibold text-neutral-900">
          +{overflow}
        </div>
      ) : null}
    </div>
  );
}
