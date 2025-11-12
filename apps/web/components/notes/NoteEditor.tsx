"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface NoteEditorProps {
  note: any | null;
  onSave: (data: any) => void;
  onClose: () => void;
}

const COLORS = [
  { value: "default", label: "Amarelo", class: "bg-gradient-to-br from-yellow-100 to-yellow-200" },
  { value: "blue", label: "Azul", class: "bg-gradient-to-br from-blue-100 to-blue-200" },
  { value: "green", label: "Verde", class: "bg-gradient-to-br from-green-100 to-green-200" },
  { value: "pink", label: "Rosa", class: "bg-gradient-to-br from-pink-100 to-pink-200" },
  { value: "purple", label: "Roxo", class: "bg-gradient-to-br from-purple-100 to-purple-200" },
  { value: "orange", label: "Laranja", class: "bg-gradient-to-br from-orange-100 to-orange-200" },
];

export function NoteEditor({ note, onSave, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [color, setColor] = useState(note?.color || "default");
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [scope] = useState<"PERSONAL">(note?.scope || "PERSONAL");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onSave({
      title: title.trim(),
      content: content.trim(),
      color,
      tags,
      scope,
    });
  }

  function addTag() {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">
                {note ? "Editar Nota" : "Nova Nota"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-lg transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-neutral-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título da nota..."
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Conteúdo
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva sua nota aqui..."
                  rows={8}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Cor
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <motion.button
                      key={c.value}
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setColor(c.value)}
                      className={`w-12 h-12 rounded-xl ${c.class} border-2
                                ${color === c.value ? "border-blue-600 ring-4 ring-blue-200" : "border-neutral-300"}
                                transition`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Digite uma tag..."
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg
                             font-medium transition"
                  >
                    Adicionar
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <motion.span
                        key={tag}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100
                                 text-blue-700 rounded-full text-sm"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-blue-900"
                        >
                          ×
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg
                         font-medium transition"
              >
                Cancelar
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!title.trim() || !content.trim()}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white
                         rounded-lg font-medium shadow-lg hover:shadow-xl transition
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {note ? "Salvar" : "Criar Nota"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  );
}
