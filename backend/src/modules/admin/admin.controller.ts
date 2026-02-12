import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RejectOrganizerDto, ChangeUserStatusDto } from './dto/approve-organizer.dto';

@Controller('admin')
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('organizers')
  listOrganizers(@Query() pagination: PaginationDto) {
    return this.adminService.listOrganizers(pagination);
  }

  @Patch('organizers/:id/approve')
  approveOrganizer(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.approveOrganizer(id, adminUserId);
  }

  @Patch('organizers/:id/reject')
  rejectOrganizer(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminUserId: string,
    @Body() dto: RejectOrganizerDto,
  ) {
    return this.adminService.rejectOrganizer(id, adminUserId, dto);
  }

  @Get('users')
  listUsers(@Query() pagination: PaginationDto) {
    return this.adminService.listUsers(pagination);
  }

  @Patch('users/:id/status')
  changeUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeUserStatusDto,
  ) {
    return this.adminService.changeUserStatus(id, dto);
  }

  @Get('events')
  listAllEvents(@Query() pagination: PaginationDto) {
    return this.adminService.listAllEvents(pagination);
  }

  @Get('contracts')
  listAllContracts(@Query() pagination: PaginationDto) {
    return this.adminService.listAllContracts(pagination);
  }
}
