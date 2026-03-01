import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('sr-RS', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

/**
 * Converts a local Serbian phone number to E.164 international format.
 * Examples:
 *   "0641234567"    → "+381641234567"
 *   "064 123 4567"  → "+381641234567"
 *   "+381641234567" → "+381641234567"  (unchanged)
 */
export function toE164Serbian(local: string): string {
  const digits = local.replace(/\D/g, '')
  if (digits.startsWith('381')) return `+${digits}`
  if (digits.startsWith('0')) return `+381${digits.slice(1)}`
  return `+381${digits}`
}

/**
 * Formats an E.164 Serbian number for display.
 * Example: "+381641234567" → "064 123 4567"
 */
export function formatSerbianPhone(e164: string): string {
  const local = e164.replace(/^\+381/, '0')
  if (local.length === 10) {
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
  }
  return local
}

/**
 * Returns true if the string is a valid Serbian mobile number in E.164 format.
 * Serbian mobile prefixes: 060, 061, 062, 063, 064, 065, 066, 067, 069
 */
export function isValidSerbianMobile(e164: string): boolean {
  return /^\+3816[0-79]\d{7}$/.test(e164)
}
