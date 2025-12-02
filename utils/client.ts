import axios from 'axios';

const RETKIRAPSA_API_IP = process.env.EXPO_PUBLIC_RETKIRAPSA_API_IP || 'localhost';
const API_BASE = `http://${RETKIRAPSA_API_IP}:8080/api/locations`;

export const apiCreateLocation = async (data: any) =>
  axios.post(API_BASE, data, { headers: { 'Content-Type': 'application/json' } });

export const apiCreateLocationUpdate = async (id: string, data: any) =>
  axios.post(`${API_BASE}/${id}/updates`, data, {
    headers: { 'Content-Type': 'application/json' },
  });

export const apiGetLocationUpdates = async (id: string, limit = 20) =>
  axios.get(`${API_BASE}/${id}/updates`, { params: { limit } });

export const apiGetNearbyLocations = async (lat: number, lon: number, distance = 500, limit = 20) =>
  axios.get(`${API_BASE}/nearby`, {
    params: { lat, lon, distance, limit },
  });
