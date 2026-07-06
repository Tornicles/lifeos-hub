import React from "react";
import { Pressable, PressableProps, StyleSheet, View, ViewProps } from "react-native";

import { useColors } from "@/hooks/useColors";

type CardProps = ViewProps & Pick<PressableProps, "onLongPress" | "onPress">;

export function Card({ style, onLongPress, onPress, ...props }: CardProps) {
  const colors = useColors();
  const cardStyle = [
    {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
    style,
  ];

  if (onLongPress || onPress) {
    return <Pressable style={cardStyle} onLongPress={onLongPress} onPress={onPress} {...props} />;
  }

  return <View style={cardStyle} {...props} />;
}

export const styles = StyleSheet.create({});
