import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function computeCardPerformance(card: {
  dueAt?: Date | null;
  checklists: { items: { done: boolean }[] }[];
}) {
  const total = card.checklists.reduce((acc, cl) => acc + cl.items.length, 0) || 1;
  const done = card.checklists.reduce(
    (acc, cl) => acc + cl.items.filter((i) => i.done).length,
    0
  );
  const pct = Math.round((done / total) * 100);
  const overdue = card.dueAt ? Date.now() > new Date(card.dueAt).getTime() : false;

  return { pct, overdue, total, done };
}