'use client';

import { useState } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
} from '@tanstack/react-table';

type UseClientTableProps<T> = {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  getRowId?: TableOptions<T>['getRowId'];
};

export function useClientTable<T>({
  data,
  columns,
  getRowId,
}: UseClientTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
    getRowId,
  });

  return {
    table,
    sorting,
    setSorting,
    globalFilter,
    setGlobalFilter,
    rowSelection,
    setRowSelection,
  };
}
