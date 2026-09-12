import { MessageCircle } from "lucide-react";
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

  return (
    <Link href="/" className={`flex w-fit items-center ${styles.wrapper}`} aria-label="Delegate home">
      <span
        className={`grid place-items-center shadow-sm ${styles.mark} ${
          light ? "bg-white text-[#1c775b]" : "bg-[#1c775b] text-white"
        }`}
      >
        <MessageCircle size={styles.icon} fill="currentColor" strokeWidth={1.5} />
      </span>
      <span
        className={`font-['Space_Grotesk',ui-sans-serif,sans-serif] font-bold tracking-[-0.03em] ${styles.wordmark} ${
          light ? "text-white" : "text-[#1c382d]"
        }`}
      >
        Delegate
      </span>
    </Link>
  );
}