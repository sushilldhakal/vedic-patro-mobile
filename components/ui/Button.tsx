import { Pressable, Text, type PressableProps } from "react-native";
import { cn } from "@/lib/utils";

type Props = PressableProps & {
  label: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
  textClassName?: string;
};

export function Button({
  label,
  variant = "default",
  size = "md",
  className,
  textClassName,
  disabled,
  ...props
}: Props) {
  const base = "items-center justify-center rounded-lg active:opacity-80";
  const sizes = {
    sm: "px-3 py-1.5",
    md: "px-4 py-2.5",
    lg: "px-5 py-3",
  };
  const variants = {
    default: "bg-primary",
    outline: "border border-border bg-card",
    ghost: "bg-transparent",
    secondary: "bg-secondary",
  };
  const textVariants = {
    default: "text-primary-foreground font-semibold",
    outline: "text-foreground font-medium",
    ghost: "text-primary font-medium",
    secondary: "text-secondary-foreground font-semibold",
  };
  const textSizes = { sm: "text-sm", md: "text-base", lg: "text-lg" };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={cn(base, sizes[size], variants[variant], disabled && "opacity-50", className)}
      {...props}
    >
      <Text className={cn(textSizes[size], textVariants[variant], textClassName)}>{label}</Text>
    </Pressable>
  );
}
