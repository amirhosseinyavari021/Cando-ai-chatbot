// src/utils/cn.ts
// Utility function for conditional className merging (like clsx / tailwind-merge)

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
