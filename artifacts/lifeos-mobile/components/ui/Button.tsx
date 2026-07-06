import React from "react";
import { ActivityIndicator, Pressable, PressableProps, Text } from "react-native";

import { useColors } from "@/hooks/useColors";

type ButtonVariant = "primary" | "outline" | "destructive" | "ghost";

interface ButtonProps extends PressableProps {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  size?: "sm" | "md";
}

export function Button({ label, variant = "primary", loading, size = "md", style, disabled, ...props }: ButtonProps) {
  const colors = useColors();

  const variantStyles: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: colors.primary, fg: colors.primaryForeground },
    outline: { bg: "transparent", fg: colors.foreground, border: colors.border },
    destructive: { bg: colors.destructive, fg: colors.destructiveForeground },
    ghost: { bg: "transparent", fg: colors.primary },
  };

  const v = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      style={(state) => [
        {
          backgroundColor: v.bg,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
          borderRadius: colors.radius,
          paddingVertical: size === "sm" ? 8 : 12,
          paddingHorizontal: size === "sm" ? 14 : 18,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          opacity: isDisabled ? 0.5 : typeof state.pressed === "boolean" && state.pressed ? 0.85 : 1,
        },
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} size="small" />
      ) : (
        <Text style={{ color: v.fg, fontFamily: "Inter_600SemiBold", fontSize: size === "sm" ? 13 : 15 }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
