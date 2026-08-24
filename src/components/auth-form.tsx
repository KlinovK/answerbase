"use client";

import Link from "next/link";
import { useActionState } from "react";

import { login, signup } from "@/app/auth/actions";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFormProps = {
  mode: "login" | "signup";
  initialError?: string;
};

type AuthActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

const initialState: AuthActionState = {
  status: "idle",
  message: "",
};

export function AuthForm({ mode, initialError }: AuthFormProps) {
  const isLogin = mode === "login";
  const [state, formAction, pending] = useActionState(
    isLogin ? login : signup,
    initialError
      ? { status: "error" as const, message: initialError }
      : initialState,
  );

  return (
    <Card className="w-full max-w-md shadow-none">
      <CardHeader className="gap-2 px-6 pt-6">
        <CardTitle className="text-xl">
          {isLogin ? "Log in to Answerbase" : "Create your account"}
        </CardTitle>
        <CardDescription>
          {isLogin
            ? "Enter your details to continue."
            : "Start building your AI support chatbot."}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {state.status === "success" ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-lg border bg-muted/50 p-4 text-sm leading-6"
          >
            {state.message}
          </div>
        ) : (
          <>
            <form action={formAction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor={`${mode}-email`}>Email</Label>
                <Input
                  id={`${mode}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  required
                  disabled={pending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${mode}-password`}>Password</Label>
                <Input
                  id={`${mode}-password`}
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  minLength={isLogin ? undefined : 8}
                  aria-describedby={isLogin ? undefined : `${mode}-password-hint`}
                  required
                  disabled={pending}
                />
                {!isLogin && (
                  <p
                    id={`${mode}-password-hint`}
                    className="text-xs text-muted-foreground"
                  >
                    Use at least 8 characters.
                  </p>
                )}
              </div>
              {state.status === "error" && (
                <p
                  role="alert"
                  aria-live="polite"
                  className="text-sm text-destructive"
                >
                  {state.message}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={pending}
              >
                {pending
                  ? isLogin
                    ? "Logging in..."
                    : "Creating account..."
                  : isLogin
                    ? "Log in"
                    : "Create account"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? "New to Answerbase?" : "Already have an account?"}{" "}
              <Link
                href={isLogin ? "/signup" : "/login"}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {isLogin ? "Sign up" : "Log in"}
              </Link>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
