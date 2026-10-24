'use client';

import { type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  className?: string;
  delay?: number;
};

export function StatCard({ title, value, subtitle, icon: Icon, className, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -2 }}
      className="h-full"
    >
      <Card
        className={cn(
          'h-full gap-2 border-border/60 bg-card/80 py-3 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md',
          className
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 px-3 pb-0">
          <p className="min-w-0 text-xs font-medium leading-tight text-muted-foreground">{title}</p>
          <div className="shrink-0 rounded-md bg-primary/10 p-1.5 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </div>
        </CardHeader>
        <CardContent className="px-3">
          <p className="text-2xl font-semibold leading-tight tracking-tight text-foreground">{value}</p>
          {subtitle ? <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{subtitle}</p> : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
