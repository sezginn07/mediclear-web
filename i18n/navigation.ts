import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Locale-aware wrappers around Next's navigation primitives.
// Use these instead of next/link and next/navigation so URLs stay prefixed
// with the active locale (/tr/..., /en/...).
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
