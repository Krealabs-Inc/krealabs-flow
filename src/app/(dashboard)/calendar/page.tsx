"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CalendarEvent } from "@/app/api/calendar/route";

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const FILTER_LABELS: Record<CalendarEvent["type"], string> = {
  invoice_due: "Factures",
  quote_validity: "Devis",
  payment: "Paiements",
  contract_renewal: "Contrats",
  fiscal_obligation: "Obligations fiscales",
};

const FILTER_COLORS: Record<CalendarEvent["type"], string> = {
  invoice_due: "#F97316",
  quote_validity: "#3B82F6",
  payment: "#22C55E",
  contract_renewal: "#A855F7",
  fiscal_obligation: "#8B89F7",
};

type FilterKey = CalendarEvent["type"];
type FiltersState = Record<FilterKey, boolean>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Returns ISO YYYY-MM-DD for today */
function todayStr(): string {
  const n = new Date();
  return toDateStr(n.getFullYear(), n.getMonth() + 1, n.getDate());
}

/**
 * Build the grid of days for the calendar view.
 * The grid always starts on Monday and has exactly 6 rows (42 cells).
 * Returns an array of { dateStr, inMonth } objects.
 */
function buildCalendarGrid(
  year: number,
  month: number // 1-indexed
): Array<{ dateStr: string; inMonth: boolean }> {
  const firstDayOfMonth = new Date(year, month - 1, 1);
  // getDay(): 0=Sun … 6=Sat → convert to Mon-based: 0=Mon … 6=Sun
  const startDow = (firstDayOfMonth.getDay() + 6) % 7; // offset from Monday

  const daysInMonth = new Date(year, month, 0).getDate();

  // Fill leading days from previous month
  const prevMonthDays = new Date(year, month - 1, 0).getDate();
  const cells: Array<{ dateStr: string; inMonth: boolean }> = [];

  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    cells.push({ dateStr: toDateStr(prevYear, prevMonth, d), inMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ dateStr: toDateStr(year, month, d), inMonth: true });
  }

  // Fill trailing days from next month
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ dateStr: toDateStr(nextYear, nextMonth, nextDay), inMonth: false });
    nextDay++;
  }

  return cells;
}

