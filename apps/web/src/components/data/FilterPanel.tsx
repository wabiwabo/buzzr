import React from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { FilterDef } from '../../hooks/useTableState';

interface FilterPanelProps {
  filters: FilterDef[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onReset: () => void;
  onClose: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  values,
  onChange,
  onReset,
  onClose,
}) => (
  <Card className="mb-4">
    <CardHeader className="pb-3 flex-row items-center justify-between">
      <CardTitle className="text-sm font-medium">Filter Lanjutan</CardTitle>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filters.map((filter) => (
          <div key={filter.key}>
            <label className="text-xs text-muted-foreground mb-1 block">{filter.label}</label>
            {filter.type === 'select' && filter.options && (
              <Select
                value={values[filter.key] || ''}
                onValueChange={(val) => onChange(filter.key, val || undefined)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder={`Pilih ${filter.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {filter.type === 'date-range' && (
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                  value={values[filter.key]?.[0] || ''}
                  onChange={(e) => onChange(filter.key, [e.target.value, values[filter.key]?.[1] || ''])}
                />
                <input
                  type="date"
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                  value={values[filter.key]?.[1] || ''}
                  onChange={(e) => onChange(filter.key, [values[filter.key]?.[0] || '', e.target.value])}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={onReset}>Reset</Button>
        <Button size="sm" onClick={onClose}>Terapkan</Button>
      </div>
    </CardContent>
  </Card>
);
