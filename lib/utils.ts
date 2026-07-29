import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  differenceInCalendarDays,
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  isToday,
  startOfDay,
} from "date-fns";
import { id } from "date-fns/locale";

export type ReminderLevel = "OVERDUE" | "TODAY" | "SOON" | "NONE";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return format(new Date(date), "dd MMM yyyy", { locale: id });
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "dd MMM yyyy, HH:mm", { locale: id });
}

export function formatRelative(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function isOverdue(deadline: Date | string): boolean {
  const d = new Date(deadline);
  return isBefore(d, new Date()) && !isToday(d);
}

export function isDueSoon(deadline: Date | string): boolean {
  const d = new Date(deadline);
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  return isAfter(d, new Date()) && isBefore(d, threeDaysFromNow);
}

export function getDeadlineReminderLevel(deadline: Date | string): ReminderLevel {
  const targetDate = startOfDay(new Date(deadline));
  if (Number.isNaN(targetDate.getTime())) {
    return "NONE";
  }

  const today = startOfDay(new Date());
  const daysDiff = differenceInCalendarDays(targetDate, today);

  if (daysDiff < 0) return "OVERDUE";
  if (daysDiff === 0) return "TODAY";
  if (daysDiff <= 3) return "SOON";
  return "NONE";
}

export function getDeadlineReminderLabel(deadline: Date | string): string {
  const level = getDeadlineReminderLevel(deadline);

  if (level === "OVERDUE") return "Terlambat";
  if (level === "TODAY") return "Hari ini";
  if (level === "SOON") {
    const targetDate = startOfDay(new Date(deadline));
    const today = startOfDay(new Date());
    const daysDiff = differenceInCalendarDays(targetDate, today);
    return `H-${daysDiff}`;
  }

  return "Nanti";
}

export function formatFileSize2(bytes: number): string {
  return formatFileSize(bytes);
}

export function getFileIcon(fileType: string): string {
  if (fileType.includes("pdf")) return "FileText";
  if (fileType.includes("image")) return "Image";
  if (fileType.includes("word") || fileType.includes("document")) return "FileText";
  if (fileType.includes("presentation") || fileType.includes("ppt")) return "Presentation";
  if (fileType.includes("spreadsheet") || fileType.includes("excel")) return "Table";
  if (fileType.includes("zip") || fileType.includes("rar")) return "Archive";
  return "File";
}
