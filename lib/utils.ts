import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PRIORITIES = {
  critical: {
    rank: 4,
    hex: "#ef4444",
    cls: "bg-red-100 text-red-800 border-red-200",
  },
  high: {
    rank: 3,
    hex: "#f97316",
    cls: "bg-orange-100 text-orange-800 border-orange-200",
  },
  medium: {
    rank: 2,
    hex: "#eab308",
    cls: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  low: {
    rank: 1,
    hex: "#3b82f6",
    cls: "bg-blue-100 text-blue-800 border-blue-200",
  },
} as const;

export type Priority = keyof typeof PRIORITIES;
