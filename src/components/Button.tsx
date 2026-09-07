import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ icon, variant = "primary", className = "", children, type = "button", onClick, ...props }: ButtonProps) {
  return (
    <button type={type} onClick={onClick} className={`button button-${variant} ${className}`.trim()} {...props}>
      {icon}
      {children}
    </button>
  );
}
