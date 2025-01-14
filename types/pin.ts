export interface Coordinates {
  longitude: number;
  latitude: number;
}

export interface Pin {
  id: string;
  coordinates: Coordinates;
  emoji: string;
  message: string;
  timestamp: number;
  [key: string]: unknown;
}

export type PinCreateInput = Omit<Pin, 'id' | 'timestamp'>;

export interface PinAction {
  type: string;
  payload: unknown;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
