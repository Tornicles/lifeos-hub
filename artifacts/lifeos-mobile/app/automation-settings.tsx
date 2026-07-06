import { useGetAutomationSettings, useUpdateAutomationSettings } from "@workspace/api-client-react";
import { Stack } from "expo-router";
import React from "react";
import { Switch, Text } from "react-native";

import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/EmptyState";
import { Row, ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

const TOGGLES: { key: string; label: string }[] = [
  { key: "autoEvaluationEnabled", label: "Auto evaluation" },
  { key: "conflictResolutionEnabled", label: "Conflict resolution" },
  { key: "notificationsEnabled", label: "Notifications" },
  { key: "calendarAutofillEnabled", label: "Calendar autofill" },
];

export default function AutomationSettingsScreen() {
  const colors = useColors();
  // @ts-ignore
  const { data: settings, isLoading, refetch } = useGetAutomationSettings();
  const updateSettings = useUpdateAutomationSettings();

  const s: any = settings ?? {};

  const toggle = (key: string) => {
    // @ts-ignore
    updateSettings.mutate({ data: { [key]: !s[key] } }, { onSuccess: () => refetch() });
  };

  return (
    <>
      <Stack.Screen options={{ title: "Automation Settings" }} />
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
                <Switch value={!!s[t.key]} onValueChange={() => toggle(t.key)} trackColor={{ true: colors.primary }} />
              </Row>
            ))}
          </Card>
        )}
      </ScreenContainer>
    </>
  );
}
