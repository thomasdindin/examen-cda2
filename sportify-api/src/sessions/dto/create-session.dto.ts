import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ example: 'Coaching musculation' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Séance force débutant' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-05-01T10:00:00.000Z' })
  @IsDateString()
  startAt: string;

  @ApiProperty({ example: '2026-05-01T11:00:00.000Z' })
  @IsDateString()
  endAt: string;

  @ApiProperty({ example: 8 })
  @IsInt()
  @Min(1)
  maxParticipants: number;

  @ApiPropertyOptional({
    description: 'Admin seulement : assigner la séance à un coach spécifique',
  })
  @IsOptional()
  @IsUUID()
  coachId?: string;
}
