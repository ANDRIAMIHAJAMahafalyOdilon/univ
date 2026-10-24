'use client';

import type { LucideIcon } from 'lucide-react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

type EntityEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function EntityEmptyState({ icon: Icon, title, description }: EntityEmptyStateProps) {
  return (
    <Empty className="border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon className="h-6 w-6" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
