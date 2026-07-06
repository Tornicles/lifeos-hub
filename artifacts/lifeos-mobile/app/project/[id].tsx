import { Feather } from "@expo/vector-icons";
import { useCreateTask, useGetProject, useListTasks, useUpdateTask } from "@workspace/api-client-react";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, LoadingState } from "@/components/ui/EmptyState";
import { Row, ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = Number(id);
  const colors = useColors();
  const [modalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");

  // @ts-ignore
  const { data: project, isLoading: projectLoading } = useGetProject(projectId);
  // @ts-ignore
  const { data: tasks, isLoading: tasksLoading, refetch } = useListTasks(projectId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const taskList: any[] = (tasks as any) ?? [];
  const proj: any = project;

  const handleAddTask = () => {
    if (!taskTitle.trim()) return;
    // @ts-ignore
    createTask.mutate(
      { projectId, data: { title: taskTitle, status: "todo" } },
      {
        onSuccess: () => {
          setTaskTitle("");
          setModalVisible(false);
          refetch();
        },
      },
    );
  };

  const toggleTask = (task: any) => {
    const nextStatus = task.status === "done" ? "todo" : "done";
    // @ts-ignore
    updateTask.mutate({ id: task.id, data: { status: nextStatus } }, { onSuccess: () => refetch() });
  };

  if (projectLoading || !proj) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: proj.name }} />
      <ScreenContainer>
        <Card>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground }}>{proj.name}</Text>
          {proj.description ? (
            <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 4 }}>{proj.description}</Text>
          ) : null}
          <Row style={{ marginTop: 12 }}>
            <Badge label={proj.priority ?? "medium"} variant="warning" />
            <Badge label={proj.status ?? "not_started"} variant="secondary" />
          </Row>
        </Card>

        <Row>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground }}>Tasks</Text>
          <Button label="Add Task" size="sm" onPress={() => setModalVisible(true)} />
        </Row>

        {tasksLoading ? (
          <LoadingState />
        ) : taskList.length === 0 ? (
          <EmptyState icon="check-square" title="No tasks yet" />
        ) : (
          taskList.map((task) => (
            <Card key={task.id} style={{ marginBottom: 8 }}>
              <Pressable onPress={() => toggleTask(task)} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Feather
                  name={task.status === "done" ? "check-circle" : "circle"}
                  size={20}
                  color={task.status === "done" ? colors.success : colors.mutedForeground}
                />
                <Text
                  style={{
                    flex: 1,
                    color: colors.foreground,
                    fontSize: 14,
                    textDecorationLine: task.status === "done" ? "line-through" : "none",
                  }}
                >
                  {task.title}
                </Text>
              </Pressable>
            </Card>
          ))
        )}

        <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12 }}>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: colors.foreground }}>New Task</Text>
              <TextInput
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholder="Task title"
                placeholderTextColor={colors.mutedForeground}
                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: colors.radius, padding: 12, color: colors.foreground }}
              />
              <Row style={{ gap: 10 }}>
                <Button label="Cancel" variant="outline" style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
                <Button label="Add" style={{ flex: 1 }} loading={createTask.isPending} onPress={handleAddTask} />
              </Row>
            </View>
          </View>
        </Modal>
      </ScreenContainer>
    </>
  );
}
