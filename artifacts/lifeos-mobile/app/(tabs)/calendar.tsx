import { Feather } from "@expo/vector-icons";
import { useListCalendarEntries } from "@workspace/api-client-react";
import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { EmptyState, LoadingState } from "@/components/ui/EmptyState";
import { Row, ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

const DOMAIN_COLORS: Record<string, string> = {
  finance: "#1F517A",
  health: "#E31627",
  work: "#3387CC",
  academy: "#74B800",
  personal_dev: "#FFBF00",
  household: "#8F96A3",
  relationships: "#F5A623",
  spirituality: "#7C4DFF",
  mindset: "#00B8A9",
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function CalendarScreen() {
  const colors = useColors();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [weekOffset]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    }),
    [weekStart],
  );

  // @ts-ignore
  const { data: entries, isLoading, refetch, isRefetching } = useListCalendarEntries();
  const entryList: any[] = (entries as any) ?? [];

  const entriesByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const day of weekDays) {
      map[day.toDateString()] = [];
    }
    for (const entry of entryList) {
      const entryDate = new Date(entry.startTime ?? entry.date);
      const key = entryDate.toDateString();
      if (map[key]) map[key].push(entry);
    }
    return map;
  }, [entryList, weekDays]);

  return (
    <ScreenContainer refreshing={isRefetching} onRefresh={refetch}>
      <Row>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 24, color: colors.foreground }}>Calendar</Text>
        <Row style={{ gap: 8 }}>
          <Pressable onPress={() => setWeekOffset((w) => w - 1)}>
            <Feather name="chevron-left" size={22} color={colors.foreground} />
          </Pressable>
          <Pressable onPress={() => setWeekOffset(0)}>
            <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Today</Text>
          </Pressable>
          <Pressable onPress={() => setWeekOffset((w) => w + 1)}>
            <Feather name="chevron-right" size={22} color={colors.foreground} />
          </Pressable>
        </Row>
      </Row>

      <Card>
        <Row style={{ gap: 10 }}>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: colors.foreground }}>{entryList.length}</Text>
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>This week</Text>
          </View>
        </Row>
      </Card>

      {isLoading ? (
        <LoadingState />
      ) : entryList.length === 0 ? (
        <EmptyState icon="calendar" title="No events this week" />
      ) : (
        weekDays.map((day) => {
          const dayEntries = entriesByDay[day.toDateString()] ?? [];
          if (dayEntries.length === 0) return null;
          return (
            <View key={day.toDateString()}>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.mutedForeground, marginBottom: 8 }}>
                {day.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </Text>
              {dayEntries.map((entry) => (
                <Card
                  key={entry.id}
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: DOMAIN_COLORS[entry.focusDomain] ?? colors.primary,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.foreground }}>{entry.title}</Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                    {new Date(entry.startTime ?? entry.date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </Text>
                </Card>
              ))}
            </View>
          );
        })
      )}
    </ScreenContainer>
  );
}
