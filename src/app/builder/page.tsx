/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { useEffect, useMemo, useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { seedFactors, type FactorCategory } from "@/lib/factors";
import { getOrCreateAnonymousToken } from "@/lib/anonymousSession";
import Link from "next/link";

type StrengthValue = 1 | 2 | 3 | 4 | 5;

interface FactorOption {
  id: string;
  name: string;
  category: FactorCategory;
}

interface PriorityItem {
  factorId: string;
  factorName: string;
  strength?: StrengthValue;
}

const STORAGE_KEY = "placement-priorities-live-builder-draft";
const POINTS_CAP = 1000;

function computeFactorScore(positionIndex: number, strength?: StrengthValue) {
  if (!strength) return 0;
  const positionWeight = Math.max(1, 8 - positionIndex);
  const strengthWeights: Record<StrengthValue, number> = {
    1: 1,
    2: 3,
    3: 6,
    4: 10,
    5: 15
  };
  const strengthWeight = strengthWeights[strength];
  return 3 * positionWeight * strengthWeight;
}

function computeTotalScore(items: PriorityItem[]) {
  return items.reduce((total, item, index) => {
    return total + computeFactorScore(index + 1, item.strength);
  }, 0);
}

export default function BuilderPage() {
  const [factorOptions, setFactorOptions] = useState<FactorOption[]>([]);
  const [priorityItems, setPriorityItems] = useState<PriorityItem[]>([]);
  const [honorableItems, setHonorableItems] = useState<PriorityItem[]>([]);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const totalScore = useMemo(
    () => computeTotalScore(priorityItems),
    [priorityItems]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Backwards compatibility: previous versions stored only the stack array.
        if (Array.isArray(parsed)) {
          setPriorityItems(parsed as PriorityItem[]);
        } else if (parsed && typeof parsed === "object") {
          const maybeStack = (parsed as any).stack as PriorityItem[] | undefined;
          const maybeHonorable = (parsed as any).honorable as
            | PriorityItem[]
            | undefined;
          if (maybeStack) setPriorityItems(maybeStack);
          if (maybeHonorable) setHonorableItems(maybeHonorable);
        }
      } catch {
        // ignore bad data
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const draft = {
      stack: priorityItems,
      honorable: honorableItems
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [priorityItems, honorableItems]);

  const anonymousToken = useMemo(
    () => (typeof window === "undefined" ? "" : getOrCreateAnonymousToken()),
    []
  );

  useEffect(() => {
    async function loadFactors() {
      try {
        const res = await fetch("/api/factors");
        if (!res.ok) {
          throw new Error("Failed to fetch factors");
        }
        const json = (await res.json()) as { factors: FactorOption[] };
        setFactorOptions(json.factors);
      } catch {
        // Fallback to local seed list if API fails (e.g. before Supabase is wired)
        setFactorOptions(
          seedFactors.map((f, index) => ({
            id: String(index),
            name: f.name,
            category: f.category
          }))
        );
      }
    }
    loadFactors();
  }, []);

  const availableFactors = useMemo(() => {
    const inStack = new Set(priorityItems.map((p) => p.factorId));
    const inHonorable = new Set(honorableItems.map((p) => p.factorId));
    return factorOptions.filter(
      (f) => !inStack.has(f.id) && !inHonorable.has(f.id)
    );
  }, [factorOptions, priorityItems, honorableItems]);

  const filteredAvailable = useMemo(() => {
    if (!search.trim()) return availableFactors;
    const q = search.toLowerCase();
    return availableFactors.filter((f) => f.name.toLowerCase().includes(q));
  }, [availableFactors, search]);

  function handleAddFactor(factor: FactorOption) {
    if (priorityItems.some((p) => p.factorId === factor.id)) return;
    setPriorityItems((prev) => [
      ...prev,
      { factorId: factor.id, factorName: factor.name }
    ]);
  }

  function handleAddHonorable(factor: FactorOption) {
    if (
      priorityItems.some((p) => p.factorId === factor.id) ||
      honorableItems.some((p) => p.factorId === factor.id)
    ) {
      return;
    }
    setHonorableItems((prev) => [
      ...prev,
      { factorId: factor.id, factorName: factor.name }
    ]);
  }

  function handleRemoveFactor(id: string) {
    setPriorityItems((prev) => prev.filter((p) => p.factorId !== id));
  }

  function handleRemoveHonorable(id: string) {
    setHonorableItems((prev) => prev.filter((p) => p.factorId !== id));
  }

  function handleMoveHonorableToStack(id: string) {
    const item = honorableItems.find((h) => h.factorId === id);
    if (!item) return;
    setHonorableItems((prev) => prev.filter((p) => p.factorId !== id));
    setPriorityItems((prev) => [...prev, { ...item, strength: undefined }]);
  }

  function handleMoveStackToHonorable(id: string) {
    const item = priorityItems.find((p) => p.factorId === id);
    if (!item) return;
    setPriorityItems((prev) => prev.filter((p) => p.factorId !== id));
    setHonorableItems((prev) => [
      ...prev,
      { factorId: item.factorId, factorName: item.factorName }
    ]);
  }

  function handleChangeStrength(id: string, value: StrengthValue) {
    setPriorityItems((prev) =>
      prev.map((item) =>
        item.factorId === id ? { ...item, strength: value } : item
      )
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = priorityItems.findIndex((p) => p.factorId === active.id);
    const newIndex = priorityItems.findIndex((p) => p.factorId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setPriorityItems((items) => arrayMove(items, oldIndex, newIndex));
  }

  function handleReset() {
    setPriorityItems([]);
    setHonorableItems([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  async function handleFinalize() {
    setError(null);
    if (priorityItems.length === 0) {
      setError("Add at least one factor before finalizing.");
      return;
    }
    const missingStrength = priorityItems.find((p) => p.strength == null);
    if (missingStrength) {
      setError("Set a strength for every selected factor.");
      return;
    }

    const currentTotal = computeTotalScore(priorityItems);
    if (currentTotal > POINTS_CAP) {
      setError(
        "You’re over the 1000-point limit. Remove a factor or lower some strengths."
      );
      return;
    }

    setSubmitting(true);
    try {
      const itemsWithIds = priorityItems.map((item, index) => ({
        factorId: item.factorId,
        stackPosition: index + 1,
        strengthValue: item.strength as number
      }));

      await fetch("/api/submit-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousToken,
          items: itemsWithIds
        })
      });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
        window.location.href = "/confirmation";
      }
    } catch (e) {
      console.error(e);
      setError("Something went wrong while submitting. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-tight">
          Build your placement priorities
        </h2>
        <p className="text-sm text-slate-600">
          Drag any factors you think should matter. Order them by importance,
          choose how strongly each should apply, and stay within your points
          budget.
        </p>
      </div>

      <div className="grid flex-1 gap-6 md:grid-cols-2">
        <section className="flex flex-col rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Possible Placement Factors
              </h3>
              <p className="text-xs text-slate-500">
                Browse and drag any factors you want into your stack.
              </p>
            </div>
          </div>
          <input
            className="mb-3 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Search factors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex-1 space-y-4 overflow-y-auto pr-1 text-sm">
              <FactorGroup
              title="Core Factors"
              items={filteredAvailable.filter((f) => f.category === "core")}
              onAdd={handleAddFactor}
              onAddHonorable={handleAddHonorable}
            />
            <FactorGroup
              title="Secondary Factors"
              items={filteredAvailable.filter((f) => f.category === "secondary")}
              onAdd={handleAddFactor}
              onAddHonorable={handleAddHonorable}
            />
            <FactorGroup
              title="Blue Sky Factors"
              items={filteredAvailable.filter((f) => f.category === "blue_sky")}
              onAdd={handleAddFactor}
              onAddHonorable={handleAddHonorable}
            />
          </div>
        </section>

        <section className="flex flex-col rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Your Placement Priorities
              </h3>
              <p className="text-xs text-slate-500">
                Top = most important. Bottom = least important of your
                selections.
              </p>
              <p
                className={
                  "mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] " +
                  (totalScore > POINTS_CAP
                    ? "bg-red-50 font-semibold text-red-700 ring-1 ring-red-200"
                    : "bg-slate-50 text-slate-600 ring-1 ring-slate-200")
                }
              >
                <span className="font-medium">Points used</span>
                <span className="tabular-nums">
                  {totalScore} / {POINTS_CAP}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-medium text-slate-600 underline-offset-2 hover:underline"
            >
              Reset
            </button>
          </div>

          <DndContext onDragEnd={handleDragEnd}>
            <SortableContext
              items={priorityItems.map((p) => p.factorId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1">
                {priorityItems.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                    Drag factors here to build your stack.
                  </div>
                ) : (
                  priorityItems.map((item, index) => (
                    <SortablePriorityRow
                      key={item.factorId}
                      index={index}
                      item={item}
                      onRemove={handleRemoveFactor}
                      onMoveToHonorable={handleMoveStackToHonorable}
                      onChangeStrength={handleChangeStrength}
                    />
                  ))
                )}
                <div className="mt-2 flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={handleFinalize}
                    disabled={submitting}
                    className="inline-flex flex-1 items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Finalizing..." : "Finalize my stack"}
                  </button>
                  <Link
                    href="/"
                    className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                  >
                    Back to Start
                  </Link>
                </div>
              </div>
            </SortableContext>
          </DndContext>

          {error ? (
            <p className="mt-3 text-xs font-medium text-red-600">{error}</p>
          ) : null}
        </section>

        <section className="flex flex-col rounded-2xl bg-white/60 p-4 text-xs shadow-sm ring-1 ring-dashed ring-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">
            Blue Sky (no points)
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Drop factors here that you like but don&apos;t want to spend points
            on. They won&apos;t count toward your 1000-point budget.
          </p>
          <div className="mt-3 space-y-1.5 overflow-y-auto pr-1">
            {honorableItems.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                You can move items here from your stack or add them directly
                from the factor list.
              </p>
            ) : (
              honorableItems.map((item) => (
                <div
                  key={item.factorId}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-1.5"
                >
                  <span className="mr-2 text-xs text-slate-800">
                    {item.factorName}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleMoveHonorableToStack(item.factorId)}
                      className="text-[10px] font-medium text-accent hover:underline"
                    >
                      Move to stack
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveHonorable(item.factorId)}
                      className="text-[10px] font-medium text-slate-500 hover:text-slate-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

interface FactorGroupProps {
  title: string;
  items: FactorOption[];
  onAdd: (factor: FactorOption) => void;
  onAddHonorable: (factor: FactorOption) => void;
}

function FactorGroup({ title, items, onAdd, onAddHonorable }: FactorGroupProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h4>
      <div className="mt-2 space-y-1.5">
        {items.map((factor) => (
          <div
            key={factor.id}
            role="button"
            tabIndex={0}
            onClick={() => onAdd(factor)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onAdd(factor);
              }
            }}
            className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-800 outline-none transition hover:border-accent hover:bg-accent-soft focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span>{factor.name}</span>
            <span className="flex gap-2">
              <span className="text-[10px] font-medium text-accent">
                Add to stack
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddHonorable(factor);
                }}
                className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:border-accent hover:text-accent"
              >
                Send to Blue Sky
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PriorityRowProps {
  index: number;
  item: PriorityItem;
  onRemove: (id: string) => void;
  onMoveToHonorable: (id: string) => void;
  onChangeStrength: (id: string, value: StrengthValue) => void;
}

function SortablePriorityRow(props: PriorityRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.item.factorId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div ref={setNodeRef} style={style}>
      <PriorityRow
        {...props}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function PriorityRow({
  index,
  item,
  onRemove,
  onMoveToHonorable,
  onChangeStrength,
  dragHandleProps
}: PriorityRowProps & {
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const strengths: { label: string; value: StrengthValue }[] = [
    { value: 1, label: "Nice to have" },
    { value: 2, label: "Should influence" },
    { value: 3, label: "Strong priority" },
    { value: 4, label: "Very strong priority" },
    { value: 5, label: "Must be honored" }
  ];

  const score = computeFactorScore(index + 1, item.strength);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div
        className="mt-1 cursor-grab text-xs font-semibold text-slate-500"
        {...dragHandleProps}
      >
        {index + 1}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <p className="text-xs font-medium text-slate-900">
              {item.factorName}
            </p>
            {score > 0 ? (
              <p className="text-[10px] text-slate-500">
                Score: {score} points
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.factorId)}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
          >
            Remove
          </button>
          <button
            type="button"
            onClick={() => onMoveToHonorable(item.factorId)}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
          >
            Send to Blue Sky
          </button>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-1.5 text-[11px] sm:grid-cols-5">
          {strengths.map((s) => {
            const active = item.strength === s.value;
            const baseColor =
              s.value === 1
                ? "border-slate-200 bg-slate-50 text-slate-700"
                : s.value === 2
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : s.value === 3
                ? "border-sky-200 bg-sky-50 text-sky-800"
                : s.value === 4
                ? "border-indigo-200 bg-indigo-50 text-indigo-800"
                : "border-rose-200 bg-rose-50 text-rose-800";
            const activeColor =
              s.value === 1
                ? "border-slate-500 bg-slate-600 text-white"
                : s.value === 2
                ? "border-emerald-600 bg-emerald-600 text-white"
                : s.value === 3
                ? "border-sky-600 bg-sky-600 text-white"
                : s.value === 4
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-rose-600 bg-rose-600 text-white";
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => onChangeStrength(item.factorId, s.value)}
                className={
                  "rounded-md border px-2 py-1 text-left transition " +
                  (active
                    ? activeColor
                    : baseColor + " hover:border-accent hover:bg-accent-soft")
                }
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

