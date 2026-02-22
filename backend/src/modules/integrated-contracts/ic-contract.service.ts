import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { IcContract, IcContractStatus } from './entities/ic-contract.entity';
import { IcConfig } from './entities/ic-config.entity';
import { IcPartnerSheet, IcSheetStatus } from './entities/ic-partner-sheet.entity';
import { IcSheetColumn } from './entities/ic-sheet-column.entity';
import { IcSheetRow } from './entities/ic-sheet-row.entity';
import { IcApartmentType } from './entities/ic-apartment-type.entity';
import { User } from '../users/entities/user.entity';
import { Event } from '../events/entities/event.entity';
import { OrganizationMember, MemberRole } from '../organizations/entities/organization-member.entity';
import { CreateIcContractDto } from './dto/create-ic-contract.dto';
import { generateShortCode } from '../../common/utils/code-generator';
import { ActivityLogService } from '../../shared/activity-log/activity-log.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class IcContractService {
  constructor(
    @InjectRepository(IcContract)
    private readonly contractRepository: Repository<IcContract>,
    @InjectRepository(IcConfig)
    private readonly configRepository: Repository<IcConfig>,
    @InjectRepository(IcPartnerSheet)
    private readonly sheetRepository: Repository<IcPartnerSheet>,
    @InjectRepository(IcSheetColumn)
    private readonly columnRepository: Repository<IcSheetColumn>,
    @InjectRepository(IcSheetRow)
    private readonly rowRepository: Repository<IcSheetRow>,
    @InjectRepository(IcApartmentType)
    private readonly apartmentTypeRepository: Repository<IcApartmentType>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepository: Repository<OrganizationMember>,
    private readonly activityLogService: ActivityLogService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * 데이터 병합: 행사의 모든 active 시트를 로드하여
   * partner → category → options 계층 구조로 그룹핑
   */
  async getContractFlow(eventId: string): Promise<{
    config: IcConfig;
    apartmentTypes: IcApartmentType[];
    partners: {
      partnerId: string;
      partnerName: string;
      categories: {
        sheetId: string;
        categoryName: string;
        columns: { id: string; apartmentTypeId: string; customName: string; columnType: string; sortOrder: number }[];
        options: {
          rowId: string;
          optionName: string;
          popupContent: string;
          sortOrder: number;
          prices: Record<string, number>;
          cellValues: Record<string, string>;
        }[];
      }[];
    }[];
  }> {
    const config = await this.configRepository.findOne({
      where: { eventId },
      relations: ['apartmentTypes'],
    });
    if (!config) {
      throw new NotFoundException('해당 행사의 통합 계약 설정을 찾을 수 없습니다.');
    }

    const sheets = await this.sheetRepository.find({
      where: { configId: config.id, status: In([IcSheetStatus.ACTIVE, IcSheetStatus.DRAFT]) },
      relations: ['columns', 'columns.apartmentType', 'rows', 'partner'],
      order: { createdAt: 'ASC' },
    });

    // Group by partner
    const partnerMap = new Map<string, {
      partnerId: string;
      partnerName: string;
      partnerItems: string;
      categories: typeof sheets extends (infer T)[] ? any[] : never;
    }>();

    for (const sheet of sheets) {
      const partnerId = sheet.partnerId;
      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, {
          partnerId,
          partnerName: sheet.partner?.name || '',
          partnerItems: sheet.partner?.items || '',
          categories: [],
        });
      }

      const columns = (sheet.columns || [])
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((col) => ({
          id: col.id,
          apartmentTypeId: col.apartmentTypeId,
          customName: col.customName,
          columnType: col.columnType || 'amount',
          sortOrder: col.sortOrder,
        }));

      const options = (sheet.rows || [])
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((row) => ({
          rowId: row.id,
          optionName: row.optionName,
          popupContent: row.popupContent,
          sortOrder: row.sortOrder,
          prices: row.prices || {},
          cellValues: row.cellValues || {},
        }));

      partnerMap.get(partnerId).categories.push({
        sheetId: sheet.id,
        categoryName: sheet.categoryName,
        columns,
        options,
      });
    }

    const apartmentTypes = (config.apartmentTypes || [])
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      config,
      apartmentTypes,
      partners: Array.from(partnerMap.values()),
    };
  }

  /**
   * 타입별 필터링: 특정 아파트 타입에 해당하는 column의 가격만 추출
   */
  async getContractFlowByType(eventId: string, typeId: string) {
    const flow = await this.getContractFlow(eventId);

    const filteredPartners = flow.partners.map((partner) => ({
      ...partner,
      categories: partner.categories.map((cat) => {
        // Find the column matching this apartment type
        const matchingColumn = cat.columns.find(
          (col) => col.apartmentTypeId === typeId,
        );

        return {
          ...cat,
          options: cat.options.map((opt) => ({
            ...opt,
            unitPrice: matchingColumn ? (opt.prices[matchingColumn.id] ?? null) : null,
            columnId: matchingColumn?.id || null,
          })),
        };
      }),
    }));

    return {
      ...flow,
      partners: filteredPartners,
      selectedTypeId: typeId,
    };
  }

  /**
   * 계약 생성: 선택 내역 스냅샷 + 결제 스케줄 자동 계산
   */
  async createContract(
    userId: string,
    dto: CreateIcContractDto,
  ): Promise<IcContract> {
    const config = await this.configRepository.findOne({
      where: { id: dto.configId },
    });
    if (!config) {
      throw new NotFoundException('통합 계약 설정을 찾을 수 없습니다.');
    }

    if (!dto.legalAgreed) {
      throw new BadRequestException('약관에 동의해야 합니다.');
    }

    // Resolve selected items to snapshot
    const selectedItems: IcContract['selectedItems'] = [];
    for (const item of dto.selectedItems) {
      const row = await this.rowRepository.findOne({
        where: { id: item.rowId },
        relations: ['sheet', 'sheet.partner'],
      });
      if (!row) {
        throw new NotFoundException(`옵션 "${item.rowId}"을 찾을 수 없습니다.`);
      }

      // Resolve price: check column type to avoid treating text values as prices
      let unitPrice = 0;
      if (item.columnId) {
        const column = await this.columnRepository.findOne({ where: { id: item.columnId } });
        const colType = column?.columnType || 'amount';
        if (colType === 'amount') {
          const cellVal = row.cellValues?.[item.columnId];
          unitPrice = cellVal !== undefined ? (Number(cellVal) || 0) : (row.prices?.[item.columnId] ?? 0);
        }
        // If text column or price is 0, try finding price from other amount columns in same sheet
        if (unitPrice === 0) {
          const amountColumns = await this.columnRepository.find({
            where: { sheetId: item.sheetId, columnType: 'amount' },
          });
          for (const amtCol of amountColumns) {
            const price = row.prices?.[amtCol.id] ?? 0;
            if (price > 0) { unitPrice = price; break; }
            const cv = row.cellValues?.[amtCol.id];
            if (cv !== undefined && Number(cv) > 0) { unitPrice = Number(cv); break; }
          }
        }
      }

      selectedItems.push({
        sheetId: item.sheetId,
        rowId: item.rowId,
        columnId: item.columnId,
        optionName: row.optionName,
        categoryName: row.sheet?.categoryName || '',
        partnerName: row.sheet?.partner?.name || '',
        unitPrice,
      });
    }

    // Calculate totalAmount
    const totalAmount = selectedItems.reduce((sum, item) => sum + item.unitPrice, 0);

    // Calculate payment schedule
    const paymentSchedule = this.calculatePaymentSchedule(
      totalAmount,
      config.paymentStages || [],
    );

    // Generate unique short code
    let shortCode = generateShortCode();
    let existing = await this.contractRepository.findOne({ where: { shortCode } });
    while (existing) {
      shortCode = generateShortCode();
      existing = await this.contractRepository.findOne({ where: { shortCode } });
    }

    // Get customer info
    const user = await this.userRepository.findOne({ where: { id: userId } });

    const contract = this.contractRepository.create({
      configId: dto.configId,
      apartmentTypeId: dto.apartmentTypeId,
      customerId: userId,
      customerName: dto.customerName || user?.name || null,
      customerPhone: dto.customerPhone || user?.phone || null,
      shortCode,
      selectedItems,
      totalAmount,
      paymentSchedule,
      legalAgreed: true,
      signatureData: dto.signatureData,
      unitNumber: dto.unitNumber || null,
      specialNotes: dto.specialNotes || null,
      status: IcContractStatus.SIGNED,
      signedAt: new Date(),
    });

    const saved = await this.contractRepository.save(contract);

    await this.activityLogService.log(
      'create_ic_contract',
      `통합 계약서 생성 (${shortCode})`,
      userId,
      'ic_contract',
      saved.id,
    );

    // Notify customer, partners, and organizer
    try {
      const customerName = dto.customerName || user?.name || '고객';
      const amountStr = totalAmount.toLocaleString();

      // 1. Customer notification
      await this.notificationsService.createNotification({
        userId,
        type: 'ic_contract_signed',
        title: '통합 계약서가 체결되었습니다',
        message: `계약번호: ${shortCode}, 총액: ${amountStr}원`,
        relatedId: saved.id,
        relatedType: 'ic_contract',
      });

      // 2. Partner notifications (unique partners from selected items)
      const partnerIds = [...new Set(selectedItems.map((item) => {
        // Find the sheet to get partnerId
        return item.sheetId;
      }))];
      const partnerSheets = await this.sheetRepository.find({
        where: partnerIds.map((sid) => ({ id: sid })),
      });
      const uniquePartnerOrgIds = [...new Set(partnerSheets.map((s) => s.partnerId))];

      for (const partnerOrgId of uniquePartnerOrgIds) {
        const partnerOwner = await this.memberRepository.findOne({
          where: { organizationId: partnerOrgId, role: MemberRole.OWNER },
        });
        if (partnerOwner) {
          await this.notificationsService.createNotification({
            userId: partnerOwner.userId,
            type: 'ic_contract_partner_notify',
            title: '새 통합 계약이 체결되었습니다',
            message: `${customerName}님이 통합 계약을 체결했습니다. 총액: ${amountStr}원 (${shortCode})`,
            relatedId: saved.id,
            relatedType: 'ic_contract',
          });
        }
      }

      // 3. Organizer notification
      const event = await this.eventRepository.findOne({ where: { id: config.eventId } });
      if (event) {
        const organizerOwner = await this.memberRepository.findOne({
          where: { organizationId: event.organizerId, role: MemberRole.OWNER },
        });
        if (organizerOwner) {
          await this.notificationsService.createNotification({
            userId: organizerOwner.userId,
            type: 'ic_contract_organizer_notify',
            title: '새 통합 계약이 체결되었습니다',
            message: `행사 "${event.name}"에서 ${customerName}님이 통합 계약을 체결했습니다. 총액: ${amountStr}원`,
            relatedId: saved.id,
            relatedType: 'ic_contract',
          });
        }
      }
    } catch {
      // Do not fail contract creation if notification fails
    }

    return this.findOneById(saved.id);
  }

  /**
   * 결제 스케줄 계산
   * 1. totalAmount × ratio / 100 → 반올림
   * 2. 마지막 단계에 반올림 차이 보정
   */
  private calculatePaymentSchedule(
    totalAmount: number,
    stages: { name: string; ratio: number }[],
  ): { name: string; ratio: number; amount: number }[] {
    if (!stages || stages.length === 0) {
      return [{ name: '일시불', ratio: 100, amount: totalAmount }];
    }

    const schedule = stages.map((stage) => ({
      name: stage.name,
      ratio: stage.ratio,
      amount: Math.round((totalAmount * stage.ratio) / 100),
    }));

    // Correct rounding difference in last stage
    const calculatedTotal = schedule.reduce((sum, s) => sum + s.amount, 0);
    const diff = totalAmount - calculatedTotal;
    if (diff !== 0 && schedule.length > 0) {
      schedule[schedule.length - 1].amount += diff;
    }

    return schedule;
  }

  async findOneById(id: string): Promise<IcContract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['config', 'config.event', 'apartmentType', 'customer'],
    });
    if (!contract) {
      throw new NotFoundException('통합 계약서를 찾을 수 없습니다.');
    }
    return contract;
  }

  async findByShortCode(shortCode: string): Promise<IcContract> {
    const contract = await this.contractRepository.findOne({
      where: { shortCode },
      relations: ['config', 'apartmentType', 'customer'],
    });
    if (!contract) {
      throw new NotFoundException('통합 계약서를 찾을 수 없습니다.');
    }
    return contract;
  }

  async findByEventId(eventId: string): Promise<IcContract[]> {
    const config = await this.configRepository.findOne({
      where: { eventId },
    });
    if (!config) {
      throw new NotFoundException('해당 행사의 통합 계약 설정을 찾을 수 없습니다.');
    }

    return this.contractRepository.find({
      where: { configId: config.id },
      relations: ['apartmentType', 'customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMyContracts(userId: string): Promise<IcContract[]> {
    return this.contractRepository.find({
      where: { customerId: userId },
      relations: ['config', 'config.event', 'apartmentType'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPartnerContracts(userId: string): Promise<IcContract[]> {
    // Find partner's org
    const membership = await this.memberRepository.findOne({ where: { userId } });
    if (!membership) return [];

    // Find sheets belonging to this partner
    const sheets = await this.sheetRepository.find({
      where: { partnerId: membership.organizationId },
    });
    if (sheets.length === 0) return [];

    const sheetIds = sheets.map((s) => s.id);

    // Find all contracts and filter those containing items from partner's sheets
    const configIds = [...new Set(sheets.map((s) => s.configId))];
    const contracts = await this.contractRepository.find({
      where: configIds.map((cid) => ({ configId: cid })),
      relations: ['config', 'config.event', 'apartmentType', 'customer'],
      order: { createdAt: 'DESC' },
    });

    return contracts.filter((c) =>
      c.selectedItems?.some((item) => sheetIds.includes(item.sheetId)),
    );
  }

  private async resolveEventIdByInviteCode(inviteCode: string): Promise<string> {
    const event = await this.eventRepository.findOne({
      where: { inviteCode },
    });
    if (!event) {
      throw new NotFoundException('해당 초대코드의 행사를 찾을 수 없습니다.');
    }
    return event.id;
  }

  async getContractFlowByInviteCode(inviteCode: string) {
    const eventId = await this.resolveEventIdByInviteCode(inviteCode);
    return this.getContractFlow(eventId);
  }

  async getContractFlowByInviteCodeAndType(inviteCode: string, typeId: string) {
    const eventId = await this.resolveEventIdByInviteCode(inviteCode);
    return this.getContractFlowByType(eventId, typeId);
  }
}
