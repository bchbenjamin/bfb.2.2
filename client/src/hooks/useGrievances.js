import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client.js';

export function useGrievances(params = {}) {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchGrievances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (params.status) query.set('status', params.status);
      if (params.category) query.set('category', params.category);
      if (params.ward) query.set('ward', params.ward);
      if (params.sort) query.set('sort', params.sort);
      if (params.page) query.set('page', params.page);
      if (params.limit) query.set('limit', params.limit);

      const data = await apiFetch(`/api/grievances?${query}`);
      setGrievances(data.grievances);
      setPagination({ page: data.page, totalPages: data.totalPages, total: data.total });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params.status, params.category, params.ward, params.sort, params.page, params.limit]);

  useEffect(() => {
    fetchGrievances();
  }, [fetchGrievances]);

  return { grievances, loading, error, pagination, refetch: fetchGrievances };
}

export function useMapGrievances() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/grievances/map')
      .then(setGrievances)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { grievances, loading, refetch: () => apiFetch('/api/grievances/map').then(setGrievances) };
}
