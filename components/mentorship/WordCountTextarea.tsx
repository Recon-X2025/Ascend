"use client";

import { useMemo } from "react";

const wordCount = (str: string): number =>
  str
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

interface WordCountTextareaProps {
  value: string;
  onChange: (value: string) => void;
  minWords: number;
  maxWords: number;
  placeholder?: string;
  label?: string;
  rows?: number;
  className?: string;
}

export function WordCountTextarea({
  value,
  onChange,
  minWords,
  maxWords,
  placeholder,
  label,
  rows = 4,
  className = "",
}: WordCountTextareaProps) {
  const count = useMemo(() => wordCount(value), [value]);
  const inRange = count >= minWords && count <= maxWords;
  const overMax = count > maxWords;

  return (
    <div className={className}>
      {label && (
        <label className="block font-medium text-ink text-sm mb-1">{label}</label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green/50"
      />
      <p
        className={`mt-1 text-xs ${
          overMax ? "text-destructive" : inRange ? "text-muted-foreground" : "text-amber-600"
        }`}
      >
        {count} / {maxWords} words
        {!inRange && count > 0 && (
          <span className="ml-1">
            (min {minWords})
          </span>
        )}
      </p>
    </div>
  );
}
