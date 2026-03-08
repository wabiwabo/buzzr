import React, { useState, useCallback } from 'react';
import { Search, MapPin, Car, AlertTriangle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import api from '../../services/api';

interface SearchResult {
  type: 'tps' | 'fleet' | 'complaint' | 'user';
  id: string;
  title: string;
  subtitle?: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; path: string }> = {
  tps: { icon: <MapPin className="h-3.5 w-3.5 text-positive" />, color: 'bg-positive/10 text-positive', path: '/tps' },
  fleet: { icon: <Car className="h-3.5 w-3.5 text-info" />, color: 'bg-info/10 text-info', path: '/fleet' },
  complaint: { icon: <AlertTriangle className="h-3.5 w-3.5 text-warning" />, color: 'bg-warning/10 text-warning', path: '/complaints' },
  user: { icon: <Users className="h-3.5 w-3.5 text-purple-500" />, color: 'bg-purple-500/10 text-purple-600', path: '/users' },
};

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = useCallback(
    async (value: string) => {
      setQuery(value);
      if (value.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }

      try {
        const [tpsRes, usersRes] = await Promise.allSettled([
          api.get('/tps', { params: {} }),
          api.get('/users', { params: {} }),
        ]);

        const all: SearchResult[] = [];
        const lower = value.toLowerCase();

        if (tpsRes.status === 'fulfilled') {
          const tpsList = Array.isArray(tpsRes.value.data) ? tpsRes.value.data : [];
          tpsList
            .filter((t: any) => t.name?.toLowerCase().includes(lower) || t.address?.toLowerCase().includes(lower))
            .slice(0, 3)
            .forEach((t: any) => all.push({ type: 'tps', id: t.id, title: t.name, subtitle: t.address }));
        }

        if (usersRes.status === 'fulfilled') {
          const usersList = Array.isArray(usersRes.value.data) ? usersRes.value.data : [];
          usersList
            .filter((u: any) => u.name?.toLowerCase().includes(lower) || u.email?.toLowerCase().includes(lower))
            .slice(0, 3)
            .forEach((u: any) => all.push({ type: 'user', id: u.id, title: u.name, subtitle: u.email || u.phone }));
        }

        setResults(all);
        setOpen(all.length > 0);
      } catch {
        setResults([]);
      }
    },
    [],
  );

  return (
    <Popover open={open && results.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari TPS, pengguna, laporan..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 rounded-full h-8 text-sm"
            id="global-search-input"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-1" align="start">
        {results.map((r) => {
          const config = typeConfig[r.type];
          return (
            <button
              key={r.id}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-muted/50 transition-colors text-left"
              onClick={() => {
                navigate(config.path);
                setOpen(false);
                setQuery('');
              }}
            >
              {config.icon}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{r.title}</p>
                {r.subtitle && <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>}
              </div>
              <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                {r.type.toUpperCase()}
              </Badge>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};
