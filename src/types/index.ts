export type RacerStatus = 'active' | 'injured' | 'finished';

export interface Racer {
  id: string;
  name: string;
  color: string;
  baseSpeed: number;
  currentSpeed: number;
  progress: number; // 0.0 to 1.0 per lap
  totalDistance: number; // Cumulative distance
  laps: number;
  status: RacerStatus;
}

export interface RaceState {
  racers: Racer[];
  isRacing: boolean;
  winnerId: string | null;
}