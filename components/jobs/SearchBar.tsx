"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bookmark, Loader2 } from "lucide-react";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  debounceMs?: number;
  suggestions?: { titles: string[]; companies: string[] };
  onSelectSuggestion?: (type: "title" | "company", value: string) => void;
  recentSearches?: { query: string; summary?: string }[];
  onSelectRecent?: (query: string) => void;
  onClearHistory?: () => void;
  onDeleteHistoryItem?: (query: string) => void;
  showSaveSearch?: boolean;
  onSaveSearch?: () => void;
  loadingSuggestions?: boolean;
  disabled?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  debounceMs = 300,
  suggestions,
  onSelectSuggestion,
  recentSearches = [],
  onSelectRecent,
  onClearHistory,
  onDeleteHistoryItem,
  showSaveSearch,
  onSaveSearch,
  loadingSuggestions,
  disabled,
}: SearchBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSuggestions = (suggestions?.titles?.length ?? 0) + (suggestions?.companies?.length ?? 0);
  const showSuggestionsPanel = showSuggestions && value.trim().length >= 2 && (totalSuggestions > 0 || loadingSuggestions);
  const showRecentPanel = showRecent && !value.trim() && recentSearches.length > 0;

  useEffect(() => {
    const t = setTimeout(() => {
      if (value.trim()) onSearch();
    }, debounceMs);
    return () => clearTimeout(t);
  }, [value, debounceMs, onSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setShowRecent(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (showSuggestionsPanel) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlight((h) => (h < totalSuggestions - 1 ? h + 1 : h));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlight((h) => (h > 0 ? h - 1 : -1));
        } else if (e.key === "Enter" && highlight >= 0) {
          e.preventDefault();
          const titles = suggestions?.titles ?? [];
          if (highlight < titles.length) {
            onSelectSuggestion?.("title", titles[highlight]);
          } else {
            onSelectSuggestion?.("company", (suggestions?.companies ?? [])[highlight - titles.length]);
          }
          setShowSuggestions(false);
          setHighlight(-1);
        } else if (e.key === "Escape") {
          setShowSuggestions(false);
          setHighlight(-1);
        }
      }
      if (showRecentPanel && e.key === "Escape") setShowRecent(false);
    },
    [showSuggestionsPanel, showRecentPanel, highlight, totalSuggestions, suggestions, onSelectSuggestion]
  );

  const items = [
    ...(suggestions?.titles ?? []).map((t) => ({ type: "title" as const, value: t })),
    ...(suggestions?.companies ?? []).map((c) => ({ type: "company" as const, value: c })),
  ];

  return (
    <div ref={containerRef} className="relative flex gap-2 flex-1">
      <div className="relative flex-1">
        <Input
          placeholder="Search jobs..."
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
            setShowRecent(false);
            setHighlight(-1);
          }}
          onFocus={() => {
            if (value.trim().length >= 2) setShowSuggestions(true);
            else if (recentSearches.length) setShowRecent(true);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="pr-8"
        />
        {loadingSuggestions && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
        )}
        {showSuggestionsPanel && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md py-1 max-h-64 overflow-y-auto">
            {loadingSuggestions && items.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Loading…</p>
            ) : (
              <>
                {suggestions?.titles?.length ? (
                  <div className="px-2 py-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Titles</p>
                    {(suggestions.titles ?? []).map((t, i) => (
                      <button
                        key={t}
                        type="button"
                        className={`block w-full text-left px-2 py-1.5 text-sm rounded ${highlight === i ? "bg-muted" : "hover:bg-muted/70"}`}
                        onClick={() => {
                          onSelectSuggestion?.("title", t);
                          setShowSuggestions(false);
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                ) : null}
                {suggestions?.companies?.length ? (
                  <div className="px-2 py-1 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Companies</p>
                    {(suggestions.companies ?? []).map((c, i) => (
                      <button
                        key={c}
                        type="button"
                        className={`block w-full text-left px-2 py-1.5 text-sm rounded ${highlight === ((suggestions?.titles?.length ?? 0) + i) ? "bg-muted" : "hover:bg-muted/70"}`}
                        onClick={() => {
                          onSelectSuggestion?.("company", c);
                          setShowSuggestions(false);
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        )}
        {showRecentPanel && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md py-1 max-h-64 overflow-y-auto">
            <p className="px-2 text-xs font-medium text-muted-foreground uppercase">Recent searches</p>
            {recentSearches.slice(0, 5).map((r) => (
              <div key={r.query} className="flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-muted/70 group">
                <button
                  type="button"
                  className="text-left text-sm flex-1 min-w-0 truncate"
                  onClick={() => {
                    onSelectRecent?.(r.query);
                    setShowRecent(false);
                  }}
                >
                  {r.query}{r.summary ? ` · ${r.summary}` : ""}
                </button>
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteHistoryItem?.(r.query);
                  }}
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            ))}
            {onClearHistory && (
              <button
                type="button"
                className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/70"
                onClick={() => {
                  onClearHistory();
                  setShowRecent(false);
                }}
              >
                Clear history
              </button>
            )}
          </div>
        )}
      </div>
      {showSaveSearch && (
        <Button
          variant="outline"
          size="icon"
          title="Save this search"
          disabled={saving || disabled}
          onClick={async () => {
            setSaving(true);
            try {
              await onSaveSearch?.();
            } finally {
              setSaving(false);
            }
          }}
        >
          <Bookmark className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
