import { useListAutomationExecutions, useListAutomationQueue, useProcessAutomationQueue } from "@workspace/api-client-react";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, LoadingState } from "@/components/ui/EmptyState";
import { Row, ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

export default function AutomationScreen() {
  const colors = useColors();
  const [tab, setTab] = useState<"queue" | "history">("queue");

  // @ts-ignore
  const { data: queue, isLoading: queueLoading, refetch: refetchQueue } = useListAutomationQueue();
  // @ts-ignore
  const { data: executions, isLoading: execLoading } = useListAutomationExecutions();
  const processQueue = useProcessAutomationQueue();

  const queueList: any[] = (queue as any) ?? [];
  const execList: any[] = (executions as any) ?? [];

  return (
    <>
      <Stack.Screen options={{ title: "Automation" }} />
      <ScreenContainer>
        <Row>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground }}>Automation Engine</Text>
          <Button
            label="Process Queue"
            size="sm"
            loading={processQueue.isPending}
            onPress={() => {
              // @ts-ignore
              processQueue.mutate({} as any, { onSuccess: () => refetchQueue() });
            }}
          />
        </Row>

        <Row style={{ gap: 8 }}>
          <Pressable
            onPress={() => setTab("queue")}
            style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: colors.radius, backgroundColor: tab === "queue" ? colors.primary : colors.secondary }}
          >
            <Text style={{ color: tab === "queue" ? colors.primaryForeground : colors.secondaryForeground, fontFamily: "Inter_600SemiBold" }}>Queue</Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("history")}
            style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: colors.radius, backgroundColor: tab === "history" ? colors.primary : colors.secondary }}
          >
            <Text style={{ color: tab === "history" ? colors.primaryForeground : colors.secondaryForeground, fontFamily: "Inter_600SemiBold" }}>History</Text>
          </Pressable>
        </Row>

        {tab === "queue" ? (
          queueLoading ? (
            <LoadingState />
          ) : queueList.length === 0 ? (
            <EmptyState icon="zap" title="Queue is empty" />
          ) : (
            queueList.map((item) => (
              <Card key={item.id} style={{ marginBottom: 8 }}>
                <Row>
                  <Text style={{ color: colors.foreground, fontSize: 14, flex: 1 }}>{item.actionType ?? item.action}</Text>
                  <Badge label={item.status ?? "pending"} variant="warning" />
                </Row>
              </Card>
            ))
          )
        ) : execLoading ? (
          <LoadingState />
        ) : execList.length === 0 ? (
          <EmptyState icon="clock" title="No executions yet" />
        ) : (
          execList.map((exec) => (
            <Card key={exec.id} style={{ marginBottom: 8 }}>
              <Row>
                <Text style={{ color: colors.foreground, fontSize: 14, flex: 1 }}>{exec.triggerType}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{new Date(exec.createdAt).toLocaleDateString()}</Text>
              </Row>
            </Card>
          ))
        )}
      </ScreenContainer>
    </>
  );
}
