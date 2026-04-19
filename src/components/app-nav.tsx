import Link from "next/link";
import { signOut } from "@/app/actions/auth";

export function AppNav() {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-zinc-900">
          Gym Notebook
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-zinc-600">
          <Link className="hover:text-zinc-900" href="/dashboard">
            Dashboard
          </Link>
          <Link className="hover:text-zinc-900" href="/progress">
            Progress
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
