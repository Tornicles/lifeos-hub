import React from "react";
import { Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

export function Badge({
  label,
  variant = "default",
}: {
  label: string;
  variant?: BadgeVariant;
}) {
  const colors = useColors();

  const variantStyles: Record<BadgeVariant, { bg: string; fg: string; border?: string }> = {
    default: { bg: colors.primary, fg: colors.primaryForeground },
    secondary: { bg: colors.secondary, fg: colors.secondaryForeground },
    destructive: { bg: colors.destructive, fg: colors.destructiveForeground },
    outline: { bg: "transparent", fg: colors.foreground, border: colors.border },
    success: { bg: colors.success, fg: colors.successForeground },
    warning: { bg: colors.warning, fg: colors.warningForeground },
  };

  const v = variantStyles[variant];

  return (
    <View
      style={{
        backgroundColor: v.bg,
        borderWidth: v.border ? 1 : 0,
        borderColor: v.border,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color: v.fg, fontSize: 12, fontFamily: "Inter_600SemiBold" }}>{label}</Text>
    </View>
  );
}
