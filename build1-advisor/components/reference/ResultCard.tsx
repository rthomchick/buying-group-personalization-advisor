// [ANSWER] / [SOURCE] / [RELATED] output template
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md,
// "Reference Mode Output Format".
//
// ReferenceResult is the "answered" variant of ReferenceModeResponse, defined
// in packages/shared/src/api-responses.ts — the route (app/api/reference/route.ts)
// is the source of truth for the shape; this component just renders it.

import { Card, CardContent } from "@/components/ui/card";
import type { ReferenceResult } from "@kalder/shared";

export type ResultCardProps = {
  result: ReferenceResult;
};

export function ResultCard({ result }: ResultCardProps) {
  return (
    <Card className="bg-surface">
      <CardContent className="flex flex-col gap-4">
        {result.belowThreshold && (
          <div className="rounded-md border border-kalder-flag/40 bg-kalder-flag/[0.08] px-3 py-2 text-xs font-medium text-kalder-flag">
            [LOW-CONFIDENCE] This result fell below the corpus similarity threshold and is not presented as
            authoritative.
          </div>
        )}

        <section className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">[ANSWER]</h3>
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{result.answer}</p>
        </section>

        <section className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">[SOURCE]</h3>
          <p className="font-mono text-xs text-kalder-accent">{result.source}</p>
        </section>

        {result.related.length > 0 && (
          <section className="flex flex-col gap-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">[RELATED]</h3>
            <ul className="flex flex-col gap-1">
              {result.related.map((reference) => (
                <li key={reference} className="font-mono text-xs text-kalder-accent">
                  {reference}
                </li>
              ))}
            </ul>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
