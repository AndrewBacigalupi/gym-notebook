import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/"><span className="text-lg font-semibold text-zinc-900">Gym Notebook</span></a>
          <div className="flex gap-3 text-sm font-medium">
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-zinc-700 hover:bg-zinc-100"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-800"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-4 py-20 sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          A gym notebook that works for you.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600">
          Log every set, track personal records, and review your history to see your progression
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Log In
          </Link>
        </div>

        
      </main>
    </div>
  );
}
