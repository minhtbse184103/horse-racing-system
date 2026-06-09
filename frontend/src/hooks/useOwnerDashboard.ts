import { useCallback, useEffect, useState } from 'react';
import { getOwnerDashboard } from '../services/ownerService';
import type { OwnerDashboardData } from '../types';

function getErrorText(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message || fallback : fallback;
}

export function useOwnerDashboard() {
  const [dashboard, setDashboard] = useState<OwnerDashboardData | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  const loadDashboard = useCallback(async () => {
    setIsDashboardLoading(true);
    setDashboardError('');

    try {
      const data = await getOwnerDashboard();
      setDashboard(data || null);
      return data || null;
    } catch (error) {
      setDashboardError(getErrorText(error, 'Không thể tải dashboard chủ ngựa.'));
      throw error;
    } finally {
      setIsDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard().catch(() => {});
  }, [loadDashboard]);

  return {
    dashboard,
    setDashboard,
    isDashboardLoading,
    dashboardError,
    loadDashboard
  };
}
