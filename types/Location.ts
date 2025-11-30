export default interface Location {
  id: string;
  available: boolean;
  ticks: boolean;
  name: string | undefined;
  type: string | undefined;
  latitude: number;
  longitude: number;
  timestamp: string;
  device: string;
}
