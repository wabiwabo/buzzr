import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SavedViewList } from './SavedViewList';
import { FacetGroup } from './FacetGroup';

interface FacetCount {
  value: string;
  count: number;
  checked: boolean;
}

interface FacetDef {
  key: string;
  label: string;
  labelMap?: Record<string, string>;
  searchable?: boolean;
}

interface FilterSidebarProps {
  views: Array<{ id: string; name: string; filters: Record<string, string[]> }>;
  activeViewId: string | null;
  onSelectView: (id: string) => void;
  onCreateView?: () => void;
  viewCounts?: Record<string, number>;
  facets: FacetDef[];
  facetCounts: Record<string, FacetCount[]>;
  onToggleFilter: (dimensionKey: string, value: string) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export function FilterSidebar({
  views,
  activeViewId,
  onSelectView,
  onCreateView,
  viewCounts,
  facets,
  facetCounts,
  onToggleFilter,
  onResetFilters,
  hasActiveFilters,
}: FilterSidebarProps) {
  return (
    <ScrollArea className="h-full">
      <SavedViewList
        views={views}
        activeViewId={activeViewId}
        onSelectView={onSelectView}
        onCreateView={onCreateView}
        counts={viewCounts}
      />

      <Separator />

      {facets.map((facet) => (
        <FacetGroup
          key={facet.key}
          label={facet.label}
          counts={facetCounts[facet.key] || []}
          onToggle={(value) => onToggleFilter(facet.key, value)}
          labelMap={facet.labelMap}
          searchable={facet.searchable}
        />
      ))}

      {hasActiveFilters && (
        <div className="px-3 py-2">
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={onResetFilters}>
            Reset Filter
          </Button>
        </div>
      )}
    </ScrollArea>
  );
}
