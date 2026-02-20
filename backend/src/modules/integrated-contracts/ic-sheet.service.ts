import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { IcPartnerSheet, IcSheetStatus } from './entities/ic-partner-sheet.entity';
import { IcSheetColumn } from './entities/ic-sheet-column.entity';
import { IcSheetRow } from './entities/ic-sheet-row.entity';
import { IcConfig } from './entities/ic-config.entity';
import { Event } from '../events/entities/event.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { Organization, OrgStatus } from '../organizations/entities/organization.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateIcSheetDto } from './dto/create-ic-sheet.dto';
import { UpdateIcSheetDto } from './dto/update-ic-sheet.dto';
import { SaveSheetColumnsDto } from './dto/save-sheet-columns.dto';
import { SaveSheetRowsDto } from './dto/save-sheet-rows.dto';
import { ActivityLogService } from '../../shared/activity-log/activity-log.service';

@Injectable()
export class IcSheetService {
  constructor(
    @InjectRepository(IcPartnerSheet)
    private readonly sheetRepository: Repository<IcPartnerSheet>,
    @InjectRepository(IcSheetColumn)
    private readonly columnRepository: Repository<IcSheetColumn>,
    @InjectRepository(IcSheetRow)
    private readonly rowRepository: Repository<IcSheetRow>,
    @InjectRepository(IcConfig)
    private readonly configRepository: Repository<IcConfig>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepository: Repository<OrganizationMember>,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private async getOrgIdForUser(userId: string, requireApproved = false): Promise<string> {
    const membership = await this.memberRepository.findOne({
      where: { userId },
    });
    if (!membership) {
      throw new ForbiddenException('소속된 조직이 없습니다.');
    }
    if (requireApproved) {
      const org = await this.orgRepository.findOne({
        where: { id: membership.organizationId },
      });
      if (!org || org.status !== OrgStatus.APPROVED) {
        throw new ForbiddenException('조직이 아직 승인되지 않았습니다.');
      }
    }
    return membership.organizationId;
  }

  private async verifySheetOwner(sheetId: string, userId: string): Promise<IcPartnerSheet> {
    const orgId = await this.getOrgIdForUser(userId, true);
    const sheet = await this.sheetRepository.findOne({
      where: { id: sheetId },
      relations: ['columns', 'rows'],
    });
    if (!sheet) {
      throw new NotFoundException('시트를 찾을 수 없습니다.');
    }
    if (sheet.partnerId !== orgId) {
      throw new ForbiddenException('해당 시트에 대한 접근 권한이 없습니다.');
    }
    return sheet;
  }

  async create(userId: string, dto: CreateIcSheetDto): Promise<IcPartnerSheet> {
    const orgId = await this.getOrgIdForUser(userId, true);

    const config = await this.configRepository.findOne({
      where: { id: dto.configId },
    });
    if (!config) {
      throw new NotFoundException('통합 계약 설정을 찾을 수 없습니다.');
    }

    // Idempotent: return existing sheet if one exists for this config+partner
    const existing = await this.sheetRepository.findOne({
      where: { configId: dto.configId, partnerId: orgId },
    });
    if (existing) {
      return this.findOneById(existing.id);
    }

    // Auto-name: "품목(orgName)"
    const org = await this.orgRepository.findOne({ where: { id: orgId } });
    const categoryName = dto.categoryName || `품목(${org?.name || '업체'})`;

    const sheet = this.sheetRepository.create({
      configId: dto.configId,
      partnerId: orgId,
      categoryName,
      memo: dto.memo || null,
    });

    const saved = await this.sheetRepository.save(sheet);

    await this.activityLogService.log(
      'create_ic_sheet',
      `통합 계약 시트 "${categoryName}" 생성`,
      userId,
      'ic_partner_sheet',
      saved.id,
    );

    return this.findOneById(saved.id);
  }

  async findMySheets(userId: string, configId: string): Promise<IcPartnerSheet[]> {
    const orgId = await this.getOrgIdForUser(userId);

    return this.sheetRepository.find({
      where: { configId, partnerId: orgId },
      relations: ['columns', 'columns.apartmentType', 'rows'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOneById(id: string): Promise<IcPartnerSheet> {
    const sheet = await this.sheetRepository.findOne({
      where: { id },
      relations: ['columns', 'columns.apartmentType', 'rows', 'partner'],
    });
    if (!sheet) {
      throw new NotFoundException('시트를 찾을 수 없습니다.');
    }
    return sheet;
  }

  async update(id: string, userId: string, dto: UpdateIcSheetDto): Promise<IcPartnerSheet> {
    const sheet = await this.verifySheetOwner(id, userId);

    if (dto.categoryName !== undefined) sheet.categoryName = dto.categoryName;
    if (dto.memo !== undefined) sheet.memo = dto.memo;
    if (dto.status !== undefined) sheet.status = dto.status;

    await this.sheetRepository.save(sheet);
    return this.findOneById(id);
  }

  async saveColumns(
    sheetId: string,
    userId: string,
    dto: SaveSheetColumnsDto,
  ): Promise<IcSheetColumn[]> {
    await this.verifySheetOwner(sheetId, userId);

    // Delete existing columns and replace with new ones
    await this.columnRepository.delete({ sheetId });

    const columns = dto.columns.map((col, index) =>
      this.columnRepository.create({
        sheetId,
        apartmentTypeId: col.apartmentTypeId || null,
        customName: col.customName || null,
        columnType: col.columnType || 'amount',
        sortOrder: col.sortOrder ?? index,
      }),
    );

    return this.columnRepository.save(columns);
  }

  async saveRows(
    sheetId: string,
    userId: string,
    dto: SaveSheetRowsDto,
  ): Promise<IcSheetRow[]> {
    await this.verifySheetOwner(sheetId, userId);

    // Delete existing rows and replace with new ones
    await this.rowRepository.delete({ sheetId });

    const rows = dto.rows.map((row, index) =>
      this.rowRepository.create({
        sheetId,
        optionName: row.optionName,
        popupContent: row.popupContent || null,
        sortOrder: row.sortOrder ?? index,
        prices: row.prices || {},
        cellValues: row.cellValues || null,
      }),
    );

    return this.rowRepository.save(rows);
  }

  async addRow(
    sheetId: string,
    userId: string,
    row: { optionName: string; popupContent?: string; sortOrder?: number; prices?: Record<string, number>; cellValues?: Record<string, string> },
  ): Promise<IcSheetRow> {
    await this.verifySheetOwner(sheetId, userId);

    const newRow = this.rowRepository.create({
      sheetId,
      optionName: row.optionName,
      popupContent: row.popupContent || null,
      sortOrder: row.sortOrder ?? 0,
      prices: row.prices || {},
      cellValues: row.cellValues || null,
    });

    return this.rowRepository.save(newRow);
  }

  async updateRow(
    sheetId: string,
    rowId: string,
    userId: string,
    data: { optionName?: string; popupContent?: string; sortOrder?: number; prices?: Record<string, number>; cellValues?: Record<string, string> },
  ): Promise<IcSheetRow> {
    await this.verifySheetOwner(sheetId, userId);

    const row = await this.rowRepository.findOne({
      where: { id: rowId, sheetId },
    });
    if (!row) {
      throw new NotFoundException('행을 찾을 수 없습니다.');
    }

    if (data.optionName !== undefined) row.optionName = data.optionName;
    if (data.popupContent !== undefined) row.popupContent = data.popupContent;
    if (data.sortOrder !== undefined) row.sortOrder = data.sortOrder;
    if (data.prices !== undefined) row.prices = data.prices;
    if (data.cellValues !== undefined) row.cellValues = data.cellValues;

    return this.rowRepository.save(row);
  }

  async deleteRow(sheetId: string, rowId: string, userId: string): Promise<void> {
    await this.verifySheetOwner(sheetId, userId);

    const row = await this.rowRepository.findOne({
      where: { id: rowId, sheetId },
    });
    if (!row) {
      throw new NotFoundException('행을 찾을 수 없습니다.');
    }

    await this.rowRepository.remove(row);
  }

  // === Organizer sheet management ===

  private async verifyOrganizerAccessToSheet(
    sheetId: string,
    userId: string,
  ): Promise<IcPartnerSheet> {
    const sheet = await this.sheetRepository.findOne({
      where: { id: sheetId },
      relations: ['columns', 'columns.apartmentType', 'rows'],
    });
    if (!sheet) {
      throw new NotFoundException('시트를 찾을 수 없습니다.');
    }

    // Admin bypass
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user?.role === UserRole.ADMIN) {
      return sheet;
    }

    const orgId = await this.getOrgIdForUser(userId, true);
    const config = await this.configRepository.findOne({
      where: { id: sheet.configId },
    });
    if (!config) {
      throw new NotFoundException('설정을 찾을 수 없습니다.');
    }
    const event = await this.eventRepository.findOne({
      where: { id: config.eventId },
    });
    if (!event || event.organizerId !== orgId) {
      throw new ForbiddenException('해당 시트에 대한 주관사 권한이 없습니다.');
    }
    return sheet;
  }

  async findSheetsByConfigAsOrganizer(
    configId: string,
    userId: string,
  ): Promise<IcPartnerSheet[]> {
    const config = await this.configRepository.findOne({
      where: { id: configId },
    });
    if (!config) {
      throw new NotFoundException('설정을 찾을 수 없습니다.');
    }

    // Admin bypass
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user?.role !== UserRole.ADMIN) {
      const orgId = await this.getOrgIdForUser(userId, true);
      const event = await this.eventRepository.findOne({
        where: { id: config.eventId },
      });
      if (!event || event.organizerId !== orgId) {
        throw new ForbiddenException('해당 행사의 주관사만 조회할 수 있습니다.');
      }
    }

    return this.sheetRepository.find({
      where: { configId },
      relations: ['columns', 'columns.apartmentType', 'rows', 'partner'],
      order: { createdAt: 'ASC' },
    });
  }

  async saveColumnsAsOrganizer(
    sheetId: string,
    userId: string,
    dto: SaveSheetColumnsDto,
  ): Promise<IcSheetColumn[]> {
    await this.verifyOrganizerAccessToSheet(sheetId, userId);

    await this.columnRepository.delete({ sheetId });

    const columns = dto.columns.map((col, index) =>
      this.columnRepository.create({
        sheetId,
        apartmentTypeId: col.apartmentTypeId || null,
        customName: col.customName || null,
        columnType: col.columnType || 'amount',
        sortOrder: col.sortOrder ?? index,
      }),
    );

    return this.columnRepository.save(columns);
  }

  async saveRowsAsOrganizer(
    sheetId: string,
    userId: string,
    dto: SaveSheetRowsDto,
  ): Promise<IcSheetRow[]> {
    await this.verifyOrganizerAccessToSheet(sheetId, userId);

    await this.rowRepository.delete({ sheetId });

    const rows = dto.rows.map((row, index) =>
      this.rowRepository.create({
        sheetId,
        optionName: row.optionName,
        popupContent: row.popupContent || null,
        sortOrder: row.sortOrder ?? index,
        prices: row.prices || {},
        cellValues: row.cellValues || null,
      }),
    );

    return this.rowRepository.save(rows);
  }

  async updateSheetAsOrganizer(
    sheetId: string,
    userId: string,
    dto: UpdateIcSheetDto,
  ): Promise<IcPartnerSheet> {
    const sheet = await this.verifyOrganizerAccessToSheet(sheetId, userId);

    if (dto.categoryName !== undefined) sheet.categoryName = dto.categoryName;
    if (dto.memo !== undefined) sheet.memo = dto.memo;
    if (dto.status !== undefined) sheet.status = dto.status;

    await this.sheetRepository.save(sheet);
    return this.findOneById(sheetId);
  }
}
