import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="w-full max-w-xl rounded-2xl bg-white/90 p-8 shadow-sm ring-2 ring-[#002855]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4F529B]">
          NIST Class Placement
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#002855]">
          Class Placement Factors
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-[#333333]">
          Decide which factors should guide class placements at NIST.
          Drag factors into your stack, order them from most to least
          important, and choose how strongly each one should apply. You have a
          limited points budget, and once you finalize, your anonymous stack
          will be combined with others to give an aggregated view of which
          factors this group believes should be considered.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/builder"
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-[#002855] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#FF8F1C]"
          >
            Start my stack
          </Link>
          <Link
            href="/results"
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-[#002855] px-4 py-2.5 text-sm font-medium text-[#002855] transition hover:bg-[#002855] hover:text-white"
          >
            View aggregated results
          </Link>
        </div>
      </div>
    </div>
  );
}

