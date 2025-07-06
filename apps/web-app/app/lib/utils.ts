import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并多个类名，解决类名冲突问题
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
