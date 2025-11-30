export default interface SpotUpdate {
  id: string;
  available: boolean;
  ticks: boolean;
  updateText: string | undefined;
  device: string;
  created: string;
}
