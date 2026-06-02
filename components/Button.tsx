"use client"

import { motion } from "framer-motion"
import { type ReactNode, type ButtonHTMLAttributes } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: "primary" | "secondary" | "danger" | "ghost"
  size?: "sm" | "md" | "lg"
}

const variants = {
  primary:
    "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm",
  secondary:
    "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300",
  danger:
    "bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400",
  ghost:
    "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
}

const sizes = {
  sm: "px-2.5 py-1.5 text-xs rounded-lg",
  md: "px-3.5 py-2 text-sm rounded-xl",
  lg: "px-5 py-2.5 text-sm rounded-xl",
}

export function Button({
  children,
  variant = "secondary",
  size = "md",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled}
      {...(props as any)}
    >
      {children}
    </motion.button>
  )
}

// 图标按钮
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: "default" | "danger" | "ghost"
  title: string
}

const iconVariants = {
  default:
    "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400",
  danger:
    "bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-500 dark:text-red-400",
  ghost:
    "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
}

export function IconButton({
  children,
  variant = "default",
  className = "",
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`
        p-1.5 rounded-lg transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${iconVariants[variant]}
        ${className}
      `}
      disabled={disabled}
      {...(props as any)}
    >
      {children}
    </motion.button>
  )
}
