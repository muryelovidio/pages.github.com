"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

const initialState: AuthState = {};

export default function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="w-full max-w-sm">
      <div className="card p-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-accent" />
          <span className="text-lg font-semibold">Financeiro</span>
        </div>

        <h1 className="text-xl font-semibold text-foreground">
          {mode === "signin" ? "Entrar" : "Criar conta"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {mode === "signin"
            ? "Acesse seus dados financeiros."
            : "Uso pessoal — crie sua conta única."}
        </p>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">E-mail</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Senha</span>
            <input
              type="password"
              name="password"
              required
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>

          {state.error && (
            <p className="text-sm text-negative">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity disabled:opacity-60"
          >
            {pending ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
        >
          {mode === "signin"
            ? "Ainda não tem conta? Criar conta"
            : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}
