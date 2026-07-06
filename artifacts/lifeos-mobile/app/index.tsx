import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import React from "react";

export default function Index() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }
  return <Redirect href="/(auth)/sign-in" />;
}
