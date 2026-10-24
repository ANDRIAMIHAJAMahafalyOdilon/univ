'use client';

import { Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';

type DataTableToolbarProps = {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: ReactNode;
  actions?: ReactNode;
};

export function DataTableToolbar({
  searchPlaceholder = 'Rechercher…',
  searchValue,
  onSearchChange,
  filters,
  actions,
}: DataTableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="rounded-xl pl-9"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {filters}
        {actions}
      </div>
    </div>
  );
}
