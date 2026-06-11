import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function Button({ icon, variant = "primary", className = "", children, ...props }: ButtonProps) {
  return (
    <button className={`btn btn-${variant} ${className}`} {...props}>
      {icon}
      {children ? <span>{children}</span> : null}
    </button>
  );
}
