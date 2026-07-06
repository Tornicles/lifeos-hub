import { useGenerateAiInsight, useGenerateMonthlyInsight, useGenerateWeeklyInsight } from "@workspace/api-client-react";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, Text } from "react-native";

import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/EmptyState";
import { Row, ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

export default function InsightsScreen() {
  const colors = useColors();
  const weekly = useGenerateWeeklyInsight();
  const monthly = useGenerateMonthlyInsight();
  const ai = useGenerateAiInsight();

  useEffect(() => {
    weekly.mutate({} as any);
    monthly.mutate({} as any);
    ai.mutate({} as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // @ts-ignore
  const weeklyData = weekly.data;
  // @ts-ignore
  const monthlyData = monthly.data;
  // @ts-ignore
  const aiData = ai.data;

  const isLoading = weekly.isPending && monthly.isPending && ai.isPending && !weeklyData && !monthlyData && !aiData;

  return (
    <>
      <Stack.Screen options={{ title: "Insights" }} />
      <ScreenContainer>
        <Row>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground }}>AI Insights</Text>
          <Pressable
            onPress={() => {
              weekly.mutate({} as any);
              monthly.mutate({} as any);
              ai.mutate({} as any);
            }}
          >
            <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Refresh</Text>
          </Pressable>
        </Row>

        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            {aiData?.summary && (
              <Card>
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground, marginBottom: 6 }}>
                  AI Coach
                </Text>
                <Text style={{ color: colors.foreground, fontSize: 14, lineHeight: 20 }}>{aiData.summary}</Text>
              </Card>
            )}
            {weeklyData?.summary && (
              <Card>
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground, marginBottom: 6 }}>
                  Weekly Report
                </Text>
                <Text style={{ color: colors.foreground, fontSize: 14, lineHeight: 20 }}>{weeklyData.summary}</Text>
              </Card>
            )}
            {monthlyData?.summary && (
              <Card>
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground, marginBottom: 6 }}>
                  Monthly Report
                </Text>
                <Text style={{ color: colors.foreground, fontSize: 14, lineHeight: 20 }}>{monthlyData.summary}</Text>
              </Card>
            )}
          </>
        )}
      </ScreenContainer>
    </>
  );
}
