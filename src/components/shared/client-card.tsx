"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone } from "lucide-react";
import { CLIENT_PIPELINE_LABELS, CLIENT_PIPELINE_COLORS, type Client, type ClientPipelineStage } from "@/types";

interface ClientCardProps {
  client: Client;
}

export function ClientCard({ client }: ClientCardProps) {
  const router = useRouter();

  const displayName =
    client.companyName ||
    [client.contactFirstName, client.contactLastName].filter(Boolean).join(" ") ||
    "—";

  const contactName = [client.contactFirstName, client.contactLastName]
    .filter(Boolean)
    .join(" ");

  const stage = client.pipelineStage as ClientPipelineStage | null | undefined;

  return (
    <div
      className="rounded-lg border bg-card p-4 cursor-pointer hover:border-primary/50 transition-colors active:bg-muted/30"
      onClick={() => router.push(`/clients/${client.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{displayName}</p>
          {contactName && displayName !== contactName && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{contactName}</p>
          )}
        </div>
        {stage && (
          <Badge className={`${CLIENT_PIPELINE_COLORS[stage]} text-xs shrink-0`}>
            {CLIENT_PIPELINE_LABELS[stage]}
          </Badge>
        )}
      </div>

      <div className="mt-3 space-y-1">
        {client.contactEmail && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{client.contactEmail}</span>
          </div>
        )}
        {client.contactPhone && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>{client.contactPhone}</span>
          </div>
        )}
      </div>
    </div>
  );
}
