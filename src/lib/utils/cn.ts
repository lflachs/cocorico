import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 * Used throughout the app for conditional className composition
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
