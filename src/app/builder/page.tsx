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
  category?: FactorCategory;
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
      { factorId: factor.id, factorName: factor.name, category: factor.category }
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
      {
        factorId: factor.id,
        factorName: factor.name,
        category: factor.category
      }
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
    setPriorityItems((prev) => [
      ...prev,
      {
        factorId: item.factorId,
        factorName: item.factorName,
        category: item.category,
        strength: undefined
      }
    ]);
  }

  function handleMoveStackToHonorable(id: string) {
    const item = priorityItems.find((p) => p.factorId === id);
    if (!item) return;
    setPriorityItems((prev) => prev.filter((p) => p.factorId !== id));
    setHonorableItems((prev) => [
      ...prev,
      {
        factorId: item.factorId,
        factorName: item.factorName,
        category: item.category
      }
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
      const honorableFactorIds = honorableItems.map((item) => item.factorId);

      await fetch("/api/submit-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousToken,
          items: itemsWithIds,
          honorableFactorIds
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
        <h2 className="text-lg font-semibold tracking-tight text-[#002855]">
          Build your class placement stack
        </h2>
        <p className="text-sm text-[#333333]">
          Drag any factors you believe should guide class placements. Order
          them by importance, choose how strongly each should apply, and stay
          within the points budget so your stack can be included in the
          aggregated results that will inform which factors are considered.
        </p>
      </div>

      <div className="grid flex-1 gap-6 md:grid-cols-2">
        <section className="flex flex-col rounded-2xl bg-white/90 p-4 shadow-sm ring-2 ring-[#002855]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#002855]">
                Possible Placement Factors
              </h3>
              <p className="text-xs text-[#4F529B]">
                Browse and drag any factors you want into your stack.
              </p>
            </div>
          </div>
          <input
            className="mb-3 w-full rounded-md border border-[#4F529B] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8F1C]"
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

        <section className="flex flex-col rounded-2xl bg-white/90 p-4 shadow-sm ring-2 ring-[#002855]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#002855]">
                Your Placement Priorities
              </h3>
              <p className="text-xs text-[#4F529B]">
                Top = most important. Bottom = least important of your
                selections.
              </p>
              <p
                className={
                  "mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] " +
                  (totalScore > POINTS_CAP
                    ? "bg-red-50 font-semibold text-red-700 ring-1 ring-red-200"
                    : "bg-[#F4F7FB] text-[#4F529B] ring-1 ring-[#4F529B]/40")
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
              className="text-xs font-medium text-[#4F529B] underline-offset-2 hover:underline"
            >
              Reset
            </button>
          </div>

          <DndContext onDragEnd={handleDragEnd}>
            <SortableContext
              items={priorityItems.map((p) => p.factorId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
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
                    className="inline-flex flex-1 items-center justify-center rounded-lg bg-[#002855] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#FF8F1C] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Finalizing..." : "Finalize my stack"}
                  </button>
                  <Link
                    href="/"
                    className="inline-flex flex-1 items-center justify-center rounded-lg border border-[#002855] px-4 py-2.5 text-sm font-medium text-[#002855] transition hover:bg-[#002855] hover:text-white"
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

        <section className="flex flex-col rounded-2xl bg-white/70 p-4 text-xs shadow-sm ring-1 ring-dashed ring-[#4F529B]">
          <h3 className="text-sm font-semibold text-[#002855]">
            Honorable mentions (no points)
          </h3>
          <p className="mt-1 text-xs text-[#4F529B]">
            Drop factors here that you like but don&apos;t want to spend points
            on. They won&apos;t count toward your 1000-point budget.
          </p>
          <div className="mt-3 space-y-1.5 overflow-y-auto pr-1">
            {honorableItems.length === 0 ? (
              <p className="text-[11px] text-[#4F529B]">
                You can move items here from your stack or add them directly
                from the factor list.
              </p>
            ) : (
              honorableItems.map((item) => (
                <div
                  key={item.factorId}
                  className="flex items-center justify-between rounded-md border border-[#4F529B]/60 bg-white px-3 py-1.5"
                >
                  <span className="mr-2 text-xs text-[#333333]">
                    {item.factorName}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleMoveHonorableToStack(item.factorId)}
                      className="text-[10px] font-medium text-[#002855] hover:underline"
                    >
                      Move to stack
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveHonorable(item.factorId)}
                      className="text-[10px] font-medium text-[#4F529B] hover:text-[#002855]"
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

  const borderBgClass =
    title === "Core Factors"
      ? "border-[#002855]/50 bg-[#F4F7FB]"
      : title === "Secondary Factors"
      ? "border-[#4F529B]/40 bg-[#F4F7FB]"
      : "border-[#78D5E1]/40 bg-[#E7F6F9]";
  const pillClass =
    title === "Core Factors"
      ? "bg-[#002855]"
      : title === "Secondary Factors"
      ? "bg-[#4F529B]"
      : "bg-[#78D5E1]";

  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#002855]">
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
            className={
              "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs text-[#333333] outline-none transition hover:border-[#002855] hover:bg-[#F4F7FB] focus-visible:ring-2 focus-visible:ring-[#FF8F1C] " +
              borderBgClass
            }
          >
            <span>{factor.name}</span>
            <span className="flex gap-2">
              <span
                className={
                  "inline-flex h-8 items-center rounded-full px-3 text-[10px] font-semibold text-white whitespace-nowrap " +
                  pillClass
                }
              >
                Add to stack
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddHonorable(factor);
                }}
                className="inline-flex h-8 items-center rounded-full border border-[#4F529B]/60 px-3 text-[10px] font-medium text-[#4F529B] whitespace-nowrap hover:border-[#002855] hover:text-[#002855]"
              >
                Honorable mention
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
  const widthPercent = Math.max(60, 100 - index * 4);
  const stackBorderBgClass =
    item.category === "core"
      ? "border-[#002855]/60 bg-[#F4F7FB]"
      : item.category === "secondary"
      ? "border-[#4F529B]/60 bg-[#F4F7FB]"
      : item.category === "blue_sky"
      ? "border-[#78D5E1]/60 bg-[#E7F6F9]"
      : "border-[#4F529B]/60 bg-white";

  return (
    <div
      className={
        "flex items-start gap-3 rounded-lg border px-3 py-2 " +
        stackBorderBgClass
      }
      style={{
        maxWidth: `${widthPercent}%`,
        marginLeft: "auto",
        marginRight: "auto"
      }}
    >
      <div className="flex flex-col items-center gap-1">
        <div
          className="mt-1 cursor-grab text-[#4F529B]"
          {...dragHandleProps}
          aria-label="Drag to reorder"
        >
          <span className="inline-block text-lg leading-none">☰</span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.factorId)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#E73C3E]/60 text-xs font-semibold text-[#E73C3E] hover:bg-[#FFF1F2]"
          aria-label="Remove factor"
        >
          ×
        </button>
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <p className="text-sm font-semibold tracking-tight text-[#002855]">
              {item.factorName}
            </p>
            {score > 0 ? (
              <p className="text-[10px] text-[#4F529B]">
                Score: {score} points
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onMoveToHonorable(item.factorId)}
            className="text-[11px] font-medium text-[#4F529B] hover:text-[#002855]"
          >
            Send to Honorable mentions
          </button>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-1.5 text-[11px] sm:grid-cols-5">
          {strengths.map((s) => {
            const active = item.strength === s.value;
            const baseColor =
              s.value === 1
                ? "border-slate-200 bg-slate-50 text-[#333333]"
                : s.value === 2
                ? "border-[#008A60]/40 bg-[#E7F6F9] text-[#008A60]"
                : s.value === 3
                ? "border-[#78D5E1]/60 bg-[#E7F6F9] text-[#4F529B]"
                : s.value === 4
                ? "border-[#4F529B]/60 bg-[#F4F7FB] text-[#4F529B]"
                : "border-[#E73C3E]/60 bg-[#FFF1F2] text-[#E73C3E]";
            const activeColor =
              s.value === 1
                ? "border-slate-500 bg-slate-700 text-white"
                : s.value === 2
                ? "border-[#008A60] bg-[#008A60] text-white"
                : s.value === 3
                ? "border-[#78D5E1] bg-[#78D5E1] text-white"
                : s.value === 4
                ? "border-[#4F529B] bg-[#4F529B] text-white"
                : "border-[#E73C3E] bg-[#E73C3E] text-white";
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => onChangeStrength(item.factorId, s.value)}
                className={
                  "rounded-md border px-2 py-1 text-left transition " +
                  (active
                    ? activeColor
                    : baseColor + " hover:border-[#002855] hover:bg-[#F4F7FB]")
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

