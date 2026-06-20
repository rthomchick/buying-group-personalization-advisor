// Query input field with disambiguation prompt support

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type QueryInputProps = {
  onSubmit: (query: string) => void;
  isLoading: boolean;
};

export function QueryInput({ onSubmit, isLoading }: QueryInputProps) {
  const [query, setQuery] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setQuery("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Ask about the Kalder corpus or data model..."
        disabled={isLoading}
        aria-label="Reference Mode query"
      />
      <Button type="submit" disabled={isLoading || query.trim().length === 0}>
        {isLoading ? "Searching..." : "Ask"}
      </Button>
    </form>
  );
}
