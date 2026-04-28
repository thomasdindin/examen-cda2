import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SearchSessionsDto } from './dto/search-sessions.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste et recherche des séances (paginé)' })
  findAll(@Query() query: SearchSessionsDto) {
    return this.sessionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une séance" })
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une séance (COACH / ADMIN)' })
  create(@Body() dto: CreateSessionDto, @CurrentUser() user: JwtUser) {
    return this.sessionsService.create(dto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier une séance (coach propriétaire / ADMIN)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.sessionsService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Supprimer une séance (coach propriétaire / ADMIN)',
  })
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.sessionsService.remove(id, user);
  }

  @Get(':id/participants')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Participants d'une séance (coach propriétaire / ADMIN)",
  })
  getParticipants(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.sessionsService.getParticipants(id, user);
  }
}
