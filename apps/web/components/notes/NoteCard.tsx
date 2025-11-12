"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface NoteCardProps {
  note: {
    id: string;
    title: string;
    content: string;
    scope: "PERSONAL" | "BOARD" | "CARD";
    isPinned: boolean;
    tags: string[];
    color: string | null;
    createdAt: Date;
    updatedAt: Date;
    board?: {
      id: string;
      title: string;
    } | null;
    card?: {
      id: string;
      title: string;
    } | null;
    user: {
      name: string | null;
      email: string;
    };
  };
  onEdit: () => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
}

const COLORS = {
  default: "from-yellow-100 to-yellow-200 border-yellow-300",
  blue: "from-blue-100 to-blue-200 border-blue-300",
  green: "from-green-100 to-green-200 border-green-300",
  pink: "from-pink-100 to-pink-200 border-pink-300",
  purple: "from-purple-100 to-purple-200 border-purple-300",
  orange: "from-orange-100 to-orange-200 border-orange-300",
};

export function NoteCard({ note, onEdit, onDelete, onPin }: NoteCardProps) {
  const [showActions, setShowActions] = useState(false);

  const colorClass = note.color
    ? (COLORS[note.color as keyof typeof COLORS] || COLORS.default)
    : COLORS.default;

  const scopeIcon = {
    PERSONAL: "🔒",
    BOARD: "👥",
    CARD: "📌",
  };

  const scopeLabel = {
    PERSONAL: "Pessoal",
    BOARD: note.board?.title || "Board",
    CARD: note.card?.title || "Card",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, rotateZ: -5 }}
      animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
      exit={{ opacity: 0, scale: 0.8, rotateZ: 5 }}
      whileHover={{ scale: 1.02, rotateZ: 2 }}
      transition={{ type: "spring", duration: 0.3 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`relative bg-gradient-to-br ${colorClass} border-2 rounded-2xl p-5
                  shadow-lg hover:shadow-2xl transition-shadow cursor-pointer break-inside-avoid mb-4`}
      onClick={onEdit}
    >
      {/* Pin Badge */}
      {note.isPinned && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full
                     flex items-center justify-center shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
        </motion.div>
      )}

      {/* Actions (hover) */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-3 right-3 flex gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onPin(note.id)}
              className="p-1.5 bg-white/80 backdrop-blur rounded-lg hover:bg-white transition"
              title={note.isPinned ? "Desfixar" : "Fixar"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ${note.isPinned ? "text-blue-600" : "text-neutral-600"}`}
                fill={note.isPinned ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (confirm(`Deletar nota "${note.title}"?`)) {
                  onDelete(note.id);
                }
              }}
              className="p-1.5 bg-white/80 backdrop-blur rounded-lg hover:bg-red-100 transition"
              title="Deletar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-red-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scope Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm bg-white/70 backdrop-blur px-2 py-1 rounded-lg font-medium">
          {scopeIcon[note.scope]} {scopeLabel[note.scope]}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-neutral-900 mb-2 line-clamp-2">
        {note.title}
      </h3>

      {/* Content Preview */}
      <p className="text-sm text-neutral-700 line-clamp-6 mb-3 whitespace-pre-wrap">
        {note.content}
      </p>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {note.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-white/70 backdrop-blur px-2 py-0.5 rounded-full text-neutral-700"
            >
              #{tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-xs text-neutral-600">+{note.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-neutral-600">
        <span>
          {new Date(note.updatedAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          })}
        </span>
        {note.user.name && (
          <span className="truncate max-w-[120px]">{note.user.name}</span>
        )}
      </div>
    </motion.div>
  );
}
