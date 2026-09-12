import { Link } from "wouter";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  light?: boolean;
};

const sizes = {
  sm: {
    wrapper: "gap-2",
    mark: "h-8 w-8 rounded-[11px]",
    icon: 17,
    wordmark: "text-sm",
  },
  md: {
    wrapper: "gap-3",
    mark: "h-10 w-10 rounded-[13px]",
    icon: 21,
    wordmark: "text-[15px]",
  },
  lg: {
    wrapper: "gap-3.5",
    mark: "h-12 w-12 rounded-2xl",
    icon: 24,
    wordmark: "text-lg",
  },
} as const;

export function Logo({ size = "md", light = false }: LogoProps) {
  const styles = sizes[size];
  const bubble = light ? "#fffdfa" : "#1c775b";
  const dots = light ? "#1c775b" : "#fffdfa";

  return (
    <Link href="/" className={`flex w-fit items-center ${styles.wrapper}`} aria-label="Delegate home">
      <span className={`grid place-items-center ${styles.mark}`}>
        <svg viewBox="0 0 96 96" fill="none" width={styles.icon * 2} height={styles.icon * 2}>
          <rect x="8" y="20" width="80" height="50" rx="25" fill={bubble} />
          <path d="M22 66 L18 84 L38 68 Z" fill={bubble} />
          <circle cx="32" cy="45" r="6" fill={dots} />
          <circle cx="50" cy="45" r="6" fill={dots} />
          <path d="M62 45 H74" stroke="#dc8454" strokeWidth="6" strokeLinecap="round" />
          <path d="M68 39 L74 45 L68 51" stroke="#dc8454" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span
        className={`font-['Space_Grotesk',ui-sans-serif,sans-serif] font-bold tracking-[-0.04em] text-[#16352b] ${styles.wordmark}`}
      >
        Delegate
      </span>
    </Link>
  );
}