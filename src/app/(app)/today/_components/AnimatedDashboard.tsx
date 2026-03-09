'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { staggerContainer, fadeInUp, fadeInScale, cardTap } from '@/lib/motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PackageCheck, Receipt, ChefHat, ShoppingCart } from 'lucide-react';

const iconMap = {
  PackageCheck,
  Receipt,
  ChefHat,
  ShoppingCart,
} as const;

export type IconName = keyof typeof iconMap;

// Animated container for staggered children
export function AnimatedContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated card wrapper
export function AnimatedCard({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      variants={fadeInUp}
      className={className}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

// Animated quick action button
interface QuickActionProps {
  href: string;
  icon: IconName;
  label: string;
  color: string;
}

export function AnimatedQuickAction({ href, icon, label, color }: QuickActionProps) {
  const Icon = iconMap[icon];
  return (
    <motion.div variants={fadeInScale} whileHover={{ scale: 1.03 }} whileTap={cardTap}>
      <Link
        href={href}
        className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow"
      >
        <div className={cn("size-10 rounded-xl flex items-center justify-center text-white", color)}>
          <Icon className="size-5" />
        </div>
        <span className="text-xs font-medium">{label}</span>
      </Link>
    </motion.div>
  );
}

// Animated stat card
export function AnimatedStatCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -2, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated link card
export function AnimatedLinkCard({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <motion.div variants={fadeInUp} whileHover={{ scale: 1.02 }} whileTap={cardTap}>
      <Link href={href} className={className}>
        {children}
      </Link>
    </motion.div>
  );
}

// Animated alert banner
export function AnimatedAlert({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
    >
      <Link href={href} className={className}>
        {children}
      </Link>
    </motion.div>
  );
}

// Animated header
export function AnimatedHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Number counter animation
export function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
    >
      {prefix}{value}{suffix}
    </motion.span>
  );
}
