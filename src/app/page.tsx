import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="w-full max-w-xl rounded-2xl bg-white/80 p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Workshop Tool
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          Placement Priorities Live
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-slate-700">
          Build your view of what should matter in student placements. Drag any
          factors into your priority list, order them from most to least
          important, and choose how strongly each should apply.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/builder"
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-accent/90"
          >
            Start
          </Link>
          <Link
            href="/results"
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            View Live Results
          </Link>
        </div>
      </div>
    </div>
  );
}

