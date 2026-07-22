import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth/AuthContext";
import { apiForgotPassword } from "@/lib/auth/client";
import { useLocale } from "@/lib/i18n";
import { colors } from "@/lib/theme";

type Mode = "login" | "signup" | "forgot";

export function AuthDialog({
  open,
  onOpenChange,
  initialMode = "login",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: Mode;
}) {
  const { pick } = useLocale();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function reset(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
    setPassword("");
    setConfirm("");
  }

  function close() {
    onOpenChange(false);
    // Reset to a clean login form for next open.
    setTimeout(() => reset("login"), 200);
    setEmail("");
  }

  async function onSubmit() {
    setError(null);
    setNotice(null);

    if (mode === "signup" && password !== confirm) {
      setError(pick("पासवर्ड मिलेन", "Passwords do not match"));
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError(pick("पासवर्ड कम्तीमा ८ अक्षर हुनुपर्छ", "Password must be at least 8 characters"));
      return;
    }

    setBusy(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
        close();
      } else if (mode === "signup") {
        await signup(email.trim(), password);
        setNotice(
          pick(
            "खाता बनियो! इमेल प्रमाणीकरणको लागि इनबक्स हेर्नुहोस्।",
            "Account created! Check your email to verify your address.",
          ),
        );
        setTimeout(close, 1400);
      } else {
        await apiForgotPassword(email.trim());
        setNotice(
          pick(
            "यदि त्यो इमेल छ भने, रिसेट लिङ्क पठाइएको छ",
            "If that email exists, a reset link has been sent",
          ),
        );
      }
    } catch {
      setError(pick("केही गडबड भयो। पुनः प्रयास गर्नुहोस्।", "Something went wrong. Try again."));
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === "login"
      ? pick("लग-इन", "Sign in")
      : mode === "signup"
        ? pick("खाता खोल्नुहोस्", "Create account")
        : pick("पासवर्ड रिसेट", "Reset password");
  const desc =
    mode === "login"
      ? pick("वैदिक पात्रोमा फेरि स्वागत छ।", "Welcome back to Vedic Patro.")
      : mode === "signup"
        ? pick(
            "आफ्ना कुण्डली प्रोफाइलहरू उपकरणहरूमा सुरक्षित राख्नुहोस्।",
            "Save your kundali profiles across devices.",
          )
        : pick(
            "हामी तपाईंलाई नयाँ पासवर्ड सेट गर्न लिङ्क इमेल गर्छौं।",
            "We'll email you a link to set a new password.",
          );
  const submitLabel = busy
    ? pick("कृपया पर्खनुहोस्…", "Please wait…")
    : mode === "login"
      ? pick("लग-इन", "Sign in")
      : mode === "signup"
        ? pick("खाता खोल्नुहोस्", "Create account")
        : pick("रिसेट लिङ्क पठाउनुहोस्", "Send reset link");

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <Pressable
          className="flex-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={close}
        />
        <View
          className="absolute inset-x-0 bottom-0 max-h-[92%] rounded-t-2xl border-t border-border"
          style={{ backgroundColor: colors.card }}
        >
          <View className="items-center pt-2.5">
            <View className="h-1 w-10 rounded-full" style={{ backgroundColor: colors.border }} />
          </View>
          <ScrollView
            className="px-5"
            contentContainerClassName="pb-8 pt-3"
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-4 flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-2xl font-bold text-foreground">{title}</Text>
                <Text className="mt-1 text-sm text-muted-foreground">{desc}</Text>
              </View>
              <Pressable
                onPress={close}
                className="h-9 w-9 items-center justify-center rounded-full active:bg-muted"
                accessibilityLabel={pick("बन्द गर्नुहोस्", "Close")}
              >
                <Ionicons name="close" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <Field
              label={pick("इमेल", "Email")}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />

            {mode !== "forgot" ? (
              <Field
                label={pick("पासवर्ड", "Password")}
                value={password}
                onChangeText={setPassword}
                placeholder={mode === "signup" ? pick("कम्तीमा ८ अक्षर", "At least 8 characters") : "••••••••"}
                secureTextEntry
                autoCapitalize="none"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                textContentType={mode === "login" ? "password" : "newPassword"}
              />
            ) : null}

            {mode === "signup" ? (
              <Field
                label={pick("पासवर्ड पुष्टि", "Confirm password")}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
              />
            ) : null}

            {error ? <Text className="mt-1 text-sm text-danger">{error}</Text> : null}
            {notice ? <Text className="mt-1 text-sm text-accent">{notice}</Text> : null}

            <Pressable
              onPress={onSubmit}
              disabled={busy}
              className="mt-4 h-12 flex-row items-center justify-center gap-2 rounded-lg bg-primary active:opacity-90"
              style={busy ? { opacity: 0.6 } : undefined}
            >
              {busy ? <ActivityIndicator color="#fff" size="small" /> : null}
              <Text className="text-base font-semibold text-primary-foreground">{submitLabel}</Text>
            </Pressable>

            <View className="mt-4 items-center gap-1.5">
              {mode === "login" ? (
                <>
                  <Pressable onPress={() => reset("forgot")}>
                    <Text className="text-sm text-muted-foreground">
                      {pick("पासवर्ड बिर्सनुभयो?", "Forgot your password?")}
                    </Text>
                  </Pressable>
                  <Text className="text-sm text-muted-foreground">
                    {pick("नयाँ हुनुहुन्छ?", "New here?")}{" "}
                    <Text className="font-semibold text-secondary" onPress={() => reset("signup")}>
                      {pick("खाता खोल्नुहोस्", "Create account")}
                    </Text>
                  </Text>
                </>
              ) : null}
              {mode === "signup" ? (
                <Text className="text-sm text-muted-foreground">
                  {pick("पहिले नै खाता छ?", "Already have an account?")}{" "}
                  <Text className="font-semibold text-secondary" onPress={() => reset("login")}>
                    {pick("लग-इन", "Sign in")}
                  </Text>
                </Text>
              ) : null}
              {mode === "forgot" ? (
                <Pressable onPress={() => reset("login")}>
                  <Text className="text-sm text-muted-foreground">
                    {pick("लग-इनमा फर्कनुहोस्", "Back to sign in")}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View className="mt-3 gap-1.5">
      <Text className="text-sm text-foreground">{label}</Text>
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        style={{ backgroundColor: colors.background, borderColor: colors.border }}
        className="h-12 rounded-lg border px-3 text-base text-foreground"
        {...props}
      />
    </View>
  );
}
