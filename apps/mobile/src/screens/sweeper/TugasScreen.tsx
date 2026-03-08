import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import api from '../../services/api';
import { formatDate } from '../../utils/format';

interface Task {
  id: string;
  area_name?: string;
  areaName?: string;
  zone?: string;
  scheduled_time?: string;
  scheduledTime?: string;
  scheduled_date?: string;
  scheduledDate?: string;
  status?: string;
  description?: string;
}

const getStatusColor = (status?: string): string => {
  switch (status) {
    case 'completed':
      return '#52c41a';
    case 'in_progress':
      return '#1890ff';
    case 'pending':
      return '#fa8c16';
    case 'cancelled':
      return '#f5222d';
    default:
      return '#999';
  }
};

const getStatusLabel = (status?: string): string => {
  switch (status) {
    case 'completed':
      return 'Selesai';
    case 'in_progress':
      return 'Sedang Berjalan';
    case 'pending':
      return 'Menunggu';
    case 'cancelled':
      return 'Dibatalkan';
    default:
      return status || '-';
  }
};

export default function TugasScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get('/schedules/today');
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setTasks(data);

      const done = new Set<string>();
      data.forEach((t: Task) => {
        if (t.status === 'completed') {
          done.add(t.id);
        }
      });
      setCompletedIds(done);
    } catch {
      Alert.alert('Error', 'Gagal memuat tugas. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasks();
  }, [fetchTasks]);

  const toggleTask = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1890ff" />
      </View>
    );
  }

  const completedCount = completedIds.size;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#1890ff']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tugas Hari Ini</Text>
        <Text style={styles.headerSub}>
          {formatDate(new Date().toISOString())}
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressCard}>
        <Text style={styles.progressText}>
          {completedCount} / {tasks.length} tugas selesai
        </Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: tasks.length > 0
                  ? `${Math.round((completedCount / tasks.length) * 100)}%`
                  : '0%',
              },
            ]}
          />
        </View>
      </View>

      {tasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Tidak ada tugas untuk hari ini
          </Text>
        </View>
      ) : (
        tasks.map((task) => {
          const isDone = completedIds.has(task.id);
          const statusColor = isDone
            ? '#52c41a'
            : getStatusColor(task.status);

          return (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => toggleTask(task.id)}
              activeOpacity={0.7}
            >
              <View style={styles.taskRow}>
                <View
                  style={[
                    styles.checkbox,
                    isDone && styles.checkboxChecked,
                  ]}
                >
                  {isDone && <Text style={styles.checkmark}>&#10003;</Text>}
                </View>
                <View style={styles.taskContent}>
                  <View style={styles.taskHeader}>
                    <Text
                      style={[
                        styles.taskArea,
                        isDone && styles.taskAreaDone,
                      ]}
                    >
                      {task.area_name || task.areaName || 'Area'}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusColor + '18' },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: statusColor }]}
                      >
                        {isDone
                          ? 'Selesai'
                          : getStatusLabel(task.status)}
                      </Text>
                    </View>
                  </View>
                  {task.zone && (
                    <Text style={styles.taskZone}>Zona: {task.zone}</Text>
                  )}
                  <Text style={styles.taskTime}>
                    Target:{' '}
                    {task.scheduled_time || task.scheduledTime || '-'}
                  </Text>
                  {task.description && (
                    <Text style={styles.taskDesc} numberOfLines={2}>
                      {task.description}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  progressCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#52c41a',
    borderRadius: 4,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  taskRow: {
    flexDirection: 'row',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d9d9d9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#52c41a',
    borderColor: '#52c41a',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskArea: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  taskAreaDone: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  taskZone: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  taskTime: {
    fontSize: 13,
    color: '#1890ff',
    marginTop: 4,
  },
  taskDesc: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  bottomSpacer: {
    height: 24,
  },
});
