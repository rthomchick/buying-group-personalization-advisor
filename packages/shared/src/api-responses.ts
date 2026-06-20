// Reference Mode API response contract — mirrors app/api/reference/route.ts's
// own ReferenceModeResponse exactly. That route is the source of truth for
// this shape; if the route's response shape changes, update here to match,
// not the other way around.

export type QueryType = "QT-1" | "QT-2" | "QT-3" | "QT-4" | "QT-5" | "QT-6";

export type ReferenceModeResponse =
  | {
      outcome: "disambiguation_required";
      term: string;
      prompt: string;
    }
  | {
      outcome: "answered";
      queryType: QueryType;
      answer: string;
      source: string;
      related: string[];
      belowThreshold: boolean;
    };

// The "answered" variant's shape, extracted for components (e.g. ResultCard)
// that only ever render an already-resolved answer and don't need to
// discriminate on `outcome`.
export type ReferenceResult = Extract<ReferenceModeResponse, { outcome: "answered" }>;
