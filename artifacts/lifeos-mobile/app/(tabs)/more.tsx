import { useAuth, useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Row, ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

const ITEMS: { icon: React.ComponentProps<typeof Feather>["name"]; label: string; href: string }[] = [
  { icon: "list", label: "Logs", href: "/logs" },
  { icon: "zap", label: "Automation", href: "/automation" },
  { icon: "sliders", label: "Automation Rules", href: "/automation-rules" },
  { icon: "settings", label: "Automation Settings", href: "/automation-settings" },
  { icon: "bell", label: "Notifications", href: "/notifications" },
  { icon: "sliders", label: "Notification Settings", href: "/notification-settings" },
  { icon: "user", label: "Profile", href: "/profile" },
  { icon: "shield", label: "Security", href: "/security" },
  { icon: "settings", label: "Settings", href: "/settings" },
  { icon: "lock", label: "Admin", href: "/admin" },
];

export default function MoreScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useAuth();

  return (
    <ScreenContainer>
      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 24, color: colors.foreground }}>More</Text>

      <Card>
        <Row>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.primaryForeground, fontFamily: "Inter_700Bold", fontSize: 16 }}>
              {(user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? "U").toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.foreground }}>
              {user?.fullName || user?.emailAddresses?.[0]?.emailAddress}
            </Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>{user?.emailAddresses?.[0]?.emailAddress}</Text>
          </View>
        </Row>
      </Card>

      <Card style={{ padding: 0 }}>
        {ITEMS.map((item, idx) => (
          <Pressable
            key={item.href}
            onPress={() => router.push(item.href as any)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderBottomWidth: idx === ITEMS.length - 1 ? 0 : 1,
              borderBottomColor: colors.border,
              gap: 12,
            }}
          >
            <Feather name={item.icon} size={18} color={colors.mutedForeground} />
            <Text style={{ flex: 1, fontSize: 14, color: colors.foreground, fontFamily: "Inter_500Medium" }}>{item.label}</Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </Card>

      <Pressable
        onPress={() => signOut()}
        style={{
          borderWidth: 1,
          borderColor: colors.destructive,
          borderRadius: colors.radius,
          paddingVertical: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.destructive, fontFamily: "Inter_600SemiBold" }}>Sign Out</Text>
      </Pressable>
    </ScreenContainer>
  );
}
