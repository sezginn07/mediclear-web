'use client';

import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthCard({ title, subtitle, children }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-[420px]"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              Medi<span className="text-primary">Clear</span>
            </span>
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          )}
          <div className="mt-6">{children}</div>
        </div>
      </motion.div>
    </div>
  );
}
