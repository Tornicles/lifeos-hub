import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Stack } from "expo-router";
import React from "react";
import { Pressable, Text, useColorScheme } from "react-native";

import { Card } from "@/components/ui/Card";
import { Row, ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const links: { icon: React.ComponentProps<typeof Feather>["name"]; label: string; href: string }[] = [
    { icon: "user", label: "Profile", href: "/profile" },
    { icon: "shield", label: "Security", href: "/security" },
    { icon: "bell", label: "Notification preferences", href: "/notification-settings" },
    { icon: "sliders", label: "Automation settings", href: "/automation-settings" },
  ];

  return (
    <>
      <Stack.Screen options={{ title: "Settings" }} />
      <ScreenContainer>
        <Card>
          <Row>
            <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: "Inter_500Medium" }}>Appearance</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, textTransform: "capitalize" }}>{colorScheme ?? "light"}</Text>
          </Row>
        </Card>
        <Card style={{ padding: 0 }}>
          {links.map((link, idx) => (
            <Pressable
              key={link.href}
              onPress={() => router.push(link.href as any)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: idx === links.length - 1 ? 0 : 1,
                borderBottomColor: colors.border,
                gap: 12,
              }}
            >
              <Feather name={link.icon} size={18} color={colors.mutedForeground} />
              <Text style={{ flex: 1, fontSize: 14, color: colors.foreground, fontFamily: "Inter_500Medium" }}>{link.label}</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </Card>
      </ScreenContainer>
    </>
  );
}
