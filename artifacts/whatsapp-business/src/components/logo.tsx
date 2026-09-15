import { Link } from "wouter";
import { DelAvatar } from "@/components/del-avatar";

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
      <span className={`grid place-items-center ${styles.mark}`}>
        <DelAvatar size={styles.icon * 2} light={light} />
      </span>
      <span
        className={`font-['Space_Grotesk',ui-sans-serif,sans-serif] font-bold tracking-[-0.04em] ${light ? "text-white" : "text-green-900"} ${styles.wordmark}`}
      >
        Delegate
      </span>
    </Link>
  );
}