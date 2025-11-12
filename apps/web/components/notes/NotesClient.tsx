"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NoteCard } from "./NoteCard";
import { NoteEditor } from "./NoteEditor";
import { NotesFilters } from "./NotesFilters";

interface Note {
  id: string;
  title: string;
  content: string;
  scope: "PERSONAL" | "BOARD" | "CARD";
  userId: string;
  boardId: string | null;
  cardId: string | null;
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
}

export function NotesClient({
  initialNotes,
  userId,
}: {
  initialNotes: Note[];
  userId: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [filter, setFilter] = useState<"all" | "personal" | "board" | "card">("all");
  const [searchTags, setSearchTags] = useState<string[]>([]);

  // Filtrar notas
  const filteredNotes = notes.filter((note) => {
    if (filter === "all") return true;
    if (filter === "personal") return note.scope === "PERSONAL";
    if (filter === "board") return note.scope === "BOARD";
    if (filter === "card") return note.scope === "CARD";
    return true;
  }).filter((note) => {
    if (searchTags.length === 0) return true;
    return searchTags.some((tag) => note.tags.includes(tag));
  });

  // Separar pinnadas vs. normais
  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const regularNotes = filteredNotes.filter((n) => !n.isPinned);

  async function handleSave(noteData: Partial<Note>) {
    if (selectedNote) {
      // Update
      const res = await fetch(`/api/notes/${selectedNote.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      });

      if (res.ok) {
        const updated = await res.json();
        setNotes(notes.map((n) => (n.id === updated.id ? updated : n)));
      }
    } else {
      // Create
      const res = await fetch("/api/notes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      });

      if (res.ok) {
        const newNote = await res.json();
        setNotes([newNote, ...notes]);
      }
    }

    setShowEditor(false);
    setSelectedNote(null);
  }

  async function handleDelete(noteId: string) {
    const res = await fetch(`/api/notes/${noteId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      setNotes(notes.filter((n) => n.id !== noteId));
    }
  }

  async function handlePin(noteId: string) {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    const res = await fetch(`/api/notes/${noteId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !note.isPinned }),
    });

    if (res.ok) {
      const updated = await res.json();
      setNotes(notes.map((n) => (n.id === updated.id ? updated : n)));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                📝 Minhas Notas
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                {filteredNotes.length} {filteredNotes.length === 1 ? "nota" : "notas"}
                {searchTags.length > 0 && ` com tags: ${searchTags.join(", ")}`}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedNote(null);
                setShowEditor(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white
                       rounded-xl font-semibold shadow-lg hover:shadow-xl transition
                       flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Nova Nota
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar - Filters */}
          <div className="w-64 flex-shrink-0">
            <NotesFilters
              filter={filter}
              onFilterChange={setFilter}
              selectedTags={searchTags}
              onTagsChange={setSearchTags}
              allTags={Array.from(new Set(notes.flatMap((n) => n.tags)))}
            />
          </div>

          {/* Notes Grid */}
          <div className="flex-1">
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  Fixadas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {pinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={() => {
                          setSelectedNote(note);
                          setShowEditor(true);
                        }}
                        onDelete={handleDelete}
                        onPin={handlePin}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Regular Notes */}
            {regularNotes.length > 0 ? (
              <div>
                {pinnedNotes.length > 0 && (
                  <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                    Todas as Notas
                  </h2>
                )}
                <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                  <AnimatePresence mode="popLayout">
                    {regularNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={() => {
                          setSelectedNote(note);
                          setShowEditor(true);
                        }}
                        onDelete={handleDelete}
                        onPin={handlePin}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="text-8xl mb-4">📝</div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                  Nenhuma nota ainda
                </h3>
                <p className="text-neutral-600 mb-6">
                  Clique em "Nova Nota" para começar!
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <NoteEditor
            note={selectedNote}
            onSave={handleSave}
            onClose={() => {
              setShowEditor(false);
              setSelectedNote(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
