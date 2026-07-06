import { Feather } from "@expo/vector-icons";
import {
  useCreateHabit,
  useCreateHabitCheckin,
  useListHabits,
} from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, LoadingState } from "@/components/ui/EmptyState";
import { Row, ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function HabitsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // @ts-ignore
  const { data: habits, isLoading, refetch, isRefetching } = useListHabits();
  const createHabit = useCreateHabit();
  const createCheckin = useCreateHabitCheckin();

  const habitList: any[] = (habits as any) ?? [];
  const completedToday = habitList.filter((h) => h.completedToday || h.lastCheckin === todayIso()).length;
  const longestStreak = habitList.reduce((max, h) => Math.max(max, h.streak ?? 0), 0);

  const handleCreate = () => {
    if (!name.trim()) return;
    // @ts-ignore
    createHabit.mutate(
      { data: { name, description, frequency: "daily" } },
      {
        onSuccess: () => {
          setModalVisible(false);
          setName("");
          setDescription("");
          refetch();
        },
      },
    );
  };

  const handleCheckin = (habitId: string) => {
    // @ts-ignore
    createCheckin.mutate(
      { habitId, data: { date: todayIso() } },
      { onSuccess: () => refetch() },
    );
  };

  return (
    <ScreenContainer refreshing={isRefetching} onRefresh={refetch}>
      <Row>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 24, color: colors.foreground }}>Habits</Text>
        <Button label="New Habit" size="sm" onPress={() => setModalVisible(true)} />
      </Row>

      <Row style={{ gap: 10 }}>
        <Card style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground }}>{habitList.length}</Text>
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Total</Text>
        </Card>
        <Card style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: colors.success }}>{completedToday}</Text>
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Today</Text>
        </Card>
        <Card style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: colors.accent }}>{longestStreak}</Text>
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Best streak</Text>
        </Card>
      </Row>

      {isLoading ? (
        <LoadingState />
      ) : habitList.length === 0 ? (
        <EmptyState icon="zap" title="No habits yet" subtitle="Create your first habit to start tracking" />
      ) : (
        habitList.map((habit) => (
          <Card key={habit.id}>
            <Pressable onPress={() => router.push({ pathname: "/habit/[id]", params: { id: habit.id } })}>
              <Row>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground }}>{habit.name}</Text>
                  {habit.description ? (
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>{habit.description}</Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => handleCheckin(habit.id)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: habit.completedToday ? colors.success : colors.secondary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="check" size={18} color={habit.completedToday ? colors.successForeground : colors.mutedForeground} />
                </Pressable>
              </Row>
              <Row style={{ marginTop: 12 }}>
                <Badge label={`${habit.streak ?? 0} day streak`} variant="warning" />
              </Row>
              <Row style={{ marginTop: 10, gap: 4 }}>
                {DAY_LABELS.map((d, idx) => (
                  <View
                    key={idx}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      borderRadius: 6,
                      backgroundColor: colors.muted,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 10, color: colors.mutedForeground }}>{d}</Text>
                  </View>
                ))}
              </Row>
            </Pressable>
          </Card>
        ))
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12 }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: colors.foreground }}>New Habit</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Habit name"
              placeholderTextColor={colors.mutedForeground}
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: colors.radius, padding: 12, color: colors.foreground }}
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description (optional)"
              placeholderTextColor={colors.mutedForeground}
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: colors.radius, padding: 12, color: colors.foreground }}
            />
            <Row style={{ gap: 10 }}>
              <Button label="Cancel" variant="outline" style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
              <Button label="Create" style={{ flex: 1 }} loading={createHabit.isPending} onPress={handleCreate} />
            </Row>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
