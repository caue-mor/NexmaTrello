"use client";

import { motion } from "framer-motion";

interface NotesFiltersProps {
  filter: "all" | "personal" | "board" | "card";
  onFilterChange: (filter: "all" | "personal" | "board" | "card") => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  allTags: string[];
}

export function NotesFilters({
  filter,
  onFilterChange,
  selectedTags,
  onTagsChange,
  allTags,
}: NotesFiltersProps) {
  const filters = [
    { value: "all" as const, label: "Todas", icon: "📝" },
    { value: "personal" as const, label: "Pessoais", icon: "🔒" },
    { value: "board" as const, label: "Boards", icon: "👥" },
    { value: "card" as const, label: "Cards", icon: "📌" },
  ];

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  }

  return (
    <div className="sticky top-32 bg-white rounded-2xl shadow-lg p-6 border border-neutral-200">
      {/* Filters */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">Filtros</h3>
        <div className="space-y-1">
          {filters.map((f) => (
            <motion.button
              key={f.value}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onFilterChange(f.value)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg
                        transition font-medium text-sm ${
                          filter === f.value
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                            : "text-neutral-700 hover:bg-neutral-100"
                        }`}
            >
              <span className="text-lg">{f.icon}</span>
              {f.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">Tags</h3>
          <div className="space-y-1">
            {allTags.slice(0, 10).map((tag) => (
              <motion.button
                key={tag}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleTag(tag)}
                className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg
                          transition text-sm ${
                            selectedTags.includes(tag)
                              ? "bg-blue-100 text-blue-700 font-medium"
                              : "text-neutral-700 hover:bg-neutral-100"
                          }`}
              >
                <span className="text-xs">#{tag}</span>
              </motion.button>
            ))}
            {allTags.length > 10 && (
              <p className="text-xs text-neutral-500 px-4 py-2">
                +{allTags.length - 10} tags
              </p>
            )}
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {(filter !== "all" || selectedTags.length > 0) && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            onFilterChange("all");
            onTagsChange([]);
          }}
          className="w-full mt-4 px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900
                   border border-neutral-300 rounded-lg hover:bg-neutral-50 transition"
        >
          Limpar filtros
        </motion.button>
      )}
    </div>
  );
}
