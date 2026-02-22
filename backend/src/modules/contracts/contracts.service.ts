import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Contract, ContractStatus } from './entities/contract.entity';
import { ContractTemplate } from './entities/contract-template.entity';
import { ContractField } from './entities/contract-field.entity';
import { ContractFieldValue } from './entities/contract-field-value.entity';
import { ContractHistory } from './entities/contract-history.entity';
import { OrganizationMember } from '../organizations/entities/organization-member.entity';
import { Organization, OrgStatus } from '../organizations/entities/organization.entity';
import { EventPartner, EventPartnerStatus } from '../events/entities/event-partner.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { CancelContractDto } from './dto/cancel-contract.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { SaveFieldsDto } from './dto/save-fields.dto';
import { FillContractDto } from './dto/fill-contract.dto';
import {
  generateContractNumber,
  generateQRCode,
  generateShortCode,
} from '../../common/utils/code-generator';
import { ActivityLogService } from '../../shared/activity-log/activity-log.service';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(ContractTemplate)
    private readonly templateRepository: Repository<ContractTemplate>,
    @InjectRepository(ContractField)
    private readonly fieldRepository: Repository<ContractField>,
    @InjectRepository(ContractFieldValue)
    private readonly fieldValueRepository: Repository<ContractFieldValue>,
    @InjectRepository(ContractHistory)
    private readonly historyRepository: Repository<ContractHistory>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepository: Repository<OrganizationMember>,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    @InjectRepository(EventPartner)
    private readonly eventPartnerRepository: Repository<EventPartner>,
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
        throw new ForbiddenException('조직이 아직 승인되지 않았습니다. 관리자 승인 후 이용 가능합니다.');
      }
    }

    return membership.organizationId;
  }

  // ---------- Contract CRUD ----------

  async createContract(
    userId: string,
    dto: CreateContractDto,
  ): Promise<Contract> {
    const orgId = await this.getOrgIdForUser(userId, true);

    // Verify partner is approved for this event
    const eventPartner = await this.eventPartnerRepository.findOne({
      where: {
        eventId: dto.eventId,
        partnerId: orgId,
        status: EventPartnerStatus.APPROVED,
      },
    });
    if (!eventPartner) {
      throw new ForbiddenException(
        '이 이벤트에 대해 승인된 파트너만 계약서를 생성할 수 있습니다.',
      );
    }

    // Verify template exists and belongs to this partner/event
    const template = await this.templateRepository.findOne({
      where: { id: dto.templateId, eventId: dto.eventId, partnerId: orgId },
    });
    if (!template) {
      throw new NotFoundException('계약서 템플릿을 찾을 수 없습니다.');
    }

    // Generate unique contract number and QR code
    let contractNumber = generateContractNumber();
    let existingContract = await this.contractRepository.findOne({
      where: { contractNumber },
    });
    while (existingContract) {
      contractNumber = generateContractNumber();
      existingContract = await this.contractRepository.findOne({
        where: { contractNumber },
      });
    }

    let qrCode = generateQRCode();
    let existingQr = await this.contractRepository.findOne({
      where: { qrCode },
    });
    while (existingQr) {
      qrCode = generateQRCode();
      existingQr = await this.contractRepository.findOne({
        where: { qrCode },
      });
    }

    let shortCode = generateShortCode();
    let existingShort = await this.contractRepository.findOne({
      where: { shortCode },
    });
    while (existingShort) {
      shortCode = generateShortCode();
      existingShort = await this.contractRepository.findOne({
        where: { shortCode },
      });
    }

    const contract = this.contractRepository.create({
      contractNumber,
      templateId: dto.templateId,
      eventId: dto.eventId,
      partnerId: orgId,
      qrCode,
      shortCode,
      qrCodeUrl: `/api/contract-flow/${qrCode}`,
      status: ContractStatus.PENDING,
      totalAmount: dto.totalAmount,
      customerName: dto.customerName,
      createdBy: userId,
    });

    const saved = await this.contractRepository.save(contract);

    // Record history
    await this.historyRepository.save(
      this.historyRepository.create({
        contractId: saved.id,
        fromStatus: null,
        toStatus: ContractStatus.PENDING,
        changedBy: userId,
        reason: '계약서 생성',
      }),
    );

    const partnerOrg = await this.orgRepository.findOne({ where: { id: orgId } });
    const partnerName = partnerOrg?.name || '파트너';

    await this.activityLogService.log(
      'create_contract',
      `"${partnerName}"이(가) 계약서 ${contractNumber} 생성 (고객: ${dto.customerName || '미정'})`,
      userId,
      'contract',
      saved.id,
    );

    return this.contractRepository.findOne({
      where: { id: saved.id },
      relations: ['template', 'event', 'partner'],
    });
  }

  async listContracts(
    userId: string,
    eventId?: string,
  ): Promise<Contract[]> {
    const orgId = await this.getOrgIdForUser(userId);

    const where: any = { partnerId: orgId };
    if (eventId) {
      where.eventId = eventId;
    }

    return this.contractRepository.find({
      where,
      relations: ['template', 'event', 'customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async getContractDetail(
    contractId: string,
    userId: string,
  ): Promise<Contract> {
    const orgId = await this.getOrgIdForUser(userId);
    const contract = await this.contractRepository.findOne({
      where: { id: contractId },
      relations: [
        'template',
        'template.fields',
        'event',
        'partner',
        'customer',
        'fieldValues',
        'signatures',
        'histories',
      ],
    });
    if (!contract) {
      throw new NotFoundException('계약서를 찾을 수 없습니다.');
    }

    // Only the partner org that created it can view it
    if (contract.partnerId !== orgId) {
      throw new ForbiddenException('이 계약서에 대한 접근 권한이 없습니다.');
    }

    return contract;
  }

  async cancelContract(
    contractId: string,
    userId: string,
    dto: CancelContractDto,
  ): Promise<Contract> {
    const orgId = await this.getOrgIdForUser(userId);
    const contract = await this.contractRepository.findOne({
      where: { id: contractId, partnerId: orgId },
    });
    if (!contract) {
      throw new NotFoundException('계약서를 찾을 수 없습니다.');
    }

    if (
      contract.status === ContractStatus.COMPLETED ||
      contract.status === ContractStatus.CANCELLED
    ) {
      throw new BadRequestException(
        '완료되었거나 이미 취소된 계약서는 취소할 수 없습니다.',
      );
    }

    const fromStatus = contract.status;
    contract.status = ContractStatus.CANCELLED;
    contract.cancelledBy = userId;
    contract.cancelReason = dto.reason;
    contract.cancelledAt = new Date();

    const saved = await this.contractRepository.save(contract);

    await this.historyRepository.save(
      this.historyRepository.create({
        contractId: saved.id,
        fromStatus,
        toStatus: ContractStatus.CANCELLED,
        changedBy: userId,
        reason: dto.reason,
      }),
    );

    const cancelOrg = await this.orgRepository.findOne({ where: { id: orgId } });
    const cancelOrgName = cancelOrg?.name || '파트너';

    await this.activityLogService.log(
      'cancel_contract',
      `"${cancelOrgName}"이(가) 계약서 ${contract.contractNumber} 취소: ${dto.reason}`,
      userId,
      'contract',
      contractId,
    );

    return saved;
  }

  async getQrInfo(
    contractId: string,
    userId: string,
  ): Promise<{ qrCode: string; qrCodeUrl: string; contractNumber: string }> {
    const orgId = await this.getOrgIdForUser(userId);
    const contract = await this.contractRepository.findOne({
      where: { id: contractId, partnerId: orgId },
    });
    if (!contract) {
      throw new NotFoundException('계약서를 찾을 수 없습니다.');
    }

    return {
      qrCode: contract.qrCode,
      qrCodeUrl: contract.qrCodeUrl,
      contractNumber: contract.contractNumber,
    };
  }

  async prefillContract(
    contractId: string,
    userId: string,
    dto: FillContractDto,
  ): Promise<ContractFieldValue[]> {
    const orgId = await this.getOrgIdForUser(userId);
    const contract = await this.contractRepository.findOne({
      where: { id: contractId, partnerId: orgId },
    });
    if (!contract) {
      throw new NotFoundException('계약서를 찾을 수 없습니다.');
    }
    if (contract.status !== ContractStatus.PENDING) {
      throw new BadRequestException('대기 상태의 계약서만 사전입력할 수 있습니다.');
    }

    // Validate field IDs belong to this template
    const templateFields = await this.fieldRepository.find({
      where: { templateId: contract.templateId },
    });
    const validFieldIds = new Set(templateFields.map((f) => f.id));

    for (const fv of dto.fieldValues) {
      if (!validFieldIds.has(fv.fieldId)) {
        throw new BadRequestException(
          `필드 ID ${fv.fieldId}는 이 템플릿에 속하지 않습니다.`,
        );
      }
    }

    // Upsert field values (without changing contract status)
    const savedValues: ContractFieldValue[] = [];
    for (const fv of dto.fieldValues) {
      let existing = await this.fieldValueRepository.findOne({
        where: { contractId: contract.id, fieldId: fv.fieldId },
      });
      if (existing) {
        existing.value = fv.value;
        savedValues.push(await this.fieldValueRepository.save(existing));
      } else {
        const newValue = this.fieldValueRepository.create({
          contractId: contract.id,
          fieldId: fv.fieldId,
          value: fv.value,
        });
        savedValues.push(await this.fieldValueRepository.save(newValue));
      }
    }

    return savedValues;
  }

  // ---------- Template CRUD ----------

  async createTemplate(
    userId: string,
    dto: CreateTemplateDto,
  ): Promise<ContractTemplate> {
    const orgId = await this.getOrgIdForUser(userId);

    // Verify partner is part of this event
    const eventPartner = await this.eventPartnerRepository.findOne({
      where: {
        eventId: dto.eventId,
        partnerId: orgId,
        status: EventPartnerStatus.APPROVED,
      },
    });
    if (!eventPartner) {
      throw new ForbiddenException(
        '이 이벤트에 대해 승인된 파트너만 템플릿을 생성할 수 있습니다.',
      );
    }

    const template = this.templateRepository.create({
      eventId: dto.eventId,
      partnerId: orgId,
      name: dto.name,
      fileId: dto.fileId,
      fileType: dto.fileType,
      pageCount: dto.pageCount || 1,
      status: 'active',
      createdBy: userId,
    });

    const saved = await this.templateRepository.save(template);
    return this.templateRepository.findOne({
      where: { id: saved.id },
      relations: ['event', 'partner'],
    });
  }

  async listTemplates(
    userId: string,
    eventId?: string,
  ): Promise<ContractTemplate[]> {
    const orgId = await this.getOrgIdForUser(userId);

    const where: any = { partnerId: orgId, status: 'active' };
    if (eventId) {
      where.eventId = eventId;
    }

    return this.templateRepository.find({
      where,
      relations: ['event', 'fields'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTemplateDetail(
    templateId: string,
    userId: string,
  ): Promise<ContractTemplate> {
    const orgId = await this.getOrgIdForUser(userId);
    const template = await this.templateRepository.findOne({
      where: { id: templateId, partnerId: orgId },
      relations: ['event', 'partner', 'fields'],
    });
    if (!template) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    }
    return template;
  }

  async saveFields(
    templateId: string,
    userId: string,
    dto: SaveFieldsDto,
  ): Promise<ContractField[]> {
    const orgId = await this.getOrgIdForUser(userId);
    const template = await this.templateRepository.findOne({
      where: { id: templateId, partnerId: orgId },
    });
    if (!template) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    }

    // Upsert logic: update existing fields, create new ones, delete removed ones
    const existingFields = await this.fieldRepository.find({ where: { templateId } });
    const existingIds = new Set(existingFields.map(f => f.id));
    const incomingIds = new Set(dto.fields.filter(f => f.id).map(f => f.id));

    // Delete removed fields (and their field values first to avoid FK violation)
    const toDeleteIds = [...existingIds].filter(id => !incomingIds.has(id));
    if (toDeleteIds.length > 0) {
      await this.fieldValueRepository.delete({ fieldId: In(toDeleteIds) });
      await this.fieldRepository.delete({ id: In(toDeleteIds) });
    }

    // Update existing + create new
    const result: ContractField[] = [];
    for (let i = 0; i < dto.fields.length; i++) {
      const f = dto.fields[i];
      const data = {
        templateId,
        fieldType: f.fieldType,
        label: f.label,
        placeholder: f.placeholder,
        isRequired: f.isRequired ?? true,
        pageNumber: f.pageNumber || 1,
        positionX: f.positionX,
        positionY: f.positionY,
        width: f.width,
        height: f.height,
        sortOrder: f.sortOrder ?? i,
        defaultValue: f.defaultValue,
        validationRule: f.validationRule,
      };

      if (f.id && existingIds.has(f.id)) {
        // Update existing field in place (preserves ID and FK references)
        await this.fieldRepository.update(f.id, data);
        result.push({ ...existingFields.find(e => e.id === f.id)!, ...data });
      } else {
        // Create new field
        const newField = this.fieldRepository.create(data);
        result.push(await this.fieldRepository.save(newField));
      }
    }

    return result;
  }

  async getFields(
    templateId: string,
    userId: string,
  ): Promise<ContractField[]> {
    const orgId = await this.getOrgIdForUser(userId);
    const template = await this.templateRepository.findOne({
      where: { id: templateId, partnerId: orgId },
    });
    if (!template) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    }

    return this.fieldRepository.find({
      where: { templateId },
      order: { sortOrder: 'ASC' },
    });
  }
}
