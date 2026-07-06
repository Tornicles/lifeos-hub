import { Feather } from "@expo/vector-icons";
import { useDeleteNotification, useListNotifications, useUpdateNotification } from "@workspace/api-client-react";
import { Stack } from "expo-router";
import React from "react";
import { Pressable, Text } from "react-native";

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

export default function NotificationsScreen() {
  const colors = useColors();
  // @ts-ignore
  const { data: notifications, isLoading, refetch, isRefetching } = useListNotifications();
  const updateNotification = useUpdateNotification();
  const deleteNotification = useDeleteNotification();

  const list: any[] = (notifications as any) ?? [];

  const markRead = (n: any) => {
    // @ts-ignore
    updateNotification.mutate({ id: n.id, data: { isRead: true } }, { onSuccess: () => refetch() });
  };

  return (
    <>
      <Stack.Screen options={{ title: "Notifications" }} />
      <ScreenContainer refreshing={isRefetching} onRefresh={refetch}>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground }}>Notifications</Text>

        {isLoading ? (
          <LoadingState />
        ) : list.length === 0 ? (
          <EmptyState icon="bell" title="You're all caught up" />
        ) : (
          list.map((n) => (
            <Card key={n.id} style={{ marginBottom: 8, opacity: n.isRead ? 0.6 : 1 }}>
              <Pressable onPress={() => markRead(n)}>
                <Row>
                  <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 }}>{n.title}</Text>
                  <Badge label={n.severity ?? "info"} variant={SEVERITY_VARIANT[n.severity] ?? "secondary"} />
                </Row>
                <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 6 }}>{n.message}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  // @ts-ignore
                  deleteNotification.mutate({ id: n.id }, { onSuccess: () => refetch() });
                }}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 }}
              >
                <Feather name="trash-2" size={13} color={colors.mutedForeground} />
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Remove</Text>
              </Pressable>
            </Card>
          ))
        )}
      </ScreenContainer>
    </>
  );
}
