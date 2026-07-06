import { useCreateLog, useListLogs } from "@workspace/api-client-react";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { Modal, Text, TextInput, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, LoadingState } from "@/components/ui/EmptyState";
import { Row, ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

export default function LogsScreen() {
  const colors = useColors();
  const [modalVisible, setModalVisible] = useState(false);
  const [note, setNote] = useState("");

  // @ts-ignore
  const { data: logs, isLoading, refetch, isRefetching } = useListLogs();
  const createLog = useCreateLog();

  const logList: any[] = (logs as any) ?? [];

  const handleCreate = () => {
    if (!note.trim()) return;
    // @ts-ignore
    createLog.mutate(
      { data: { notes: note, source: "manual", logDate: new Date().toISOString().slice(0, 10) } },
      { onSuccess: () => { setNote(""); setModalVisible(false); refetch(); } },
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: "Logs" }} />
      <ScreenContainer refreshing={isRefetching} onRefresh={refetch}>
        <Row>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground }}>Activity Logs</Text>
          <Button label="Add" size="sm" onPress={() => setModalVisible(true)} />
        </Row>

        {isLoading ? (
          <LoadingState />
        ) : logList.length === 0 ? (
          <EmptyState icon="list" title="No logs yet" />
        ) : (
          logList.map((l) => (
            <Card key={l.id} style={{ marginBottom: 8 }}>
              <Row>
                <Text style={{ color: colors.foreground, fontSize: 13, flex: 1 }}>{l.notes}</Text>
                <Badge label={l.source ?? "manual"} variant="outline" />
              </Row>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 6 }}>
                {new Date(l.createdAt).toLocaleString()}
              </Text>
            </Card>
          ))
        )}

        <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12 }}>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: colors.foreground }}>New Log</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="What happened?"
                placeholderTextColor={colors.mutedForeground}
                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: colors.radius, padding: 12, color: colors.foreground }}
              />
              <Row style={{ gap: 10 }}>
                <Button label="Cancel" variant="outline" style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
                <Button label="Save" style={{ flex: 1 }} loading={createLog.isPending} onPress={handleCreate} />
              </Row>
            </View>
          </View>
        </Modal>
      </ScreenContainer>
    </>
  );
}
