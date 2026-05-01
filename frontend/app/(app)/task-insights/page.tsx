"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, CalendarClock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { statisticsAPI, type TaskInsightsResponse } from "@/api";
import { formatWithAppTimeZone } from "@/lib/datetime";

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "bg-red-50 text-red-600 border-red-200",
  MEDIUM: "bg-amber-50 text-amber-600 border-amber-200",
  LOW: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

function formatDeadline(dateValue: string) {
  return formatWithAppTimeZone(dateValue, "en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TaskInsightsPage() {
  const router = useRouter();
  const [data, setData] = useState<TaskInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUserId = window.localStorage.getItem("userId");

    if (!storedUserId) {
      router.push("/login");
      return;
    }

    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await statisticsAPI.getTaskInsights(storedUserId);
        setData(response);
      } catch (fetchError) {
        console.error("Failed to load task insights:", fetchError);
        setError("Failed to load task insights.");
      } finally {
        setLoading(false);
      }
    };

    void fetchInsights();
  }, [router]);

  const generatedAt = useMemo(() => {
    if (!data?.generated_at) return "-";
    return formatWithAppTimeZone(data.generated_at, "en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [data?.generated_at]);

  const priorityCards = useMemo(
    () => [
      {
        label: "High Priority",
        value: data?.priority_counts?.HIGH ?? 0,
        className: "from-red-500 to-rose-400",
      },
      {
        label: "Medium Priority",
        value: data?.priority_counts?.MEDIUM ?? 0,
        className: "from-amber-500 to-orange-400",
      },
      {
        label: "Low Priority",
        value: data?.priority_counts?.LOW ?? 0,
        className: "from-emerald-500 to-green-400",
      },
    ],
    [data],
  );

  const totalTasks = useMemo(
    () =>
      (data?.priority_counts?.HIGH ?? 0) +
      (data?.priority_counts?.MEDIUM ?? 0) +
      (data?.priority_counts?.LOW ?? 0),
    [data],
  );

  return (
    <div className="min-h-screen bg-[#EFEFEF] p-8 text-gray-800">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                <BarChart3 size={14} />
                Analytics
              </div>
              <h2 className="text-3xl font-semibold text-slate-900">
                Task Priority Overview
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Analyze how your assignments are distributed by priority and see which tasks are due within the next 7 days.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <span className="font-medium text-slate-700">Last generated:</span>{" "}
              {generatedAt}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 text-slate-500">
              <Loader2 className="animate-spin" size={18} />
              Loading insights...
            </div>
          </div>
        ) : error ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-[28px] border border-red-100 bg-white px-6 text-red-500 shadow-sm">
            {error}
          </div>
        ) : (
          <>
            <section className="grid gap-5 lg:grid-cols-3">
              {priorityCards.map((card) => (
                <div
                  key={card.label}
                  className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
                >
                  <div className={`h-2 bg-gradient-to-r ${card.className}`} />
                  <div className="p-6">
                    <p className="text-sm font-medium text-slate-500">
                      {card.label}
                    </p>
                    <div className="mt-5 flex items-end justify-between">
                      <span className="text-5xl font-semibold text-slate-900">
                        {card.value}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                        tasks
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      Priority Breakdown
                    </h3>
                    <p className="text-sm text-slate-500">
                      {totalTasks} total task(s) in your current workload.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {data?.priority_summary.map((item) => {
                    const percentage = totalTasks === 0
                      ? 0
                      : Math.round((item.count / totalTasks) * 100);
                    return (
                      <div key={item.priority} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">
                            {item.priority}
                          </span>
                          <span className="text-slate-500">
                            {item.count} task(s) • {percentage}%
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              item.priority === "HIGH"
                                ? "bg-red-400"
                                : item.priority === "MEDIUM"
                                  ? "bg-amber-400"
                                  : "bg-emerald-400"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-orange-50 p-3 text-orange-500">
                      <CalendarClock size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        Due Within 7 Days
                      </h3>
                      <p className="text-sm text-slate-500">
                        {data?.upcoming_total ?? 0} assignment(s) are approaching their deadline soon.
                      </p>
                    </div>
                  </div>
                </div>

                {!data?.upcoming_deadlines?.length ? (
                  <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                    No assignments due in the next 7 days.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.upcoming_deadlines.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-slate-300 hover:bg-white"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-lg font-semibold text-slate-900">
                                {task.title}
                              </h4>
                              <span
                                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                                  PRIORITY_STYLES[task.priority] ??
                                  "border-slate-200 bg-slate-100 text-slate-600"
                                }`}
                              >
                                {task.priority}
                              </span>
                            </div>
                            <p className="text-sm text-slate-500">
                              {task.course_name} • {task.status}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                              <p className="text-xs uppercase tracking-wide text-slate-400">
                                Deadline
                              </p>
                              <p className="text-sm font-medium text-slate-700">
                                {formatDeadline(task.deadline)}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-red-50 px-4 py-3 text-red-600 shadow-sm">
                              <p className="text-xs uppercase tracking-wide text-red-400">
                                Remaining
                              </p>
                              <p className="text-sm font-semibold">
                                {task.days_remaining} day(s)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-amber-100 bg-amber-50/60 p-5 shadow-sm">
              <div className="flex items-start gap-3 text-amber-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p className="text-sm leading-6">
                  This page is powered by a pandas-based backend analytics endpoint. It counts tasks by priority and highlights assignments due within the next 7 days from real database records.
                </p>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
