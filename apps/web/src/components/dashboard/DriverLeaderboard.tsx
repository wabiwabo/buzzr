import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import api from '../../services/api';

interface DriverRecord {
  id: string;
  name: string;
  total_volume_kg: number;
}

interface DriverLeaderboardProps {
  loading?: boolean;
}

export const DriverLeaderboard: React.FC<DriverLeaderboardProps> = ({ loading: parentLoading }) => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/reports/driver-performance', {
          params: {
            from: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
            to: dayjs().format('YYYY-MM-DD'),
          },
        });
        setDrivers(Array.isArray(res.data) ? res.data.slice(0, 5) : []);
      } catch { /* empty */ }
      setLoading(false);
    };
    fetch();
  }, []);

  const maxVolume = Math.max(...drivers.map((d) => Number(d.total_volume_kg || 0)), 1);
  const isLoading = parentLoading || loading;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Top Driver</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : drivers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Belum ada data</p>
        ) : (
          drivers.map((d, i) => (
            <div
              key={d.id}
              className="flex items-center gap-3 py-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate('/fleet')}
            >
              <span className="w-5 text-xs text-muted-foreground text-center tabular-nums">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{d.name}</p>
                <Progress
                  value={Math.round((Number(d.total_volume_kg || 0) / maxVolume) * 100)}
                  className="h-1.5 mt-1"
                />
              </div>
              <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                {Number(d.total_volume_kg || 0).toLocaleString('id-ID')} kg
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
