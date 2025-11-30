export default interface LocationUpdate {
  id: string;
  available: boolean;
  ticks: boolean;
  updateText: string | undefined;
  device: string;
  created: string;
}
