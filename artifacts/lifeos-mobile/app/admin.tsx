import { useGetAdminStats, useListAdminSettings, useUpsertAdminSetting } from "@workspace/api-client-react";
import { Stack } from "expo-router";
import React from "react";
import { Text } from "react-native";

import { Card } from "@/components/ui/Card";
import { EmptyState, LoadingState } from "@/components/ui/EmptyState";
import { Row, ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

export default function AdminScreen() {
  const colors = useColors();
  // @ts-ignore
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  // @ts-ignore
  const { data: settings, isLoading: settingsLoading } = useListAdminSettings();

  const s: any = stats ?? {};
  const settingList: any[] = (settings as any) ?? [];

  return (
    <>
      <Stack.Screen options={{ title: "Admin" }} />
      <ScreenContainer>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground }}>Admin Overview</Text>

        {statsLoading ? (
          <LoadingState />
        ) : (
          <Row style={{ gap: 10, flexWrap: "wrap" }}>
            {Object.entries(s).map(([key, value]) => (
              <Card key={key} style={{ flex: 1, minWidth: "45%", alignItems: "center" }}>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground }}>{String(value)}</Text>
                <Text style={{ fontSize: 11, color: colors.mutedForeground, textTransform: "capitalize" }}>{key}</Text>
              </Card>
            ))}
          </Row>
        )}

        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground }}>System Settings</Text>
        {settingsLoading ? (
          <LoadingState />
        ) : settingList.length === 0 ? (
          <EmptyState icon="settings" title="No admin settings configured" />
        ) : (
          settingList.map((setting) => (
            <Card key={setting.id} style={{ marginBottom: 8 }}>
              <Row>
                <Text style={{ color: colors.foreground, fontSize: 13, fontFamily: "Inter_600SemiBold" }}>{setting.settingKey}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{JSON.stringify(setting.settingValue)}</Text>
              </Row>
            </Card>
          ))
        )}
      </ScreenContainer>
    </>
  );
}
