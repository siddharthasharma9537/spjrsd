import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Roughly whether a post overflows a 6-line preview (line-clamp-6) in a list.
export function isLong(text) {
  return !!text && (text.split('\n').length > 6 || text.length > 420);
}
