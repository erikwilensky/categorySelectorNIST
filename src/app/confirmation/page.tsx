import Link from "next/link";

export default function ConfirmationPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white/80 p-8 text-center shadow-sm ring-1 ring-slate-200">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Your priorities have been recorded
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          Your response is anonymous and has been added to the live workshop
          results.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/results"
            className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-accent/90"
          >
            View Live Results
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            Back to Start
          </Link>
        </div>
      </div>
    </div>
  );
}

