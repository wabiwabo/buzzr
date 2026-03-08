import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Tag } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import { StatCard } from '../common';

const { Title, Text } = Typography;

interface ScheduleRecord {
  id: string;
  route_name: string;
  schedule_type: string;
  scheduled_date: string | null;
  start_time: string;
  status: string;
  stop_count?: number;
}

interface ComplaintRecord {
  id: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
}

interface OperationalDashboardProps {
  role: string;
}

export const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ role }) => {
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        api.get('/schedules'),
        api.get('/complaints'),
      ]);
      if (results[0].status === 'fulfilled') {
        setSchedules(Array.isArray(results[0].value.data) ? results[0].value.data : []);
      }
      if (results[1].status === 'fulfilled') {
        setComplaints(
          (Array.isArray(results[1].value.data) ? results[1].value.data : [])
            .filter((c: ComplaintRecord) => ['submitted', 'assigned', 'in_progress'].includes(c.status))
            .slice(0, 5)
        );
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const todaySchedules = schedules.filter((s) =>
    s.schedule_type === 'recurring' || s.scheduled_date === dayjs().format('YYYY-MM-DD')
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Tugas Hari Ini</Title>
        <Text type="secondary">{dayjs().format('dddd, D MMMM YYYY')}</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <StatCard title="Rute Hari Ini" value={todaySchedules.length} prefix={<EnvironmentOutlined style={{ color: '#3B82F6' }} />} loading={loading} />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title="TPS Dikunjungi" value={todaySchedules.reduce((sum, s) => sum + (s.stop_count || 0), 0)} prefix={<CheckCircleOutlined style={{ color: '#22C55E' }} />} loading={loading} />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title="Keluhan Ditugaskan" value={complaints.length} prefix={<ClockCircleOutlined style={{ color: '#F59E0B' }} />} loading={loading} />
        </Col>
      </Row>

      <Card title="Jadwal Hari Ini" size="small" loading={loading} style={{ marginBottom: 24 }}>
        {todaySchedules.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <Text type="secondary">Tidak ada jadwal hari ini</Text>
          </div>
        ) : (
          todaySchedules.map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
              <Text strong style={{ width: 50, fontSize: 13, color: '#6B7280' }}>{s.start_time}</Text>
              <div style={{ flex: 1 }}>
                <Text style={{ fontSize: 13 }}>{s.route_name}</Text>
              </div>
              <Tag color={s.status === 'in_progress' ? 'blue' : s.status === 'completed' ? 'green' : 'default'}>
                {s.status === 'in_progress' ? 'Dalam Proses' : s.status === 'completed' ? 'Selesai' : 'Menunggu'}
              </Tag>
            </div>
          ))
        )}
      </Card>

      {complaints.length > 0 && (
        <Card title="Keluhan Ditugaskan" size="small" loading={loading}>
          {complaints.map((c) => (
            <div key={c.id} style={{ padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
              <Text style={{ fontSize: 13 }}>{c.description?.slice(0, 80) || c.category}</Text>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  SLA: {Math.max(0, 72 - dayjs().diff(dayjs(c.created_at), 'hour'))} jam tersisa
                </Text>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};
