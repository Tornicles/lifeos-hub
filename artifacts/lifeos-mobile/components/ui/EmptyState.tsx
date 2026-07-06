import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export function EmptyState({
  icon = "inbox",
  title,
  subtitle,
}: {
  icon?: React.ComponentProps<typeof Feather>["name"];
  title: string;
  subtitle?: string;
}) {
  const colors = useColors();
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 8 }}>
      <Feather name={icon} size={32} color={colors.mutedForeground} />
      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground }}>{title}</Text>
      {subtitle && (
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, textAlign: "center" }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

export function LoadingState() {
  const colors = useColors();
  return (
    <View style={{ paddingVertical: 48, alignItems: "center" }}>
      <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>Loading...</Text>
    </View>
  );
}
