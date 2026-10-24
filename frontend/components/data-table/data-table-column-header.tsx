'use client';

import type { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props<TData, TValue> = {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
};

export function DataTableColumnHeader<TData, TValue>({ column, title, className }: Props<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span className={cn(className)}>{title}</span>;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('-ml-3 h-8 rounded-lg px-2 font-medium hover:bg-muted/80', className)}
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      <span>{title}</span>
      {column.getIsSorted() === 'desc' ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : column.getIsSorted() === 'asc' ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  );
}
