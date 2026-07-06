import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";

import { useColors } from "@/hooks/useColors";

export function Card({ style, ...props }: ViewProps) {
  const colors = useColors();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
        },
        style,
      ]}
      {...props}
    />
  );
}

export const styles = StyleSheet.create({});
