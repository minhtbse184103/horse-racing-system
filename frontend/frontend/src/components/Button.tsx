import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: ReactNode;
}

export default function Button({ className = 'primary-button', type = 'button', children, ...props }: ButtonProps) {
  return (
    <button className={className} type={type} {...props}>
      {children}
    </button>
  );
}
