"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Heading, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QuoteLineFormData } from "@/types/quote";

const UNITS = [
  { value: "unit", label: "Unité" },
  { value: "hour", label: "Heure" },
  { value: "day", label: "Jour" },
  { value: "month", label: "Mois" },
  { value: "forfait", label: "Forfait" },
];

interface QuoteLineEditorProps {
  lines: QuoteLineFormData[];
  onChange: (lines: QuoteLineFormData[]) => void;
}

function emptyLine(sortOrder: number): QuoteLineFormData {
  return {
    sortOrder,
    isSection: false,
    isOptional: false,
    description: "",
    details: "",
    quantity: 1,
    unit: "day",
    unitPriceHt: 0,
    tvaRate: 20,
  };
}

function emptySection(sortOrder: number): QuoteLineFormData {
  return {
    sortOrder,
    isSection: true,
    isOptional: false,
    description: "",
    details: "",
    quantity: 0,
    unit: "unit",
    unitPriceHt: 0,
    tvaRate: 0,
  };
}

export function QuoteLineEditor({ lines, onChange }: QuoteLineEditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  function updateLine(
    index: number,
    partial: Partial<QuoteLineFormData>
  ) {
    const updated = lines.map((l, i) =>
      i === index ? { ...l, ...partial } : l
    );
    onChange(updated);
  }

  function addLine() {
    onChange([...lines, emptyLine(lines.length)]);
  }

  function addSection() {
    onChange([...lines, emptySection(lines.length)]);
  }

  function removeLine(index: number) {
    onChange(
      lines
        .filter((_, i) => i !== index)
        .map((l, i) => ({ ...l, sortOrder: i }))
    );
  }

  function moveLine(from: number, to: number) {
    if (to < 0 || to >= lines.length) return;
    const updated = [...lines];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onChange(updated.map((l, i) => ({ ...l, sortOrder: i })));
  }

  const subtotalHt = lines
    .filter((l) => !l.isSection && !l.isOptional)
    .reduce((sum, l) => sum + l.quantity * l.unitPriceHt, 0);

  return (
    <div className="space-y-2">
      {lines.map((line, index) => (
        <div
          key={index}
          className={cn(
            "group rounded-lg border p-3 transition-colors",
            line.isSection && "bg-muted/50 border-primary/20",
            line.isOptional && "border-dashed opacity-75"
          )}
        >
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-1 pt-2">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => moveLine(index, index - 1)}
                disabled={index === 0}
              >
                <GripVertical className="h-4 w-4" />
              </button>
            </div>

            {line.isSection ? (
              <div className="flex-1 flex items-center gap-2">
                <Heading className="h-4 w-4 text-primary" />
                <Input
                  placeholder="Titre de la section"
                  value={line.description}
                  onChange={(e) =>
                    updateLine(index, { description: e.target.value })
                  }
                  className="font-semibold border-none bg-transparent px-0 text-base focus-visible:ring-0"
                />
              </div>
            ) : (
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Description de la prestation"
                    value={line.description}
                    onChange={(e) =>
                      updateLine(index, { description: e.target.value })
                    }
                    className="flex-1"
                  />
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground text-xs"
                    onClick={() =>
                      setExpandedIndex(
                        expandedIndex === index ? null : index
                      )
                    }
                  >
                    {expandedIndex === index ? "−" : "+"}
                  </button>
                </div>

                {expandedIndex === index && (
                  <Textarea
                    placeholder="Détails supplémentaires..."
                    value={line.details}
                    onChange={(e) =>
                      updateLine(index, { details: e.target.value })
                    }
                    rows={2}
                    className="text-sm"
                  />
                )}

                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(index, {
                        quantity: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-20"
                    placeholder="Qté"
                  />
                  <Select
                    value={line.unit}
                    onValueChange={(value) =>
                      updateLine(index, { unit: value })
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.unitPriceHt}
                    onChange={(e) =>
                      updateLine(index, {
                        unitPriceHt: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-28"
                    placeholder="PU HT"
                  />
                  <span className="text-sm text-muted-foreground">€ HT</span>

                  <div className="ml-auto text-right">
                    <span className="font-medium">
                      {(line.quantity * line.unitPriceHt).toLocaleString(
                        "fr-FR",
                        {
                          style: "currency",
                          currency: "EUR",
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1">
              {!line.isSection && (
                <button
                  type="button"
                  className={cn(
                    "rounded p-1 transition-colors",
                    line.isOptional
                      ? "text-amber-500"
                      : "text-muted-foreground hover:text-amber-500"
                  )}
                  onClick={() =>
                    updateLine(index, { isOptional: !line.isOptional })
                  }
                  title="Option"
                >
                  <Star className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => removeLine(index)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {line.isOptional && (
            <Badge variant="outline" className="mt-2 text-xs text-amber-600">
              Option (non incluse dans le total)
            </Badge>
          )}
        </div>
      ))}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={addLine}>
          <Plus className="mr-1 h-4 w-4" />
          Ajouter une ligne
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSection}
        >
          <Heading className="mr-1 h-4 w-4" />
          Ajouter une section
        </Button>
      </div>

      <div className="mt-4 rounded-lg bg-muted/50 p-4 text-right">
        <div className="text-sm text-muted-foreground">Sous-total HT</div>
        <div className="text-xl font-bold">
          {subtotalHt.toLocaleString("fr-FR", {
            style: "currency",
            currency: "EUR",
          })}
        </div>
      </div>
    </div>
  );
}
