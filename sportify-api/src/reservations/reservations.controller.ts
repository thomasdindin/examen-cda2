import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Reservations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post('sessions/:sessionId/reservations')
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Réserver une séance (CLIENT uniquement)' })
  create(@Param('sessionId') sessionId: string, @CurrentUser() user: JwtUser) {
    return this.reservationsService.create(sessionId, user);
  }

  @Get('reservations/me')
  @ApiOperation({ summary: 'Mes réservations' })
  findMine(@CurrentUser() user: JwtUser) {
    return this.reservationsService.findMine(user.sub);
  }

  @Delete('reservations/:id')
  @ApiOperation({ summary: 'Annuler une réservation' })
  cancel(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.reservationsService.cancel(id, user);
  }
}
