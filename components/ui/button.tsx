"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "gradient-accent text-white font-semibold shadow-lg",
  secondary: "glass text-white font-medium",
  ghost: "text-white/60 hover:text-white",
  destructive: "bg-red-500/20 text-red-400 border border-red-500/30",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm rounded-xl",
  md: "h-11 px-5 text-[15px] rounded-[14px]",
  lg: "h-14 px-7 text-[17px] rounded-2xl",
  xl: "h-16 px-8 text-[19px] rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      children,
      className,
      disabled,
      fullWidth,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        whileTap={isDisabled ? {} : { scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        disabled={isDisabled}
        className={cn(
          "relative inline-flex items-center justify-center gap-2",
          "min-w-[44px] min-h-[44px]",
          "transition-opacity duration-200",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "select-none outline-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner size={size} />
            {children && <span>{children}</span>}
          </span>
        ) : (
          <>
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

function LoadingSpinner({ size }: { size: ButtonSize }) {
  const s = size === "sm" ? 14 : size === "md" ? 16 : 20;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
    >
      <circle
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="31.4"
        strokeDashoffset="10"
      />
    </svg>
  );
}
