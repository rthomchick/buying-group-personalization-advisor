// Six-term registry clarification UI
//
// Source of truth: knowledge/specs/kalder_layer2_developer_brief.md,
// "Reference Mode: Pre-Retrieval Pipeline", Stage 2 (Disambiguation Registry).
//
// Prompt strings always follow the format "Are you asking about X or Y?" —
// parsed here into two selectable clarification options, never re-typed by
// hand, so the rendered option text always matches what was actually halted on.

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type DisambiguationPromptProps = {
  prompt: string;
  onSelect: (clarification: string) => void;
};

const PROMPT_PATTERN = /Are you asking about (.+?) or (.+?)\?\s*$/;

function parseOptions(prompt: string): [string, string] | null {
  const match = prompt.match(PROMPT_PATTERN);
  if (!match) return null;
  return [match[1].trim(), match[2].trim()];
}

export function DisambiguationPrompt({ prompt, onSelect }: DisambiguationPromptProps) {
  const options = parseOptions(prompt);

  return (
    <Card className="border-kalder-accent/40 bg-surface">
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-foreground">{prompt}</p>
        {options ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            {options.map((option) => (
              <Button key={option} variant="secondary" className="flex-1 justify-start text-left" onClick={() => onSelect(option)}>
                {option}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Unable to parse clarification options from this prompt — expected format &quot;Are you asking about X or
            Y?&quot;
          </p>
        )}
      </CardContent>
    </Card>
  );
}
