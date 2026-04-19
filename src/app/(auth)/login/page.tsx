import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
