import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: "primary" | "secondary" | "danger" | "ghost";
    loading?: boolean;
}

export default function Button({
    children,
    variant = "primary",
    loading = false,
    disabled,
    className = "",
    ...props
}: ButtonProps) {
    const variants = {
        primary: "bg-gray-900 text-white hover:bg-gray-700",
        secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
        danger: "bg-red-600 text-white hover:bg-red-700",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100"
    };

    return (
        <button
            {...props}
            disabled={disabled || loading}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
        >
            {loading ? "Loading..." : children}
        </button>
    );
}