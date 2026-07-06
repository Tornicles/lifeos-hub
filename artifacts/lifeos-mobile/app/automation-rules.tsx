import { useDeleteAutomationRule, useListAutomationRules, useUpdateAutomationRule } from "@workspace/api-client-react";
import { Stack } from "expo-router";
import React from "react";
import { Alert, Switch, Text } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState, LoadingState } from "@/components/ui/EmptyState";
import { Row, ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

export default function AutomationRulesScreen() {
  const colors = useColors();
  // @ts-ignore
  const { data: rules, isLoading, refetch } = useListAutomationRules();
  const updateRule = useUpdateAutomationRule();
  const deleteRule = useDeleteAutomationRule();

  const ruleList: any[] = (rules as any) ?? [];

  const toggleRule = (rule: any) => {
    // @ts-ignore
    updateRule.mutate({ id: rule.id, data: { isActive: !rule.isActive } }, { onSuccess: () => refetch() });
  };

  const handleDelete = (rule: any) => {
    Alert.alert("Delete rule", rule.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        // @ts-ignore
        onPress: () => deleteRule.mutate({ id: rule.id }, { onSuccess: () => refetch() }),
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Automation Rules" }} />
      <ScreenContainer>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground }}>Rules</Text>

        {isLoading ? (
          <LoadingState />
        ) : ruleList.length === 0 ? (
          <EmptyState icon="sliders" title="No automation rules yet" />
        ) : (
          ruleList.map((rule) => (
            <Card key={rule.id} onLongPress={() => handleDelete(rule)} style={{ marginBottom: 8 }}>
              <Row>
                <Text style={{ color: colors.foreground, fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 }}>{rule.name}</Text>
                <Switch value={!!rule.isActive} onValueChange={() => toggleRule(rule)} trackColor={{ true: colors.primary }} />
              </Row>
              {rule.description ? (
                <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>{rule.description}</Text>
              ) : null}
              <Row style={{ marginTop: 8 }}>
                <Badge label={rule.conditionType} variant="outline" />
                <Badge label={rule.actionTarget} variant="secondary" />
              </Row>
            </Card>
          ))
        )}
      </ScreenContainer>
    </>
  );
}
