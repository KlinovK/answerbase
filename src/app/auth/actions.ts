"use server";

import type { AuthError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/lib/supabase/server";

type AuthActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

type Credentials = {
  email: string;
  password: string;
};

function readCredentials(
  formData: FormData,
  minimumPasswordLength?: number,
): Credentials | AuthActionState {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");

  if (typeof emailValue !== "string" || typeof passwordValue !== "string") {
    return {
      status: "error",
      message: "Email and password are required.",
    };
  }

  const email = emailValue.trim();

  if (!email || !passwordValue) {
    return {
      status: "error",
      message: "Email and password are required.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      status: "error",
      message: "Enter a valid email address.",
    };
  }

  if (minimumPasswordLength && passwordValue.length < minimumPasswordLength) {
    return {
      status: "error",
      message: `Password must be at least ${minimumPasswordLength} characters.`,
    };
  }

  return { email, password: passwordValue };
}

function getAuthErrorMessage(error: AuthError) {
  switch (error.code) {
    case "invalid_credentials":
      return "Email or password is incorrect.";
    case "email_not_confirmed":
      return "Confirm your email before logging in.";
    case "user_already_exists":
      return "An account with this email already exists.";
    case "signup_disabled":
      return "Account creation is currently unavailable.";
    case "over_email_send_rate_limit":
      return "Too many confirmation emails were requested. Try again later.";
    case "weak_password":
      return "Choose a stronger password and try again.";
    default:
      return "We could not complete that request. Try again.";
  }
}

export async function login(
  previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void previousState;

  const credentials = readCredentials(formData);

  if ("status" in credentials) {
    return credentials;
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword(credentials);

    if (error) {
      return { status: "error", message: getAuthErrorMessage(error) };
    }
  } catch {
    return {
      status: "error",
      message: "Unable to reach the authentication service. Try again.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(
  previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (previousState.status === "success") {
    return previousState;
  }

  const credentials = readCredentials(formData, 8);

  if ("status" in credentials) {
    return credentials;
  }

  let origin: string;

  try {
    origin = await getRequestOrigin();
  } catch {
    return {
      status: "error",
      message: "Unable to determine the application URL. Refresh and try again.",
    };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.signUp({
      ...credentials,
      options: {
        emailRedirectTo: new URL("/auth/callback", origin).toString(),
      },
    });

    if (error) {
      return { status: "error", message: getAuthErrorMessage(error) };
    }

    if (!data.session) {
      return {
        status: "success",
        message: "Check your email to confirm your account.",
      };
    }
  } catch {
    return {
      status: "error",
      message: "Unable to reach the authentication service. Try again.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
