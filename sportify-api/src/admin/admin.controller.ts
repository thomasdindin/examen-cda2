import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Liste tous les utilisateurs' })
  getUsers() {
    return this.adminService.getUsers();
  }

  @Patch('users/:id')
  @ApiOperation({ summary: "Modifier le rôle ou le statut d'un utilisateur" })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserAdminDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Superviser toutes les séances' })
  getSessions() {
    return this.adminService.getSessions();
  }

  @Get('reservations')
  @ApiOperation({ summary: 'Superviser toutes les réservations' })
  getReservations() {
    return this.adminService.getReservations();
  }
}
