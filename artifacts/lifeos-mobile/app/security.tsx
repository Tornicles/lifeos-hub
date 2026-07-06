import { useGetMySecuritySettings, useUpdateMySecuritySettings } from "@workspace/api-client-react";
import { Stack } from "expo-router";
import React from "react";
import { Switch, Text } from "react-native";

import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/EmptyState";
import { Row, ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

export default function SecurityScreen() {
  const colors = useColors();
  // @ts-ignore
  const { data: security, isLoading, refetch } = useGetMySecuritySettings();
  const updateSecurity = useUpdateMySecuritySettings();

  const s: any = security ?? {};

  return (
    <>
      <Stack.Screen options={{ title: "Security" }} />
      <ScreenContainer>
        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            <Card>
              <Row>
                <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: "Inter_500Medium" }}>Multi-factor authentication</Text>
                <Switch
                  value={!!s.mfaEnabled}
                  onValueChange={() => {
                    // @ts-ignore
                    updateSecurity.mutate({ data: { mfaEnabled: !s.mfaEnabled } }, { onSuccess: () => refetch() });
                  }}
                  trackColor={{ true: colors.primary }}
                />
              </Row>
            </Card>
            <Card>
              <Row>
                <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Login attempts</Text>
                <Text style={{ color: colors.foreground, fontSize: 13, fontFamily: "Inter_600SemiBold" }}>{s.loginAttempts ?? 0}</Text>
              </Row>
              {s.lastFailedLogin && (
                <Row style={{ marginTop: 8 }}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Last failed login</Text>
                  <Text style={{ color: colors.foreground, fontSize: 13 }}>{new Date(s.lastFailedLogin).toLocaleString()}</Text>
                </Row>
              )}
            </Card>
          </>
        )}
      </ScreenContainer>
    </>
  );
}
