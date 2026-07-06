import { useAuth, useSignUp } from "@clerk/expo";
import { type Href, Link, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function SignUpScreen() {
  // @ts-ignore - Core v3 SDK future API
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");

  const isFetching = fetchStatus === "fetching";
  const styles = makeStyles(colors);

  const handleSubmit = async () => {
    // @ts-ignore
    const { error } = await signUp.password({ emailAddress, password });
    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }
    // @ts-ignore
    if (!error) await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async () => {
    // @ts-ignore
    await signUp.verifications.verifyEmailCode({ code });
    // @ts-ignore
    if (signUp.status === "complete") {
      // @ts-ignore
      await signUp.finalize({
        navigate: ({ session, decorateUrl }: any) => {
          if (session?.currentTask) return;
          const url = decorateUrl("/(tabs)");
          if (Platform.OS === "web" && url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.replace(url as Href);
          }
        },
      });
    } else {
      // @ts-ignore
      console.error("Sign-up attempt not complete:", signUp);
    }
  };

  // @ts-ignore
  if (signUp.status === "complete" || isSignedIn) {
    return null;
  }

  // @ts-ignore
  if (
    signUp.status === "missing_requirements" &&
    // @ts-ignore
    signUp.unverifiedFields?.includes("email_address") &&
    // @ts-ignore
    signUp.missingFields?.length === 0
  ) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
        <Text style={styles.title}>Verify your account</Text>
        <Text style={styles.subtitle}>We sent a code to {emailAddress}</Text>
        <TextInput
          style={styles.input}
          value={code}
          placeholder="Enter your verification code"
          placeholderTextColor={colors.mutedForeground}
          onChangeText={setCode}
          keyboardType="numeric"
        />
        {errors?.fields?.code && <Text style={styles.error}>{errors.fields.code.message}</Text>}
        <Pressable style={styles.button} onPress={handleVerify} disabled={isFetching}>
          {isFetching ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          // @ts-ignore
          onPress={() => signUp.verifications.sendEmailCode()}
        >
          <Text style={styles.link}>I need a new code</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.brand}>LifeOS</Text>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Start tracking your life in one place</Text>

      <Text style={styles.label}>Email address</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        value={emailAddress}
        placeholder="you@example.com"
        placeholderTextColor={colors.mutedForeground}
        onChangeText={setEmailAddress}
        keyboardType="email-address"
      />
      {errors?.fields?.emailAddress && (
        <Text style={styles.error}>{errors.fields.emailAddress.message}</Text>
      )}

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        placeholder="Enter password"
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry
        onChangeText={setPassword}
      />
      {errors?.fields?.password && (
        <Text style={styles.error}>{errors.fields.password.message}</Text>
      )}

      <Pressable
        style={[styles.button, (!emailAddress || !password || isFetching) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!emailAddress || !password || isFetching}
      >
        {isFetching ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <Text style={styles.buttonText}>Sign up</Text>
        )}
      </Pressable>

      <View style={styles.linkRow}>
        <Text style={styles.mutedText}>Already have an account? </Text>
        <Link href="/(auth)/sign-in">
          <Text style={styles.link}>Sign in</Text>
        </Link>
      </View>

      <View nativeID="clerk-captcha" />
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    brand: {
      fontFamily: "Inter_700Bold",
      fontSize: 28,
      color: colors.primary,
      marginBottom: 8,
    },
    title: {
      fontFamily: "Inter_700Bold",
      fontSize: 24,
      color: colors.foreground,
      marginBottom: 4,
    },
    subtitle: {
      fontFamily: "Inter_400Regular",
      fontSize: 15,
      color: colors.mutedForeground,
      marginBottom: 28,
    },
    label: {
      fontFamily: "Inter_500Medium",
      fontSize: 13,
      color: colors.foreground,
      marginBottom: 6,
      marginTop: 14,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: colors.radius,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.foreground,
      backgroundColor: colors.card,
    },
    error: {
      color: colors.destructive,
      fontSize: 12,
      marginTop: 4,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 24,
    },
    secondaryButton: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 16,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: colors.primaryForeground,
      fontFamily: "Inter_600SemiBold",
      fontSize: 15,
    },
    linkRow: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 20,
    },
    mutedText: {
      color: colors.mutedForeground,
      fontSize: 14,
    },
    link: {
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
      fontSize: 14,
    },
  });
}
