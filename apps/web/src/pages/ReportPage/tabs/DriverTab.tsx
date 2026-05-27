import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  useReactTable, getCoreRowModel, getSortedRowModel, flexRender,
  createColumnHelper, type SortingState,
} from '@tanstack/react-table';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTableColumnHeader } from '@/components/data-table';
import { EmptyState } from '@/components/common/EmptyState';
import { useReportPageStore } from '../store';
import { fetchDriverPerformance } from '../api';
import type { DriverPerf } from '../types';
import { formatKg } from '../types';

const driverColumnHelper = createColumnHelper<DriverPerf>();

const driverColumns = [
  driverColumnHelper.accessor('name', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
    cell: (info) => <span className="text-sm font-medium">{info.getValue()}</span>,
  }),
  driverColumnHelper.accessor('total_trips', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total Trip" />,
    cell: (info) => <span className="text-sm tabular-nums">{info.getValue()}</span>,
  }),
  driverColumnHelper.accessor('total_checkpoints', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Checkpoint" />,
    cell: (info) => <span className="text-sm tabular-nums">{info.getValue()}</span>,
  }),
  driverColumnHelper.accessor('total_volume_kg', {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Volume (kg)" />,
    cell: (info) => <span className="text-sm tabular-nums font-medium">{formatKg(Number(info.getValue() || 0))}</span>,
  }),
];

export const DriverTab: React.FC = () => {
  const { from, to } = useReportPageStore();
  const [data, setData] = useState<DriverPerf[]>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'total_volume_kg', desc: true }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDriverPerformance(from, to)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((err) => {
        if (!cancelled) toast.error(err?.response?.data?.message || 'Gagal memuat performa driver');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [from, to]);

  const totalVolume = useMemo(() => data.reduce((s, d) => s + d.total_volume_kg, 0), [data]);

  const table = useReactTable({
    data,
    columns: driverColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-sm text-muted-foreground">
            {data.length} pengemudi · Total volume: <span className="tabular-nums font-medium text-foreground">{formatKg(totalVolume)} kg</span>
          </p>
        </div>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={driverColumns.length} className="h-48">
                      <EmptyState type="no-data" title="Tidak ada data" description="Belum ada data performa driver untuk rentang ini" />
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((c) => (
                        <TableCell key={c.id}>
                          {flexRender(c.column.columnDef.cell, c.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
