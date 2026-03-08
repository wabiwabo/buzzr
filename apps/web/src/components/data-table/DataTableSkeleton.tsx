import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { TableRow, TableCell } from '@/components/ui/table';

interface DataTableSkeletonProps {
  columnCount: number;
  rowCount?: number;
  hasCheckbox?: boolean;
}

export const DataTableSkeleton: React.FC<DataTableSkeletonProps> = ({
  columnCount,
  rowCount = 10,
  hasCheckbox = false,
}) => {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, i) => (
        <TableRow key={`skeleton-${i}`}>
          {hasCheckbox && (
            <TableCell className="w-10">
              <Skeleton className="h-4 w-4" />
            </TableCell>
          )}
          {Array.from({ length: columnCount }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-3/4" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};
