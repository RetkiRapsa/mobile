import axios from 'axios';

import { getValidToken } from './auth';

const RETKIRAPSA_API_IP = process.env.EXPO_PUBLIC_RETKIRAPSA_API_IP || 'localhost';
const API_BASE = `http://${RETKIRAPSA_API_IP}:8080/api/locations`;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const isWrite =
    config.method === 'post' ||
    config.method === 'put' ||
    config.method === 'delete' ||
    config.method === 'patch';

  if (isWrite) {
    const token = await getValidToken();
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const apiGetLocationUpdates = async (id: string, limit = 20) =>
  api.get(`/${id}/updates`, { params: { limit } });

export const apiGetNearbyLocations = async (lat: number, lon: number, distance = 500, limit = 20) =>
  api.get(`/nearby`, {
    params: { lat, lon, distance, limit },
  });

export const apiCreateLocation = async (data: any) => api.post('', data);

export const apiCreateLocationUpdate = async (id: string, data: any) =>
  api.post(`/${id}/updates`, data);
