"use client";

import { AGENT_STEPS, stepIndex } from "@/lib/client";
import type { AgentStepId } from "@/lib/types";

export function AgentProgress({
  current,
  message,
  running,
}: {
  current: AgentStepId | null;
  message: string;
  running: boolean;
}) {
  const active = current ? stepIndex(current) : -1;

  return (
    <div className="rounded-2xl border border-rule bg-white/50 p-4">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        {AGENT_STEPS.map((step, index) => {
          const done = running && index < active;
          const isCurrent = running && index === active;
          return (
            <li
              key={step.id}
              className={`rounded-xl px-2 py-2 text-center text-xs ${
                isCurrent
                  ? "bg-forest text-paper"
                  : done
                    ? "bg-moss/15 text-forest"
                    : "bg-paper-2 text-ink-soft"
              }`}
            >
              {step.label}
            </li>
          );
        })}
      </ol>
      {message && (
        <p className="mt-3 text-sm text-ink-soft" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
