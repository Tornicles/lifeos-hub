import { useListHubs, useListLogs, useListMetrics } from "@workspace/api-client-react";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState, LoadingState } from "@/components/ui/EmptyState";
import { Row, ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

export default function HubDetailScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const colors = useColors();
  const [tab, setTab] = useState<"metrics" | "logs">("metrics");

  // @ts-ignore
  const { data: hubs, isLoading: hubsLoading } = useListHubs();
  const hub = ((hubs as any) ?? []).find((h: any) => h.code === code);

  // @ts-ignore
  const { data: metrics, isLoading: metricsLoading } = useListMetrics(hub ? { hubId: hub.id } : undefined);
  // @ts-ignore
  const { data: logs, isLoading: logsLoading } = useListLogs(hub ? { hubId: hub.id } : undefined);

  const metricList: any[] = (metrics as any) ?? [];
  const logList: any[] = (logs as any) ?? [];

  const last7 = metricList.slice(0, 7);
  const avgScore = last7.length ? Math.round(last7.reduce((s, m) => s + Number(m.value ?? 0), 0) / last7.length) : 0;

  return (
    <>
      <Stack.Screen options={{ title: hub?.name ?? String(code) }} />
      <ScreenContainer>
        {hubsLoading || !hub ? (
          <LoadingState />
        ) : (
          <>
            <Row style={{ gap: 10 }}>
              <Card style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 22, color: colors.foreground }}>{avgScore}</Text>
                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Current Score</Text>
              </Card>
              <Card style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 22, color: colors.foreground }}>{metricList.length}</Text>
                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Entries</Text>
              </Card>
              <Card style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 22, color: colors.foreground }}>{logList.length}</Text>
                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Activity</Text>
              </Card>
            </Row>

            <Row style={{ gap: 8 }}>
              <Pressable
                onPress={() => setTab("metrics")}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: "center",
                  borderRadius: colors.radius,
                  backgroundColor: tab === "metrics" ? colors.primary : colors.secondary,
                }}
              >
                <Text style={{ color: tab === "metrics" ? colors.primaryForeground : colors.secondaryForeground, fontFamily: "Inter_600SemiBold" }}>
                  Metrics
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setTab("logs")}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: "center",
                  borderRadius: colors.radius,
                  backgroundColor: tab === "logs" ? colors.primary : colors.secondary,
                }}
              >
                <Text style={{ color: tab === "logs" ? colors.primaryForeground : colors.secondaryForeground, fontFamily: "Inter_600SemiBold" }}>
                  Logs
                </Text>
              </Pressable>
            </Row>

            {tab === "metrics" ? (
              metricsLoading ? (
                <LoadingState />
              ) : metricList.length === 0 ? (
                <EmptyState icon="bar-chart-2" title="No metrics yet" />
              ) : (
                metricList.map((m) => (
                  <Card key={m.id} style={{ marginBottom: 8 }}>
                    <Row>
                      <View>
                        <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: "Inter_600SemiBold" }}>{m.name}</Text>
                        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{new Date(m.recordedAt ?? m.createdAt).toDateString()}</Text>
                      </View>
                      <Text style={{ color: colors.primary, fontSize: 18, fontFamily: "Inter_700Bold" }}>{m.value}</Text>
                    </Row>
                  </Card>
                ))
              )
            ) : logsLoading ? (
              <LoadingState />
            ) : logList.length === 0 ? (
              <EmptyState icon="list" title="No activity logged" />
            ) : (
              logList.map((l) => (
                <Card key={l.id} style={{ marginBottom: 8 }}>
                  <Row>
                    <Text style={{ color: colors.foreground, fontSize: 13, flex: 1 }}>{l.description ?? l.note}</Text>
                    <Badge label={l.source ?? "manual"} variant="outline" />
                  </Row>
                </Card>
              ))
            )}
          </>
        )}
      </ScreenContainer>
    </>
  );
}
