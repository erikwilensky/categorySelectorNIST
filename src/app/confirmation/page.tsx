import Link from "next/link";

export default function ConfirmationPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white/90 p-8 text-center shadow-sm ring-2 ring-[#002855]">
        <h2 className="text-xl font-semibold tracking-tight text-[#002855]">
          Your stack has been recorded
        </h2>
        <p className="mt-3 text-sm text-[#333333]">
          Your response is anonymous and has been added to the aggregated
          results that summarize how this group is weighting different
          placement factors.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/results"
            className="inline-flex items-center justify-center rounded-lg bg-[#002855] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#FF8F1C]"
          >
            View aggregated results
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-[#002855] px-4 py-2.5 text-sm font-medium text-[#002855] transition hover:bg-[#002855] hover:text-white"
          >
            Back to Start
          </Link>
        </div>
      </div>
    </div>
  );
}

