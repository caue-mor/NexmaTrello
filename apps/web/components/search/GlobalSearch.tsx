"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, FileText, MessageSquare, LayoutGrid, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SearchResult {
  id: string;
  type: "board" | "card" | "comment" | "client";
  title: string;
  description?: string;
  boardTitle?: string;
  url: string;
  metadata?: any;
}

interface GlobalSearchProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle search with Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleSelectResult(results[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const handleSelectResult = (result: SearchResult) => {
    router.push(result.url);
    setIsOpen(false);
    setQuery("");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "board": return <LayoutGrid className="w-4 h-4" />;
      case "card": return <FileText className="w-4 h-4" />;
      case "comment": return <MessageSquare className="w-4 h-4" />;
      case "client": return <User className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "board": return "Board";
      case "card": return "Card";
      case "comment": return "Comentário";
      case "client": return "Cliente";
      default: return type;
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar (Ctrl+K)..."
          className="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 border-transparent focus:bg-white dark:focus:bg-neutral-900 border focus:border-blue-500 rounded-lg outline-none transition-all text-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
          <kbd className="hidden sm:inline-flex items-center h-5 px-1.5 text-[10px] font-medium text-neutral-500 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded">
            Ctrl K
          </kbd>
        </div>
      </div>

      {isOpen && (query || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-neutral-500">
              <div className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs">Buscando...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelectResult(result)}
                  className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition text-left ${index === selectedIndex ? "bg-neutral-50 dark:bg-neutral-800" : ""
                    }`}
                >
                  <div className="mt-1 text-neutral-400">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm text-neutral-900 dark:text-white truncate">
                        {result.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded uppercase tracking-wider">
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    {result.description && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                        {result.description}
                      </p>
                    )}
                    {result.boardTitle && (
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                        em {result.boardTitle}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-8 text-center text-neutral-500">
              <p className="text-sm">Nenhum resultado encontrado</p>
            </div>
          ) : null}

          <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-[10px] text-neutral-500">
            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white dark:bg-neutral-700 border rounded">↓↑</kbd> navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white dark:bg-neutral-700 border rounded">↵</kbd> selecionar
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white dark:bg-neutral-700 border rounded">esc</kbd> fechar
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
