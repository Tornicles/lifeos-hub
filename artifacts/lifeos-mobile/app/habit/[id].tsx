import { Feather } from "@expo/vector-icons";
import {
  useCreateHabitCheckin,
  useDeleteHabit,
  useListHabitCheckins,
  useListHabits,
} from "@workspace/api-client-react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/EmptyState";
import { Row, ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const habitId = Number(id);
  const colors = useColors();
  const router = useRouter();

  // @ts-ignore
  const { data: habits, isLoading } = useListHabits();
  // @ts-ignore
  const { data: checkins, refetch: refetchCheckins } = useListHabitCheckins(habitId);
  const createCheckin = useCreateHabitCheckin();
  const deleteHabit = useDeleteHabit();

  const habit = ((habits as any) ?? []).find((h: any) => h.id === habitId);
  const checkinList: any[] = (checkins as any) ?? [];

  const handleCheckin = () => {
    // @ts-ignore
    createCheckin.mutate({ habitId, data: { date: new Date().toISOString().slice(0, 10) } }, { onSuccess: () => refetchCheckins() });
  };

  const handleDelete = () => {
    Alert.alert("Delete habit", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          // @ts-ignore
          deleteHabit.mutate({ id: habitId }, { onSuccess: () => router.back() });
        },
      },
    ]);
  };

  if (isLoading || !habit) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: habit.name }} />
      <ScreenContainer>
        <Card>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground }}>{habit.name}</Text>
          {habit.description ? (
            <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 4 }}>{habit.description}</Text>
          ) : null}
          <Row style={{ marginTop: 12 }}>
            <Badge label={`${habit.streak ?? 0} day streak`} variant="warning" />
            <Badge label={habit.frequency ?? "daily"} variant="outline" />
          </Row>
        </Card>

        <Pressable
          onPress={handleCheckin}
          style={{
            backgroundColor: colors.primary,
            borderRadius: colors.radius,
            paddingVertical: 14,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Feather name="check" size={16} color={colors.primaryForeground} />
          <Text style={{ color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }}>Check in today</Text>
        </Pressable>

        <View>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground, marginBottom: 10 }}>History</Text>
          {checkinList.length === 0 ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>No check-ins recorded yet.</Text>
          ) : (
            checkinList
              .slice()
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((c) => (
                <Card key={c.id} style={{ marginBottom: 8 }}>
                  <Row>
                    <Text style={{ color: colors.foreground, fontSize: 13 }}>{new Date(c.date).toDateString()}</Text>
                    <Feather name="check-circle" size={16} color={colors.success} />
                  </Row>
                </Card>
              ))
          )}
        </View>

        <Pressable
          onPress={handleDelete}
          style={{ borderWidth: 1, borderColor: colors.destructive, borderRadius: colors.radius, paddingVertical: 12, alignItems: "center" }}
        >
          <Text style={{ color: colors.destructive, fontFamily: "Inter_600SemiBold" }}>Delete Habit</Text>
        </Pressable>
      </ScreenContainer>
    </>
  );
}