function formatDateFr(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${d} ${MONTHS_FR[m - 1]} ${y}`;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: "Brouillon",
    sent: "Envoyée",
    paid: "Réglée",
    partially_paid: "Part. payée",
    overdue: "En retard",
    cancelled: "Annulée",
    accepted: "Accepté",
    rejected: "Refusé",
    expired: "Expiré",
    active: "Actif",
    received: "Reçu",
    pending: "À venir",
    refunded: "Remboursé",
  };
  return map[status] ?? status;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersState>({
    invoice_due: true,
    quote_validity: true,
    payment: true,
    contract_renewal: true,
    fiscal_obligation: true,
  });
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  const fetchEvents = useCallback(async (ms: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar?month=${ms}`);
      if (!res.ok) return;
      const json = (await res.json()) as { success: boolean; data: CalendarEvent[] };
      if (json.success) setEvents(json.data);
    } catch {
      // DB not ready or network error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(monthStr);
  }, [fetchEvents, monthStr]);

  // Reset selected day when month changes
  useEffect(() => {
    setSelectedDay(null);
  }, [monthStr]);

  const prevMonth = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const filtered = events.filter((e) => filters[e.type]);

  const eventsByDay = filtered.reduce<Record<string, CalendarEvent[]>>(
    (acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    },
    {}
  );

  const grid = buildCalendarGrid(year, month);
  const today = todayStr();

  const toggleFilter = (key: FilterKey) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedDayEvents = selectedDay ? (eventsByDay[selectedDay] ?? []) : [];

  return (
    <div className="flex flex-col h-full gap-4 p-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Calendrier</h1>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Mois précédent">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center font-semibold text-base">
            {MONTHS_FR[month - 1]} {year}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Mois suivant">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border transition-all"
            style={
              filters[key]
                ? {
                    backgroundColor: FILTER_COLORS[key] + "20",
                    borderColor: FILTER_COLORS[key],
                    color: FILTER_COLORS[key],
                  }
                : {
                    backgroundColor: "transparent",
                    borderColor: "hsl(var(--border))",
                    color: "hsl(var(--muted-foreground))",
                  }
            }
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: filters[key] ? FILTER_COLORS[key] : "hsl(var(--muted-foreground))" }}
            />
            {FILTER_LABELS[key]}
          </button>
        ))}
      </div>

      {/* ── Main layout ── */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* ── Calendar grid ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <Card className="flex-1 flex flex-col">
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Day of week headers */}
              <div className="grid grid-cols-7 border-b">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              {loading ? (
                <div className="flex flex-1 items-center justify-center text-muted-foreground py-16">
                  Chargement...
                </div>
              ) : (
                <div className="grid grid-cols-7 flex-1" style={{ gridAutoRows: "1fr" }}>
                  {grid.map(({ dateStr, inMonth }) => {
                    const dayEvents = eventsByDay[dateStr] ?? [];
                    const isToday = dateStr === today;
                    const isSelected = dateStr === selectedDay;
                    const dayNum = parseInt(dateStr.split("-")[2], 10);

                    const visibleEvents = dayEvents.slice(0, 3);
                    const hiddenCount = dayEvents.length - 3;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                        className={[
                          "relative flex flex-col gap-0.5 p-1.5 border-b border-r text-left transition-colors min-h-[80px]",
                          !inMonth ? "bg-muted/30" : "",
                          isToday ? "bg-primary/5" : "",
                          isSelected ? "ring-2 ring-inset ring-primary" : "",
                          "hover:bg-muted/50",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <span
                          className={[
                            "text-xs font-semibold leading-none mb-0.5 w-5 h-5 flex items-center justify-center rounded-full",
                            !inMonth ? "text-muted-foreground/50" : "",
                            isToday
                              ? "bg-primary text-primary-foreground"
                              : inMonth
                              ? "text-foreground"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {dayNum}
                        </span>

                        {visibleEvents.map((event) => (
                          <div
                            key={event.id}
                            className="text-[11px] px-1 py-0.5 rounded truncate w-full"
                            style={{
                              backgroundColor: event.color + "20",
                              color: event.color,
                            }}
                          >
                            {event.title.split(" \u2014 ")[0]}
                          </div>
                        ))}

                        {hiddenCount > 0 && (
                          <span className="text-[10px] text-muted-foreground font-medium px-1">
                            {"+"}
                            {hiddenCount} autre{hiddenCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Side panel ── */}
        {selectedDay && (
          <div className="w-72 flex-shrink-0">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  {formatDateFr(selectedDay)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedDayEvents.length === 0
                    ? "Aucun événement"
                    : `${selectedDayEvents.length} événement${selectedDayEvents.length > 1 ? "s" : ""}`}
                </p>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-3 pb-4">
                {selectedDayEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <CalendarDays className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">Aucun événement ce jour</p>
                  </div>
                ) : (
                  selectedDayEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={event.href}
                      className="block rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                      style={{ borderLeftWidth: "3px", borderLeftColor: event.color }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold leading-tight">
                          {event.title.split(" \u2014 ")[0]}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 shrink-0 whitespace-nowrap"
                          style={{ color: event.color, borderColor: event.color + "60" }}
                        >
                          {FILTER_LABELS[event.type]}
                        </Badge>
                      </div>
                      {event.title.includes(" \u2014 ") && (
                        <p className="text-xs text-muted-foreground truncate mb-1">
                          {event.title.split(" \u2014 ")[1]}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          {statusLabel(event.status)}
                        </span>
                        {event.amount !== undefined && event.amount > 0 && (
                          <span className="text-xs font-semibold tabular-nums">
                            {formatAmount(event.amount)}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
