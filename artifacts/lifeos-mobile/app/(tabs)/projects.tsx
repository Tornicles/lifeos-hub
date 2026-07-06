import { Feather } from "@expo/vector-icons";
import { useListProjects } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState, LoadingState } from "@/components/ui/EmptyState";
import { Row, ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

const PRIORITY_VARIANT: Record<string, "destructive" | "warning" | "secondary"> = {
  critical: "destructive",
  high: "warning",
  medium: "secondary",
  low: "secondary",
};

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  done: "Done",
};

export default function ProjectsScreen() {
  const colors = useColors();
  const router = useRouter();

  // @ts-ignore
  const { data: projects, isLoading, refetch, isRefetching } = useListProjects();
  const projectList: any[] = (projects as any) ?? [];

  return (
    <ScreenContainer refreshing={isRefetching} onRefresh={refetch}>
      <Row>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 24, color: colors.foreground }}>Projects</Text>
      </Row>

      {isLoading ? (
        <LoadingState />
      ) : projectList.length === 0 ? (
        <EmptyState icon="folder" title="No projects yet" subtitle="Create a project on the web app to see it here" />
      ) : (
        projectList.map((project) => (
          <Pressable key={project.id} onPress={() => router.push({ pathname: "/project/[id]", params: { id: project.id } })}>
            <Card>
              <Row>
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.foreground, flex: 1 }}>
                  {project.name}
                </Text>
                <Badge label={project.priority ?? "medium"} variant={PRIORITY_VARIANT[project.priority] ?? "secondary"} />
              </Row>

              <Row style={{ marginTop: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor:
                        project.status === "done" ? colors.success : project.status === "in_progress" ? colors.primary : colors.mutedForeground,
                    }}
                  />
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>{STATUS_LABEL[project.status] ?? project.status}</Text>
                </View>
                {project.dueDate ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Feather name="calendar" size={12} color={colors.mutedForeground} />
                    <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                      {new Date(project.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                ) : null}
              </Row>

              {typeof project.taskCount === "number" && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                  <Feather name="check-square" size={12} color={colors.mutedForeground} />
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                    {project.completedTaskCount ?? 0} / {project.taskCount} tasks
                  </Text>
                </View>
              )}
            </Card>
          </Pressable>
        ))
      )}
    </ScreenContainer>
  );
}
