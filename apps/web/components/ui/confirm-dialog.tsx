"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      iconBg: "bg-red-500/10",
      iconColor: "text-red-400",
      confirmBg: "bg-red-500 hover:bg-red-400",
    },
    warning: {
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400",
      confirmBg: "bg-orange-500 hover:bg-orange-400",
    },
    info: {
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      confirmBg: "bg-blue-500 hover:bg-blue-400",
    },
  };

  const style = variantStyles[variant];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Content */}
              <div className="p-6">
                <div className="flex gap-4">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full ${style.iconBg}
                               flex items-center justify-center`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-6 w-6 ${style.iconColor}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      {title}
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-neutral-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-white border border-neutral-300 text-neutral-700
                           hover:bg-neutral-50 rounded-lg font-medium transition"
                >
                  {cancelLabel}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`px-6 py-2 ${style.confirmBg} text-white rounded-lg
                            font-medium transition shadow-md hover:shadow-lg`}
                >
                  {confirmLabel}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
