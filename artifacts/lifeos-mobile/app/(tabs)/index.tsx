import { useEvaluateAutomation } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Text, View } from "react-native";

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

// NOTE: this screen previously also surfaced an Ultra Score, priority zone,
// 7-day trend, a Daily Insight summary, and an "AI Action Plan" with focus
// recommendations. The Tech-Tate schema migration dropped `ultra_metrics_table`
// and `/automation/evaluate` now only returns `{ rulesEvaluated, actionsQueued }`;
// there is also no `/automation/generate-daily-insight` backend route (calls
// would 404). Those sections were removed rather than left rendering
// undefined data.
export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();

  const automationMutation = useEvaluateAutomation();

  const isLoading = automationMutation.isPending && !automationMutation.data;
  const isRefetching = automationMutation.isPending && !!automationMutation.data;
  const refetch = () => automationMutation.mutate({} as any);

  useEffect(() => {
    automationMutation.mutate({} as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_500Medium" }}>Rules Evaluated</Text>
              <Text style={{ color: colors.foreground, fontSize: 32, fontFamily: "Inter_700Bold", marginTop: 4 }}>
                {auto?.rulesEvaluated ?? 0}
              </Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_500Medium" }}>Actions Queued</Text>
              <Text style={{ color: colors.foreground, fontSize: 32, fontFamily: "Inter_700Bold", marginTop: 4 }}>
                {auto?.actionsQueued ?? 0}
              </Text>
            </Card>
          </Row>

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
        </>
      )}
    </ScreenContainer>
  );
}
