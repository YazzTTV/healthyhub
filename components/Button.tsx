import * as React from "react";

type Variant = "primary" | "secondary" | "ghost" | "subtle";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight " +
  "transition duration-250 ease-out-expo " +
  "disabled:opacity-50 disabled:pointer-events-none select-none";

const sizeStyles: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-soft " +
    "hover:bg-brand-dark hover:shadow-elevated active:translate-y-px",
  secondary:
    "bg-white text-ink ring-1 ring-ink/10 shadow-soft " +
    "hover:ring-brand/30 hover:text-brand-dark active:translate-y-px",
  ghost:
    "bg-transparent text-ink/70 hover:text-brand hover:bg-brand-light/60",
  subtle:
    "bg-brand-light text-brand-dark hover:bg-brand-light/80",
};

type ButtonAsButton = {
  as?: "button";
  variant?: Variant;
  size?: Size;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

type ButtonAsAnchor = {
  as: "a";
  variant?: Variant;
  size?: Size;
  href: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;

type ButtonProps = ButtonAsButton | ButtonAsAnchor;

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string }) {
  return [base, sizeStyles[size], variantStyles[variant], className]
    .filter(Boolean)
    .join(" ");
}

export default function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    className,
    children,
    ...rest
  } = props as ButtonProps & { children?: React.ReactNode };

  const cls = buttonClass({ variant, size, className });

  if (props.as === "a") {
    const { href, ...anchorRest } =
      rest as React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
    return (
      <a href={href} className={cls} {...anchorRest}>
        {children}
      </a>
    );
  }

  return (
    <button
      className={cls}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
