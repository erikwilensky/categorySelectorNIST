 "use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ResultsTabs } from "@/components/results/results-tabs";
import { OverviewCards } from "@/components/results/overview-cards";
import { FactorSummaryTable } from "@/components/results/factor-summary-table";
import { ResponseExplorerTable } from "@/components/results/response-explorer-table";
import { CooccurrenceTable } from "@/components/results/cooccurrence-table";
import { ExportPanel } from "@/components/results/export-panel";
import { ResultsFilterBar } from "@/components/results/results-filter-bar";
import { QuerySummary } from "@/components/results/query-summary";
import { HonorableTable } from "@/components/results/honorable-table";

interface FactorAggregate {
  factorId: string;
  factorName: string;
  category: "core" | "secondary" | "blue_sky";
  selectionCount: number;
  averageRank: number | null;
  averageStrength: number | null;
  averagePoints: number;
  consensusLabel:
    | "Strong consensus"
    | "Moderate consensus"
    | "Mixed views"
    | "Polarizing"
    | "Low support";
}

export default function ResultsPage() {
  const [aggregates, setAggregates] = useState<FactorAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewMetrics, setOverviewMetrics] = useState<any | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [responsesError, setResponsesError] = useState<string | null>(null);
  const [coRows, setCoRows] = useState<any[]>([]);
  const [honorableRows, setHonorableRows] = useState<any[]>([]);
  const [minSelections, setMinSelections] = useState<number>(0);
  const [consensusFilter, setConsensusFilter] = useState<
    "all" | FactorAggregate["consensusLabel"]
  >("all");
  const [sortKey, setSortKey] = useState<
    "selectionCount" | "averageRank" | "averageStrength" | "averagePoints"
  >("selectionCount");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showHowToRead, setShowHowToRead] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "factors"
    | "responses"
    | "query"
    | "cooccurrence"
    | "honorable"
    | "exports"
  >("overview");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const params = new URLSearchParams();
        if (minSelections) params.set("minSelections", String(minSelections));
        if (consensusFilter !== "all") {
          params.set("consensus", consensusFilter);
        }
        if (search) params.set("search", search);
        params.set("sortKey", sortKey);
        params.set("sortDirection", sortDirection);
        const res = await fetch(
          `/api/results/factors?${params.toString()}`
        );
        if (!res.ok) throw new Error("Failed to load results");
        const json = (await res.json()) as { factors: FactorAggregate[] };
        if (!cancelled) {
          setAggregates(json.factors);
        }
      } catch {
        if (!cancelled) setAggregates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    const interval = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [minSelections, consensusFilter, sortKey, sortDirection, search]);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      try {
        const res = await fetch("/api/results/overview");
        if (!res.ok) throw new Error("Failed to load overview");
        const json = (await res.json()) as { overview: any };
        if (!cancelled) setOverviewMetrics(json.overview);
      } catch {
        if (!cancelled) setOverviewMetrics(null);
      } finally {
        if (!cancelled) setOverviewLoading(false);
      }
    }

    loadOverview();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadResponses() {
      try {
        const res = await fetch("/api/results/responses");
        const json = (await res.json()) as {
          responses: any[];
          error?: string;
          warning?: string;
        };
        if (!res.ok) {
          throw new Error(json.error ?? "Failed to load response data");
        }
        if (!cancelled) {
          setResponses(json.responses ?? []);
          setResponsesError(json.warning ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          setResponses([]);
          setResponsesError(
            error instanceof Error
              ? error.message
              : "Failed to load response data"
          );
        }
      }
    }

    async function loadCooccurrence() {
      try {
        const res = await fetch("/api/results/cooccurrence");
        if (!res.ok) throw new Error("Failed to load co-occurrence");
        const json = (await res.json()) as { rows: any[] };
        if (!cancelled) setCoRows(json.rows);
      } catch {
        if (!cancelled) setCoRows([]);
      }
    }

    async function loadHonorable() {
      try {
        const res = await fetch("/api/results/honorable");
        if (!res.ok) throw new Error("Failed to load honorable mentions");
        const json = (await res.json()) as { factors: any[] };
        if (!cancelled) setHonorableRows(json.factors ?? []);
      } catch {
        if (!cancelled) setHonorableRows([]);
      }
    }

    loadResponses();
    loadCooccurrence();
    loadHonorable();

    const interval = setInterval(() => {
      loadResponses();
      loadCooccurrence();
      loadHonorable();
    }, 8000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const mostSelected = [...aggregates]
    .sort((a, b) => b.selectionCount - a.selectionCount)
    .slice(0, 10);

  const highestPriority = [...aggregates]
    .filter((f) => f.averageRank != null)
    .sort((a, b) => (a.averageRank ?? 0) - (b.averageRank ?? 0))
    .slice(0, 10);

  const strongestApplied = [...aggregates]
    .filter((f) => f.averageStrength != null)
    .sort((a, b) => (b.averageStrength ?? 0) - (a.averageStrength ?? 0))
    .slice(0, 10);

  const topByScore = [...aggregates]
    .sort((a, b) => b.averagePoints - a.averagePoints)
    .slice(0, 10);

  const sortedForTable = [...aggregates].sort((a, b) => {
    const dir = sortDirection === "asc" ? 1 : -1;
    const getVal = (f: FactorAggregate) => {
      if (sortKey === "selectionCount") return f.selectionCount;
      if (sortKey === "averageRank") return f.averageRank ?? Number.POSITIVE_INFINITY;
      if (sortKey === "averageStrength") return f.averageStrength ?? 0;
      if (sortKey === "averagePoints") return f.averagePoints ?? 0;
      return 0;
    };
    const av = getVal(a);
    const bv = getVal(b);
    if (av === bv) return 0;
    return av > bv ? dir : -dir;
  });

  const totalStacks =
    aggregates.length === 0
      ? 0
      : Math.max(...aggregates.map((f) => f.selectionCount));

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-[#002855]">
          Aggregated class placement results
        </h2>
        <p className="text-sm text-[#333333]">
          See how participants as a group are weighting different placement
          factors — which ones are selected most often, how high they sit in
          stacks, how strongly they are applied, and how their points add up
          across all finalized responses.
        </p>
        <div className="mt-2 rounded-lg bg-[#F4F7FB] p-3 text-xs text-[#4F529B]">
          <button
            type="button"
            className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#002855] underline-offset-2 hover:underline"
            onClick={() => setShowHowToRead((v) => !v)}
          >
            {showHowToRead ? "Hide how to read this" : "Show how to read this"}
          </button>
          {showHowToRead ? (
            <div className="space-y-1">
              {activeTab === "overview" && (
                <>
                  <p>
                    Each chart and card is based on{" "}
                    <span className="font-semibold">finalized stacks</span>{" "}
                    only. Higher <span className="font-semibold">Selections</span>{" "}
                    means more people included that factor; higher{" "}
                    <span className="font-semibold">Avg. Strength</span> means it
                    was applied more strongly.
                  </p>
                  <p>
                    <span className="font-semibold">Avg. Rank</span> reflects
                    typical position in the stack (1 = very top), and{" "}
                    <span className="font-semibold">Avg. Points</span> combines
                    both rank and strength within the same points system used in
                    the builder.
                  </p>
                </>
              )}
              {activeTab === "factors" && (
                <>
                  <p>
                    This table shows one row per factor, using the same metrics
                    as the overview. Filters and sorting above control which
                    factors appear and how they are ordered.
                  </p>
                  <p>
                    Use <span className="font-semibold">Min. selections</span>,
                    <span className="font-semibold"> consensus</span>, and{" "}
                    <span className="font-semibold">search</span> to focus on
                    factors that matter for your discussion.
                  </p>
                </>
              )}
              {activeTab === "responses" && (
                <>
                  <p>
                    Each row represents one anonymous finalized stack. Points and
                    averages are computed with the same scoring model participants
                    see in the builder.
                  </p>
                  <p>
                    Use this view to understand typical stack length, total
                    points used, and which factors most often sit at the top.
                  </p>
                </>
              )}
              {activeTab === "cooccurrence" && (
                <>
                  <p>
                    Co-occurrence shows how often two factors appear in the same
                    stack. <span className="font-semibold">Co-selected %</span>{" "}
                    is out of all stacks, while{" "}
                    <span className="font-semibold">Conditional % (B | A)</span>{" "}
                    is out of stacks that include factor A.
                  </p>
                  <p>
                    Use this to spot combinations that tend to travel together or
                    rarely co-occur.
                  </p>
                </>
              )}
              {activeTab === "honorable" && (
                <>
                  <p>
                    This view shows how often each factor is added as an{" "}
                    <span className="font-semibold">Honorable mention</span>.
                    These selections are zero-points and do not affect scores,
                    but they highlight factors people care about beyond the
                    main stack.
                  </p>
                </>
              )}
              {activeTab === "exports" && (
                <>
                  <p>
                    Exports give you CSV files that can be opened in spreadsheets
                    or BI tools. Each file uses human-readable headers and the
                    same metrics shown in this console.
                  </p>
                </>
              )}
            </div>
          ) : null}
        </div>
      </header>
      <ResultsTabs activeTab={activeTab} onChange={setActiveTab} />
      <ResultsFilterBar search={search} onSearchChange={setSearch} />
      <QuerySummary
        text={
          aggregates.length
            ? `Showing ${aggregates.length} factors after filters.`
            : ""
        }
      />

      {activeTab === "overview" && (
        <>
          <OverviewCards metrics={overviewMetrics} loading={overviewLoading} />
          <section className="mt-4 rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-[#4F529B]/60">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-[#4F529B]">
                Min. selections
              </label>
              <select
                value={minSelections}
                onChange={(e) => setMinSelections(Number(e.target.value))}
                className="h-8 rounded-md border border-[#4F529B]/60 bg-white px-2 text-xs text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#FF8F1C]"
              >
                <option value={0}>All factors</option>
                <option value={3}>3+ selections</option>
                <option value={5}>5+ selections</option>
                <option value={10}>10+ selections</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-[#4F529B]">
                Consensus
              </label>
              <select
                value={consensusFilter}
                onChange={(e) =>
                  setConsensusFilter(e.target.value as typeof consensusFilter)
                }
                className="h-8 rounded-md border border-[#4F529B]/60 bg-white px-2 text-xs text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#FF8F1C]"
              >
                <option value="all">All levels</option>
                <option value="Strong consensus">Strong consensus only</option>
                <option value="Moderate consensus">Moderate consensus only</option>
                <option value="Mixed views">Mixed views only</option>
                <option value="Polarizing">Polarizing only</option>
                <option value="Low support">Low support only</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-[#4F529B]">
                Table sort by
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={sortKey}
                  onChange={(e) =>
                    setSortKey(e.target.value as typeof sortKey)
                  }
                  className="h-8 rounded-md border border-[#4F529B]/60 bg-white px-2 text-xs text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#FF8F1C]"
                >
                  <option value="selectionCount">Selections</option>
                  <option value="averageRank">Avg. Rank</option>
                  <option value="averageStrength">Avg. Strength</option>
                  <option value="averagePoints">Avg. Points</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
                  }
                  className="inline-flex h-8 items-center rounded-md border border-[#4F529B]/60 px-2 text-[11px] font-medium text-[#4F529B] hover:border-[#002855] hover:text-[#002855]"
                >
                  {sortDirection === "asc" ? "Asc" : "Desc"}
                </button>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-[#4F529B]">
            {totalStacks > 0 ? (
              <span>
                Up to{" "}
                <span className="font-semibold">{totalStacks}</span> finalized
                stacks contributing per factor.
              </span>
            ) : (
              <span>Waiting for finalized stacks.</span>
            )}
          </div>
        </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl bg-white/90 p-4 shadow-sm ring-2 ring-[#002855]">
          <h3 className="text-sm font-semibold text-[#002855]">
            Most Selected Factors
          </h3>
          <p className="mb-3 text-xs text-[#4F529B]">
            Factors ranked by how often they appear in finalized stacks across
            all participants.
          </p>
          <div className="h-64">
            {loading ? (
              <p className="text-xs text-[#4F529B]">Loading…</p>
            ) : mostSelected.length === 0 ? (
              <p className="text-xs text-[#4F529B]">
                Results will appear as participants finalize.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mostSelected}
                  margin={{ top: 4, right: 8, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="factorName"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={60}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="selectionCount" fill="#1d4ed8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white/90 p-4 shadow-sm ring-2 ring-[#002855]">
          <h3 className="text-sm font-semibold text-[#002855]">
            Strongest Applied Factors
          </h3>
          <p className="mb-3 text-xs text-[#4F529B]">
            Factors ordered by average strength value across all finalized
            stacks.
          </p>
          <div className="h-64">
            {loading ? (
              <p className="text-xs text-[#4F529B]">Loading…</p>
            ) : strongestApplied.length === 0 ? (
              <p className="text-xs text-[#4F529B]">
                Results will appear as participants finalize.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={strongestApplied}
                  margin={{ top: 4, right: 8, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="factorName"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={60}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="averageStrength" fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
          </div>

          <section className="rounded-2xl bg-white/90 p-4 shadow-sm ring-2 ring-[#002855]">
        <h3 className="text-sm font-semibold text-[#002855]">
          Top Factors by Average Points
        </h3>
        <p className="mb-3 text-xs text-[#4F529B]">
          Combines how high factors sit in stacks and how strongly they are
          applied to create an overall points score per factor.
        </p>
        <div className="h-64">
          {loading ? (
            <p className="text-xs text-[#4F529B]">Loading…</p>
          ) : topByScore.length === 0 ? (
            <p className="text-xs text-[#4F529B]">
              Results will appear as participants finalize.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topByScore}
                margin={{ top: 4, right: 8, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="factorName"
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  height={60}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="averagePoints" fill="#7c3aed" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
          </section>
        </>
      )}

      {activeTab === "factors" && (
        <section className="rounded-2xl bg-white/90 p-4 shadow-sm ring-2 ring-[#002855]">
          <h3 className="text-sm font-semibold text-[#002855]">
            Factor analysis
          </h3>
          <p className="mb-3 text-xs text-[#4F529B]">
            Detailed view of factor metrics with the same filters and sorting
            applied as above.
          </p>
          <div className="mb-3 flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-[#4F529B]">
                Min. selections
              </label>
              <select
                value={minSelections}
                onChange={(e) => setMinSelections(Number(e.target.value))}
                className="h-8 rounded-md border border-[#4F529B]/60 bg-white px-2 text-xs text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#FF8F1C]"
              >
                <option value={0}>All factors</option>
                <option value={3}>3+ selections</option>
                <option value={5}>5+ selections</option>
                <option value={10}>10+ selections</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-[#4F529B]">
                Consensus
              </label>
              <select
                value={consensusFilter}
                onChange={(e) =>
                  setConsensusFilter(e.target.value as typeof consensusFilter)
                }
                className="h-8 rounded-md border border-[#4F529B]/60 bg-white px-2 text-xs text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#FF8F1C]"
              >
                <option value="all">All levels</option>
                <option value="Strong consensus">Strong consensus only</option>
                <option value="Moderate consensus">Moderate consensus only</option>
                <option value="Mixed views">Mixed views only</option>
                <option value="Polarizing">Polarizing only</option>
                <option value="Low support">Low support only</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-[#4F529B]">
                Table sort by
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={sortKey}
                  onChange={(e) =>
                    setSortKey(e.target.value as typeof sortKey)
                  }
                  className="h-8 rounded-md border border-[#4F529B]/60 bg-white px-2 text-xs text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#FF8F1C]"
                >
                  <option value="selectionCount">Selections</option>
                  <option value="averageRank">Avg. Rank</option>
                  <option value="averageStrength">Avg. Strength</option>
                  <option value="averagePoints">Avg. Points</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
                  }
                  className="inline-flex h-8 items-center rounded-md border border-[#4F529B]/60 px-2 text-[11px] font-medium text-[#4F529B] hover:border-[#002855] hover:text-[#002855]"
                >
                  {sortDirection === "asc" ? "Asc" : "Desc"}
                </button>
              </div>
            </div>
          </div>
          <FactorSummaryTable rows={sortedForTable} />
        </section>
      )}

      {activeTab === "responses" && (
        <section className="rounded-2xl bg-white/90 p-4 shadow-sm ring-2 ring-[#002855]">
          <h3 className="text-sm font-semibold text-[#002855]">
            Response explorer
          </h3>
          <p className="mb-3 text-xs text-[#4F529B]">
            Anonymous view of each finalized stack, including number of
            factors, top factors, and total points used.
          </p>
          {responsesError ? (
            <p className="mb-2 text-xs font-medium text-[#E73C3E]">
              {responsesError}
            </p>
          ) : null}
          <ResponseExplorerTable rows={responses} />
        </section>
      )}

      {activeTab === "cooccurrence" && (
        <section className="rounded-2xl bg-white/90 p-4 shadow-sm ring-2 ring-[#002855]">
          <h3 className="text-sm font-semibold text-[#002855]">
            Co-occurrence
          </h3>
          <p className="mb-3 text-xs text-[#4F529B]">
            See which factors tend to appear together within the same stacks.
          </p>
          <CooccurrenceTable rows={coRows} />
        </section>
      )}

      {activeTab === "honorable" && (
        <section className="rounded-2xl bg-white/90 p-4 shadow-sm ring-2 ring-[#002855]">
          <h3 className="text-sm font-semibold text-[#002855]">
            Honorable mentions
          </h3>
          <p className="mb-3 text-xs text-[#4F529B]">
            Factors that participants added to the Honorable mentions list
            without spending points. These do not affect scoring but show which
            ideas people still want visible.
          </p>
          <HonorableTable rows={honorableRows} />
        </section>
      )}

      {activeTab === "exports" && <ExportPanel />}
    </div>
  );
}

