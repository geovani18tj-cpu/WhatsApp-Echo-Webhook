type DelAvatarProps = {
  size?: number;
  light?: boolean;
  /** Increment to trigger a one-shot forward nudge on the arrow — use when Del sends something. */
  pulse?: number;
  className?: string;
};

// Del's face: the same bubble + two dots + arrow mark as the logo, reused as a
// small avatar wherever Del "speaks" (chat, digest, typing indicator,
// correction loop). One visual treatment, everywhere — no second avatar style.
export function DelAvatar({ size = 28, light = false, pulse = 0, className = "" }: DelAvatarProps) {
  const bubble = light ? "var(--color-cream-50)" : "var(--color-green-700)";
  const dots = light ? "var(--color-green-700)" : "var(--color-cream-50)";

  return (
    <svg viewBox="0 0 96 96" fill="none" width={size} height={size} className={className} aria-hidden="true">
      <rect x="8" y="20" width="80" height="50" rx="25" fill={bubble} />
      <path d="M22 66 L18 84 L38 68 Z" fill={bubble} />
      <circle cx="32" cy="45" r="6" fill={dots} className="del-avatar-eye" />
      <circle cx="50" cy="45" r="6" fill={dots} className="del-avatar-eye" style={{ animationDelay: "120ms" }} />
      <path
        key={pulse}
        d="M62 45 H74"
        stroke="var(--color-orange-600)"
        strokeWidth="6"
        strokeLinecap="round"
        className={pulse ? "del-avatar-arrow-nudge" : undefined}
      />
      <path
        key={`${pulse}-head`}
        d="M68 39 L74 45 L68 51"
        stroke="var(--color-orange-600)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={pulse ? "del-avatar-arrow-nudge" : undefined}
      />
    </svg>
  );
}
