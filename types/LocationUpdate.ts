export default interface LocationUpdate {
  id: string;
  available: boolean;
  ticks: boolean;
  updateText: string | undefined;
  device: string;
  created: string;
  username?: string; // Username of the person who created the update
}
