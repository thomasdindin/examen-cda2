import { Session } from './session.model';
import { User } from './user.model';

export type ReservationStatus = 'CONFIRMED' | 'CANCELLED';

export interface Reservation {
  id: string;
  userId: string;
  sessionId: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
  session?: Session;
  user?: User;
}
