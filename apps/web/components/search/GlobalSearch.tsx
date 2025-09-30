"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface SearchCard {
  id: string;
  title: string;
  description: string | null;
  urgency: string;
  dueAt: Date | null;
  board: {
    id: string;
    title: string;
  };
  client: {
    id: string;
    name: string;
    status: string;
  } | null;
  _count: {
    comments: number;
    checklists: number;
  };
}

interface SearchClient {
  id: string;
  name: string;
  status: string;
  email: string | null;
  phone: string | null;
  _count: {
    cards: number;
  };
}

interface SearchComment {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  };
  card: {
    id: string;
    title: string;
    board: {
      id: string;
      title: string;
    };
  };
}

interface SearchResults {
  cards: SearchCard[];
  clients: SearchClient[];
  comments: SearchComment[];
  total: number;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`);

      if (response.ok) {
        const data: SearchResults = await response.json();
        setResults(data);
      } else {
        console.error("Search error:", response.statusText);
        setResults(null);
      }
    } catch (error) {
      console.error("Search request failed:", error);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);

    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new debounce timer (300ms)
    debounceTimer.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Handle result click
  const handleResultClick = () => {
    setQuery("");
    setResults(null);
    setIsOpen(false);
  };

  // Urgency badge color mapping
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "URGENT":
        return "bg-red-100 text-red-700";
      case "HIGH":
        return "bg-orange-100 text-orange-700";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700";
      case "LOW":
        return "bg-green-100 text-green-700";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case "URGENT":
        return "Urgente";
      case "HIGH":
        return "Alta";
      case "MEDIUM":
        return "Média";
      case "LOW":
        return "Baixa";
      default:
        return urgency;
    }
  };

  // Mobile icon button
  if (isMobile) {
    return (
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="p-2 rounded-lg hover:bg-neutral-100 transition"
        aria-label="Buscar"
      >
        <svg
          className="w-5 h-5 text-neutral-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div ref={searchRef} className="relative flex-1 max-w-xl">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar cards, clientes..."
          className="w-full pl-10 pr-20 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-neutral-100 text-neutral-600 rounded border border-neutral-300">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && (query.trim() || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden z-50 max-h-[80vh] overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="p-8 text-center">
              <div className="inline-block w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="mt-2 text-sm text-neutral-600">Buscando...</p>
            </div>
          )}

          {/* No Results */}
          {!isLoading && results && results.total === 0 && (
            <div className="p-8 text-center">
              <svg
                className="w-12 h-12 mx-auto text-neutral-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-2 text-neutral-600 font-medium">Nenhum resultado encontrado</p>
              <p className="text-sm text-neutral-500">Tente buscar com outros termos</p>
            </div>
          )}

          {/* Results Content */}
          {!isLoading && results && results.total > 0 && (
            <div className="divide-y divide-neutral-100">
              {/* Cards Section */}
              {results.cards.length > 0 && (
                <div className="p-3">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide px-3 mb-2">
                    Cards ({results.cards.length})
                  </h3>
                  <div className="space-y-1">
                    {results.cards.map((card) => (
                      <Link
                        key={card.id}
                        href={`/dashboard?card=${card.id}`}
                        onClick={handleResultClick}
                        className="block p-3 rounded-lg hover:bg-neutral-50 transition group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-neutral-900 group-hover:text-blue-600 truncate transition">
                              {card.title}
                            </h4>
                            <p className="text-xs text-neutral-500 mt-0.5 truncate">
                              {card.board.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getUrgencyColor(card.urgency)}`}>
                              {getUrgencyLabel(card.urgency)}
                            </span>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 mt-2">
                          {card.client && (
                            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                              {card.client.name}
                            </span>
                          )}
                          {card._count.comments > 0 && (
                            <span className="text-xs text-neutral-500 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              {card._count.comments}
                            </span>
                          )}
                          {card._count.checklists > 0 && (
                            <span className="text-xs text-neutral-500 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              {card._count.checklists}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Clients Section */}
              {results.clients.length > 0 && (
                <div className="p-3">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide px-3 mb-2">
                    Clientes ({results.clients.length})
                  </h3>
                  <div className="space-y-1">
                    {results.clients.map((client) => (
                      <Link
                        key={client.id}
                        href={`/clientes/${client.id}`}
                        onClick={handleResultClick}
                        className="block p-3 rounded-lg hover:bg-neutral-50 transition group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-neutral-900 group-hover:text-blue-600 truncate transition">
                              {client.name}
                            </h4>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {client.email || client.phone || "Sem contato"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full font-medium">
                              {client._count.cards} cards
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments Section */}
              {results.comments.length > 0 && (
                <div className="p-3">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide px-3 mb-2">
                    Comentários ({results.comments.length})
                  </h3>
                  <div className="space-y-1">
                    {results.comments.map((comment) => (
                      <Link
                        key={comment.id}
                        href={`/dashboard?card=${comment.card.id}`}
                        onClick={handleResultClick}
                        className="block p-3 rounded-lg hover:bg-neutral-50 transition group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-neutral-700 line-clamp-2">
                              {comment.content}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                              <span className="font-medium">{comment.user.name || comment.user.email}</span>
                              <span>•</span>
                              <span className="truncate">{comment.card.title}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
