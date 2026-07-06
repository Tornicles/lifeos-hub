import { Feather } from "@expo/vector-icons";
import { useDismissStateWarning, useListStateWarnings, useListSystemState } from "@workspace/api-client-react";
import { Stack } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState, LoadingState } from "@/components/ui/EmptyState";
import { Row, ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

const SEVERITY_VARIANT: Record<string, "destructive" | "warning" | "secondary"> = {
  critical: "destructive",
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

export default function StatesEngineScreen() {
  const colors = useColors();
  // @ts-ignore
  const { data: warnings, isLoading, refetch, isRefetching } = useListStateWarnings();
  // @ts-ignore
  const { data: systemState } = useListSystemState();
  const dismissWarning = useDismissStateWarning();

  const warningList: any[] = (warnings as any) ?? [];
  const stateList: any[] = (systemState as any) ?? [];

  return (
    <>
      <Stack.Screen options={{ title: "States Engine" }} />
      <ScreenContainer refreshing={isRefetching} onRefresh={refetch}>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground }}>State Warnings</Text>

        {isLoading ? (
          <LoadingState />
        ) : warningList.length === 0 ? (
          <EmptyState icon="check-circle" title="No active warnings" subtitle="Everything looks steady" />
        ) : (
          warningList.map((w) => (
            <Card key={w.id} style={{ marginBottom: 8 }}>
              <Row>
                <Text style={{ color: colors.foreground, fontSize: 14, flex: 1, fontFamily: "Inter_600SemiBold" }}>{w.warningType}</Text>
                <Badge label={w.severity ?? "medium"} variant={SEVERITY_VARIANT[w.severity] ?? "secondary"} />
              </Row>
              <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 6 }}>{w.warningText}</Text>
              <Pressable
                onPress={() => {
                  // @ts-ignore
                  dismissWarning.mutate({ id: w.id }, { onSuccess: () => refetch() });
                }}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 }}
              >
                <Feather name="x-circle" size={14} color={colors.mutedForeground} />
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Dismiss</Text>
              </Pressable>
            </Card>
          ))
        )}

        {stateList.length > 0 && (
          <View>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground, marginBottom: 10 }}>System State</Text>
            {stateList.map((s) => (
              <Card key={s.id} style={{ marginBottom: 8 }}>
                <Row>
                  <Text style={{ color: colors.foreground, fontSize: 13 }}>{s.stateKey ?? s.key}</Text>
                  <Text style={{ color: colors.primary, fontSize: 13, fontFamily: "Inter_600SemiBold" }}>{String(s.stateValue ?? s.value)}</Text>
                </Row>
              </Card>
            ))}
          </View>
        )}
      </ScreenContainer>
    </>
  );
}
