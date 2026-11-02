import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind class merger — combines clsx + tailwind-merge */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Indian currency: ₹9,500 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/** Format a date as "14 Nov 2026" */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Format a date as "14 November 2026" */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Generate a booking ID like "BK-100003" */
export function generateBookingId(): string {
  const num = Date.now() % 1000000;
  return `BK-${String(num).padStart(6, '0')}`;
}

/** Generate an enquiry ID like "ENQ-4418" */
export function generateEnquiryId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `ENQ-${num}`;
}

/** Convert text to a URL-safe slug */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

/** Calculate the number of nights between two dates */
export function calculateNights(checkIn: string, checkOut: string): number {
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

/** Get an array of date strings between two dates (inclusive of checkIn, exclusive of checkOut) */
export function getDateRange(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const current = new Date(checkIn);
  const end = new Date(checkOut);
  while (current < end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/** Category display names */
export const CATEGORY_LABELS: Record<string, string> = {
  wedding: 'Wedding',
  room_booking: 'Room Booking',
  corporate_offsite: 'Corporate Offsite',
  complaint: 'Complaint',
  general: 'General',
};

/** Category colors for UI badges */
export const CATEGORY_COLORS: Record<string, string> = {
  wedding: 'bg-pink-100 text-pink-800',
  room_booking: 'bg-blue-100 text-blue-800',
  corporate_offsite: 'bg-purple-100 text-purple-800',
  complaint: 'bg-red-100 text-red-800',
  general: 'bg-gray-100 text-gray-800',
};

/** Source display names */
export const SOURCE_LABELS: Record<string, string> = {
  web_form: 'Website',
  email: 'Email',
  whatsapp: 'WhatsApp',
  phone: 'Phone',
};

/** Status display names */
export const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  in_progress: 'In Progress',
  replied: 'Replied',
  closed: 'Closed',
};

export const STATUS_COLORS: Record<string, string> = {
  new: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  replied: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};
