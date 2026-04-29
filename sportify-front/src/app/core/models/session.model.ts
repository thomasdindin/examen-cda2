export interface SessionCoach {
  id: string;
  firstname: string;
  lastname: string;
}

export interface Session {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  maxParticipants: number;
  reservedPlaces: number;
  availablePlaces: number;
  coachId: string;
  coach: SessionCoach;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionDto {
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  maxParticipants: number;
  coachId?: string;
}

export interface SessionSearchParams {
  search?: string;
  coachId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedSessions {
  data: Session[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
