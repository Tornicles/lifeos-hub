import { useGetMyProfile, useUpdateMyProfile } from "@workspace/api-client-react";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, TextInput } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/EmptyState";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  // @ts-ignore
  const { data: profile, isLoading, refetch } = useGetMyProfile();
  const updateProfile = useUpdateMyProfile();
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    // @ts-ignore
    if (profile?.fullName) setFullName(profile.fullName);
  }, [profile]);

  const handleSave = () => {
    // @ts-ignore
    updateProfile.mutate({ data: { fullName } }, { onSuccess: () => refetch() });
  };

  return (
    <>
      <Stack.Screen options={{ title: "Profile" }} />
      <ScreenContainer>
        {isLoading ? (
          <LoadingState />
        ) : (
          <Card>
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.foreground, marginBottom: 6 }}>Full name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: colors.radius, padding: 12, color: colors.foreground, marginBottom: 16 }}
            />
            <Button label="Save changes" loading={updateProfile.isPending} onPress={handleSave} />
          </Card>
        )}
      </ScreenContainer>
    </>
  );
}
