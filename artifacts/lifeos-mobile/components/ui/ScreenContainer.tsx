import React from "react";
import { RefreshControl, ScrollView, ScrollViewProps, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface ScreenContainerProps extends ScrollViewProps {
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function ScreenContainer({ children, refreshing, onRefresh, contentContainerStyle, ...props }: ScreenContainerProps) {
  const colors = useColors();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[{ padding: 16, gap: 16, paddingBottom: 48 }, contentContainerStyle]}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        ) : undefined
      }
      {...props}
    >
      {children}
    </ScrollView>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, style]}>{children}</View>;
}
