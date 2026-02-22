import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  RejectOrganizerDto,
  ChangeUserStatusDto,
  UpdateUserDto,
  CreateUserDto,
  AdminUpdateEventDto,
  AdminUpdateContractStatusDto,
  AdminUpdateIcContractStatusDto,
  ResetPasswordDto,
} from './dto/approve-organizer.dto';

@Controller('admin')
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard(@Query('from') from?: string, @Query('to') to?: string) {
    return this.adminService.getDashboard(from, to);
  }

  // ─── Organizers ────────────────────────────────────────

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

  // ─── Users ────────────────────────────────────────

  @Get('users')
  listUsers(@Query() pagination: PaginationDto) {
    return this.adminService.listUsers(pagination);
  }

  @Get('users/:id')
  getUserDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Post('users')
  createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.createUser(dto, adminUserId);
  }

  @Patch('users/:id')
  updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.updateUser(id, dto, adminUserId);
  }

  @Patch('users/:id/approve')
  approveUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.approveUser(id, adminUserId);
  }

  @Patch('users/:id/status')
  changeUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeUserStatusDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.changeUserStatus(id, dto, adminUserId);
  }

  @Post('users/:id/reset-password')
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.resetPassword(id, dto, adminUserId);
  }

  @Delete('users/:id')
  deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.deleteUser(id, adminUserId);
  }

  // ─── Events ────────────────────────────────────────

  @Get('events')
  listAllEvents(@Query() pagination: PaginationDto) {
    return this.adminService.listAllEvents(pagination);
  }

  @Get('events/:id')
  getEventDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getEventDetail(id);
  }

  @Patch('events/:id')
  updateEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateEventDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.updateEvent(id, dto, adminUserId);
  }

  @Delete('events/:id')
  deleteEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.deleteEvent(id, adminUserId);
  }

  // ─── Contracts ────────────────────────────────────────

  @Get('contracts')
  listAllContracts(
    @Query() pagination: PaginationDto,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (startDate) pagination.startDate = startDate;
    if (endDate) pagination.endDate = endDate;
    return this.adminService.listAllContracts(pagination);
  }

  @Get('contracts/:id')
  getContractDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getContractDetail(id);
  }

  @Patch('contracts/:id')
  updateContractStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateContractStatusDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.updateContractStatus(id, dto, adminUserId);
  }

  // ─── IC Contracts ────────────────────────────────────────

  @Get('ic-contracts')
  listIcContracts(
    @Query() pagination: PaginationDto,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (startDate) pagination.startDate = startDate;
    if (endDate) pagination.endDate = endDate;
    return this.adminService.getIcContracts(pagination);
  }

  @Get('ic-contracts/:id')
  getIcContractDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getIcContractDetail(id);
  }

  @Patch('ic-contracts/:id/status')
  updateIcContractStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateIcContractStatusDto,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.adminService.updateIcContractStatus(id, dto, adminUserId);
  }

  // ─── Activity Logs ────────────────────────────────────────

  @Get('logs')
  getActivityLogs(@Query() pagination: PaginationDto) {
    return this.adminService.getActivityLogs(pagination);
  }
}
