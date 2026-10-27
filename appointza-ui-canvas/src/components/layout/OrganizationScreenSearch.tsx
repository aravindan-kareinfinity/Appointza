import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  filterOrganizationScreens,
  groupOrganizationScreens,
  type OrgScreenSearchItem,
} from "@/utils/organizationScreenSearch.util";

type OrganizationScreenSearchProps = {
  className?: string;
  /** When true, focus the input (e.g. from ⌘K). */
  focusToken?: number;
};

export default function OrganizationScreenSearch({
  className,
  focusToken = 0,
}: OrganizationScreenSearchProps) {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => filterOrganizationScreens(query), [query]);
  const groups = useMemo(() => groupOrganizationScreens(results), [results]);

  useEffect(() => {
    if (focusToken <= 0) return;
    setOpen(true);
    inputRef.current?.focus();
  }, [focusToken]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || results.length === 0) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-search-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, results.length]);

  const goTo = (item: OrgScreenSearchItem) => {
    setOpen(false);
    setQuery("");
    navigate(item.to);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length === 0) return;
      setOpen(true);
      setActiveIndex((i) => (i + 1) % results.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length === 0) return;
      setOpen(true);
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = results[activeIndex];
      if (item) goTo(item);
    }
  };

  let flatIndex = -1;

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <div
        className={cn(
          "flex h-8 items-center gap-2 rounded-md border bg-zinc-900/80 px-3 transition-colors",
          open
            ? "border-zinc-500 ring-1 ring-zinc-600/60"
            : "border-zinc-700 hover:border-zinc-600",
        )}
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search any screen…"
          className="h-full w-full min-w-0 bg-transparent text-[13px] text-zinc-200 outline-none placeholder:text-zinc-500"
          aria-label="Search screens"
          aria-expanded={open}
          aria-controls="org-screen-search-results"
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
        />
        <kbd className="hidden shrink-0 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 sm:inline">
          ⌘K
        </kbd>
      </div>

      {open ? (
        <div
          id="org-screen-search-results"
          ref={listRef}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-[60] max-h-[min(22rem,70dvh)] overflow-y-auto overscroll-contain rounded-lg border border-zinc-700 bg-[#161b22] py-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.65)]"
          role="listbox"
          aria-label="Screen results"
        >
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-[12px] text-zinc-500">
              No screens match “{query.trim()}”.
            </p>
          ) : (
            groups.map(({ group, items }) => (
              <div key={group} className="mb-1 last:mb-0">
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-500">
                  {group}
                </p>
                <ul>
                  {items.map((item) => {
                    flatIndex += 1;
                    const index = flatIndex;
                    const active = index === activeIndex;
                    return (
                      <li key={item.id} role="option" aria-selected={active}>
                        <button
                          type="button"
                          data-search-index={index}
                          onMouseEnter={() => setActiveIndex(index)}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => goTo(item)}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors",
                            active ? "bg-[#2a5af5] text-white" : "text-zinc-200 hover:bg-zinc-800",
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-medium">{item.label}</span>
                            <span
                              className={cn(
                                "mt-0.5 block truncate text-[11px]",
                                active ? "text-blue-100/80" : "text-zinc-500",
                              )}
                            >
                              {item.group}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
