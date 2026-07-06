import { useListUltraDomains, useListUltraMetrics } from "@workspace/api-client-react";
import { Stack } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { EmptyState, LoadingState } from "@/components/ui/EmptyState";
import { Row, ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

export default function UltraHubScreen() {
  const colors = useColors();
  // @ts-ignore
  const { data: domains, isLoading: domainsLoading } = useListUltraDomains();
  // @ts-ignore
  const { data: metrics, isLoading: metricsLoading } = useListUltraMetrics();

  const domainList: any[] = (domains as any) ?? [];
  const metricList: any[] = (metrics as any) ?? [];

  return (
    <>
      <Stack.Screen options={{ title: "Ultra Hub" }} />
      <ScreenContainer>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground }}>Cross-domain Metrics</Text>
        {domainsLoading || metricsLoading ? (
          <LoadingState />
        ) : domainList.length === 0 ? (
          <EmptyState icon="bar-chart-2" title="No ultra domains configured" />
        ) : (
          domainList.map((domain) => {
            const domainMetrics = metricList.filter((m) => m.domainId === domain.id);
            const latest = domainMetrics[0];
            return (
              <Card key={domain.id} style={{ marginBottom: 8 }}>
                <Row>
                  <View>
                    <Text style={{ color: colors.foreground, fontSize: 15, fontFamily: "Inter_600SemiBold" }}>{domain.name}</Text>
                    {domain.description ? (
                      <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>{domain.description}</Text>
                    ) : null}
                  </View>
                  <Text style={{ color: colors.primary, fontSize: 20, fontFamily: "Inter_700Bold" }}>{latest?.value ?? "-"}</Text>
                </Row>
              </Card>
            );
          })
        )}
      </ScreenContainer>
    </>
  );
}
