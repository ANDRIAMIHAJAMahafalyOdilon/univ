'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
};

export function TableSkeleton({ rows = 6, columns = 8 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columns }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-8 w-full rounded-lg" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
