import { useEvaluateAutomation, useGenerateDailyInsight } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/EmptyState";
import { Row, ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

const HUBS = [
  { name: "Finance", code: "FIN" },
  { name: "Health", code: "HEA" },
  { name: "Work", code: "WOR" },
  { name: "Academy", code: "ACA" },
  { name: "Personal Dev", code: "PER" },
  { name: "Household", code: "HOU" },
  { name: "Relationships", code: "REL" },
  { name: "Projects", code: "PRO" },
  { name: "Mindset", code: "MIN" },
];

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();

  const automationMutation = useEvaluateAutomation();
  const insightMutation = useGenerateDailyInsight();

  const isLoading = automationMutation.isPending && !automationMutation.data;
  const isRefetching = automationMutation.isPending && !!automationMutation.data;
  const refetch = () => automationMutation.mutate({} as any);

  useEffect(() => {
    automationMutation.mutate({} as any);
    insightMutation.mutate({} as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // @ts-ignore
  const insight = insightMutation.data;
  // @ts-ignore
  const auto = automationMutation.data;

  const currentDate = new Date();
  const greeting = currentDate.getHours() < 12 ? "Good Morning" : currentDate.getHours() < 18 ? "Good Afternoon" : "Good Evening";
  const dateStr = currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <ScreenContainer refreshing={isRefetching} onRefresh={refetch}>
      <View style={{ backgroundColor: colors.primary, borderRadius: colors.radius, padding: 20 }}>
        <Text style={{ color: colors.primaryForeground, fontFamily: "Inter_700Bold", fontSize: 24 }}>{greeting}!</Text>
        <Text style={{ color: colors.primaryForeground, opacity: 0.85, marginTop: 4, fontFamily: "Inter_400Regular" }}>
          {dateStr}
        </Text>
      </View>

      {isLoading ? (
        <LoadingState />
      ) : (
        <>
          <Row style={{ gap: 12 }}>
            <Card style={{ flex: 1 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_500Medium" }}>Ultra Score</Text>
              <Text style={{ color: colors.foreground, fontSize: 32, fontFamily: "Inter_700Bold", marginTop: 4 }}>
                {auto?.ultraScore ?? 0}
              </Text>
              {auto?.state && <Badge label={auto.state} variant="secondary" />}
            </Card>
            <Card style={{ flex: 1 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_500Medium" }}>Priority Zone</Text>
              <Text style={{ color: colors.foreground, fontSize: 16, fontFamily: "Inter_600SemiBold", marginTop: 8 }}>
                {auto?.priorityZone ?? "Balanced"}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 8 }}>
                7-day trend:{" "}
                <Text style={{ color: (auto?.scoreTrend ?? 0) >= 0 ? colors.success : colors.destructive }}>
                  {auto?.scoreTrend ? (auto.scoreTrend > 0 ? `+${auto.scoreTrend}` : auto.scoreTrend) : "No change"}
                </Text>
              </Text>
            </Card>
          </Row>

          {insight?.summary && (
            <Card>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground, marginBottom: 6 }}>
                Daily Insight
              </Text>
              <Text style={{ color: colors.foreground, fontSize: 14, lineHeight: 20 }}>{insight.summary}</Text>
            </Card>
          )}

          <View>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: colors.foreground, marginBottom: 12 }}>Life Hubs</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {HUBS.map((hub) => (
                <Card
                  key={hub.code}
                  onTouchEnd={() => router.push({ pathname: "/hub/[code]", params: { code: hub.code } })}
                  style={{ width: "31%", alignItems: "center", paddingVertical: 16 }}
                >
                  <Text style={{ color: colors.foreground, fontSize: 12, fontFamily: "Inter_500Medium", textAlign: "center" }}>
                    {hub.name}
                  </Text>
                </Card>
              ))}
            </View>
          </View>

          {auto?.focusRecommendations && (
            <Card>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground, marginBottom: 10 }}>
                AI Action Plan
              </Text>
              <Row style={{ marginBottom: 10 }}>
                <View
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: colors.radius,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    flex: 1,
                    marginRight: 6,
                  }}
                >
                  <Text style={{ color: colors.primaryForeground, fontSize: 12, fontFamily: "Inter_600SemiBold" }}>
                    {auto.focusRecommendations.primaryDomain}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: colors.secondary,
                    borderRadius: colors.radius,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    flex: 1,
                    marginLeft: 6,
                  }}
                >
                  <Text style={{ color: colors.secondaryForeground, fontSize: 12, fontFamily: "Inter_600SemiBold" }}>
                    {auto.focusRecommendations.secondaryDomain}
                  </Text>
                </View>
              </Row>
              {auto.focusRecommendations.suggestedActions?.map((action: string, idx: number) => (
                <Text key={idx} style={{ color: colors.foreground, fontSize: 13, marginTop: 6 }}>
                  {idx + 1}. {action}
                </Text>
              ))}
            </Card>
          )}
        </>
      )}
    </ScreenContainer>
  );
}
