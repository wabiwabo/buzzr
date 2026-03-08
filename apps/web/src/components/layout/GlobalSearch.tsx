import React, { useState, useCallback } from 'react';
import { Input, Dropdown, Typography, Space, Tag } from 'antd';
import {
  SearchOutlined, EnvironmentOutlined, CarOutlined,
  AlertOutlined, TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Text } = Typography;

interface SearchResult {
  type: 'tps' | 'fleet' | 'complaint' | 'user';
  id: string;
  title: string;
  subtitle?: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; path: string }> = {
  tps: { icon: <EnvironmentOutlined />, color: 'green', path: '/tps' },
  fleet: { icon: <CarOutlined />, color: 'blue', path: '/fleet' },
  complaint: { icon: <AlertOutlined />, color: 'orange', path: '/complaints' },
  user: { icon: <TeamOutlined />, color: 'purple', path: '/users' },
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

  const menuItems = results.map((r) => {
    const config = typeConfig[r.type];
    return {
      key: r.id,
      label: (
        <Space>
          {config.icon}
          <div>
            <Text style={{ fontSize: 13 }}>{r.title}</Text>
            {r.subtitle && <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>{r.subtitle}</Text>}
          </div>
          <Tag color={config.color} style={{ marginLeft: 'auto', fontSize: 10 }}>{r.type.toUpperCase()}</Tag>
        </Space>
      ),
      onClick: () => {
        navigate(config.path);
        setOpen(false);
        setQuery('');
      },
    };
  });

  return (
    <Dropdown
      menu={{ items: menuItems }}
      open={open && results.length > 0}
      onOpenChange={setOpen}
    >
      <Input
        placeholder="Cari TPS, pengguna, laporan..."
        prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.3)' }} />}
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        allowClear
        onClear={() => { setQuery(''); setResults([]); setOpen(false); }}
        style={{ width: 320, borderRadius: 20 }}
        id="global-search-input"
      />
    </Dropdown>
  );
};
