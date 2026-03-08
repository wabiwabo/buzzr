import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import api from '../../services/api';
import { ProgressRing } from '../common';

interface PerformanceData {
  collectionRate: number;
  slaCompliance: number;
  tpsCapacity: number;
}

interface AreaCollectionChartProps {
  loading?: boolean;
}

export const AreaCollectionChart: React.FC<AreaCollectionChartProps> = ({ loading: parentLoading }) => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/reports/dashboard');
        if (res.data?.current) {
          const tps = await api.get('/tps').catch(() => ({ data: [] }));
          const tpsList = Array.isArray(tps.data) ? tps.data : [];
          const totalCap = tpsList.reduce((s: number, t: any) => s + Number(t.capacity_tons || 0), 0);
          const totalLoad = tpsList.reduce((s: number, t: any) => s + Number(t.current_load_tons || 0), 0);
          setData({
            collectionRate: res.data.current.collectionRate || 0,
            slaCompliance: 0,
            tpsCapacity: totalCap > 0 ? Math.round((totalLoad / totalCap) * 100) : 0,
          });
        }
      } catch { /* silent */ }
      setLoading(false);
    };
    fetch();
  }, []);

  const isLoading = parentLoading || loading;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Ringkasan Performa</CardTitle>
          {!data && !isLoading && (
            <span className="text-xs text-muted-foreground">Data belum tersedia</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-around py-6">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-20 rounded-full" />)}
          </div>
        ) : (
          <div className="flex justify-around py-6">
            <ProgressRing value={data?.collectionRate ?? 0} label="Collection Rate" />
            <ProgressRing value={data?.slaCompliance ?? 0} label="SLA Compliance" />
            <ProgressRing value={data?.tpsCapacity ?? 0} label="Kapasitas TPS" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
