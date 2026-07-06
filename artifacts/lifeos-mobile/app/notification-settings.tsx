import { useGetNotificationPreferences, useUpdateNotificationPreferences } from "@workspace/api-client-react";
import { Stack } from "expo-router";
import React from "react";
import { Switch, Text } from "react-native";

import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/EmptyState";
import { Row, ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

const TOGGLES: { key: string; label: string }[] = [
  { key: "habitRemindersEnabled", label: "Habit reminders" },
  { key: "calendarAlertsEnabled", label: "Calendar alerts" },
  { key: "performanceAlertsEnabled", label: "Performance alerts" },
  { key: "projectAlertsEnabled", label: "Project alerts" },
  { key: "lifeEventAlertsEnabled", label: "Life event alerts" },
  { key: "weeklyReportsEnabled", label: "Weekly reports" },
];

export default function NotificationSettingsScreen() {
  const colors = useColors();
  // @ts-ignore
  const { data: prefs, isLoading, refetch } = useGetNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  const p: any = prefs ?? {};

  const toggle = (key: string) => {
    // @ts-ignore
    updatePrefs.mutate({ data: { [key]: !p[key] } }, { onSuccess: () => refetch() });
  };

  return (
    <>
      <Stack.Screen options={{ title: "Notification Settings" }} />
      <ScreenContainer>
        {isLoading ? (
          <LoadingState />
        ) : (
          <Card style={{ padding: 0 }}>
            {TOGGLES.map((t, idx) => (
              <Row
                key={t.key}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderBottomWidth: idx === TOGGLES.length - 1 ? 0 : 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: "Inter_500Medium" }}>{t.label}</Text>
                <Switch value={!!p[t.key]} onValueChange={() => toggle(t.key)} trackColor={{ true: colors.primary }} />
              </Row>
            ))}
          </Card>
        )}
      </ScreenContainer>
    </>
  );
}
