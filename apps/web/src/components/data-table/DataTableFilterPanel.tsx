import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FilterDef } from './types';

interface DataTableFilterPanelProps {
  filterDefs: FilterDef[];
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string | undefined) => void;
  onReset: () => void;
  onClose: () => void;
}

export const DataTableFilterPanel: React.FC<DataTableFilterPanelProps> = ({
  filterDefs,
  filters,
  onFilterChange,
  onReset,
  onClose,
}) => (
  <Card className="mb-3">
    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
      <CardTitle className="text-sm font-medium">Filter</CardTitle>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onReset}>
          Reset
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </CardHeader>
    <CardContent className="pb-4 px-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filterDefs.map((def) => (
          <div key={def.key}>
            <Label className="text-xs mb-1 block">{def.label}</Label>
            {def.type === 'select' || def.type === 'multi-select' ? (
              <Select
                value={filters[def.key] || ''}
                onValueChange={(v) => onFilterChange(def.key, v || undefined)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder={`Semua`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua</SelectItem>
                  {def.options?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : def.type === 'text' ? (
              <Input
                value={filters[def.key] || ''}
                onChange={(e) => onFilterChange(def.key, e.target.value || undefined)}
                placeholder={`Cari ${def.label.toLowerCase()}...`}
                className="h-8 text-sm"
              />
            ) : def.type === 'date-range' ? (
              <div className="flex gap-1">
                <Input
                  type="date"
                  value={filters[`${def.key}_from`] || ''}
                  onChange={(e) => onFilterChange(`${def.key}_from`, e.target.value || undefined)}
                  className="h-8 text-xs"
                />
                <Input
                  type="date"
                  value={filters[`${def.key}_to`] || ''}
                  onChange={(e) => onFilterChange(`${def.key}_to`, e.target.value || undefined)}
                  className="h-8 text-xs"
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
