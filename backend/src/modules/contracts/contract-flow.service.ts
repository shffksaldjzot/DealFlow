import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Contract, ContractStatus } from './entities/contract.entity';
import { ContractField } from './entities/contract-field.entity';
import { ContractFieldValue } from './entities/contract-field-value.entity';
import { ContractSignature } from './entities/contract-signature.entity';
import { ContractHistory } from './entities/contract-history.entity';
import { OrganizationMember, MemberRole } from '../organizations/entities/organization-member.entity';
import { FillContractDto } from './dto/fill-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ContractFlowService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(ContractField)
    private readonly fieldRepository: Repository<ContractField>,
    @InjectRepository(ContractFieldValue)
    private readonly fieldValueRepository: Repository<ContractFieldValue>,
    @InjectRepository(ContractSignature)
    private readonly signatureRepository: Repository<ContractSignature>,
    @InjectRepository(ContractHistory)
    private readonly historyRepository: Repository<ContractHistory>,
    @InjectRepository(OrganizationMember)
    private readonly memberRepository: Repository<OrganizationMember>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async findContractByQr(code: string): Promise<Contract> {
    // If code is 8 chars, try shortCode first; otherwise use qrCode
    let contract: Contract | null = null;
    if (code.length === 8) {
      contract = await this.contractRepository.findOne({
        where: { shortCode: code },
        relations: [
          'template',
          'template.fields',
          'event',
          'partner',
          'fieldValues',
          'fieldValues.field',
          'signatures',
        ],
      });
    }
    if (!contract) {
      contract = await this.contractRepository.findOne({
        where: { qrCode: code },
        relations: [
          'template',
          'template.fields',
          'event',
          'partner',
          'fieldValues',
          'fieldValues.field',
          'signatures',
        ],
      });
    }
    if (!contract) {
      throw new NotFoundException('계약서를 찾을 수 없습니다.');
    }
    return contract;
  }

  async getContractByQr(qrCode: string): Promise<Contract> {
    const contract = await this.findContractByQr(qrCode);

    if (contract.status === ContractStatus.CANCELLED) {
      throw new BadRequestException('취소된 계약서입니다.');
    }

    if (contract.expiresAt && new Date(contract.expiresAt) < new Date()) {
      throw new BadRequestException('만료된 계약서입니다.');
    }

    return contract;
  }

  async startFilling(
    qrCode: string,
    customerId?: string,
  ): Promise<Contract> {
    const contract = await this.findContractByQr(qrCode);

    if (contract.status === ContractStatus.IN_PROGRESS) {
      // Already in progress – just update customer if needed and return as-is
      if (customerId && !contract.customerId) {
        contract.customerId = customerId;
        await this.contractRepository.save(contract);
      }
      return this.findContractByQr(qrCode);
    }

    if (contract.status !== ContractStatus.PENDING) {
      throw new BadRequestException(
        `현재 상태(${contract.status})에서는 작성을 시작할 수 없습니다.`,
      );
    }

    const fromStatus = contract.status;
    contract.status = ContractStatus.IN_PROGRESS;
    if (customerId) {
      contract.customerId = customerId;
    }

    const saved = await this.contractRepository.save(contract);

    await this.historyRepository.save(
      this.historyRepository.create({
        contractId: saved.id,
        fromStatus,
        toStatus: ContractStatus.IN_PROGRESS,
        changedBy: customerId || null,
        reason: '고객이 계약서 작성을 시작',
      }),
    );

    return this.findContractByQr(qrCode);
  }

  async fillFields(
    qrCode: string,
    dto: FillContractDto,
    customerId?: string,
  ): Promise<ContractFieldValue[]> {
    const contract = await this.findContractByQr(qrCode);

    if (
      contract.status !== ContractStatus.IN_PROGRESS &&
      contract.status !== ContractStatus.PENDING
    ) {
      throw new BadRequestException(
        '현재 상태에서는 계약서 필드를 작성할 수 없습니다.',
      );
    }

    // If still pending, transition to in_progress
    if (contract.status === ContractStatus.PENDING) {
      contract.status = ContractStatus.IN_PROGRESS;
      if (customerId) {
        contract.customerId = customerId;
      }
      await this.contractRepository.save(contract);

      await this.historyRepository.save(
        this.historyRepository.create({
          contractId: contract.id,
          fromStatus: ContractStatus.PENDING,
          toStatus: ContractStatus.IN_PROGRESS,
          changedBy: customerId || null,
          reason: '필드 작성으로 인한 자동 상태 변경',
        }),
      );
    }

    // Validate that all field IDs belong to this template
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

    // Upsert field values
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

  async submitSignature(
    qrCode: string,
    dto: SignContractDto,
    customerId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Contract> {
    const contract = await this.findContractByQr(qrCode);

    if (contract.status !== ContractStatus.IN_PROGRESS) {
      throw new BadRequestException(
        '계약서가 작성 중 상태일 때만 서명할 수 있습니다.',
      );
    }

    // Validate required fields are filled
    const requiredFields = await this.fieldRepository.find({
      where: { templateId: contract.templateId, isRequired: true },
    });

    const filledValues = await this.fieldValueRepository.find({
      where: { contractId: contract.id },
    });
    const filledFieldIds = new Set(filledValues.map((v) => v.fieldId));

    const missingFields = requiredFields.filter(
      (f) => !filledFieldIds.has(f.id) || !filledValues.find((v) => v.fieldId === f.id)?.value,
    );

    if (missingFields.length > 0) {
      const missingLabels = missingFields.map((f) => f.label).join(', ');
      throw new BadRequestException(
        `필수 항목이 작성되지 않았습니다: ${missingLabels}`,
      );
    }

    // Create signature record
    const signatureHash = crypto
      .createHash('sha256')
      .update(dto.signatureData + contract.id + new Date().toISOString())
      .digest('hex');

    await this.signatureRepository.save(
      this.signatureRepository.create({
        contractId: contract.id,
        signerId: customerId || contract.createdBy,
        signatureData: dto.signatureData,
        signatureHash,
        ipAddress,
        userAgent,
      }),
    );

    // Update contract status to signed
    const fromStatus = contract.status;
    contract.status = ContractStatus.SIGNED;
    contract.signedAt = new Date();
    if (customerId) {
      contract.customerId = customerId;
    }

    const saved = await this.contractRepository.save(contract);

    await this.historyRepository.save(
      this.historyRepository.create({
        contractId: saved.id,
        fromStatus,
        toStatus: ContractStatus.SIGNED,
        changedBy: customerId || null,
        reason: '고객 서명 완료',
        metadata: { signatureHash },
      }),
    );

    // Send notifications after successful signature
    try {
      // Notify the partner org owner
      const partnerOwner = await this.memberRepository.findOne({
        where: { organizationId: contract.partnerId, role: MemberRole.OWNER },
      });
      if (partnerOwner) {
        await this.notificationsService.createNotification({
          userId: partnerOwner.userId,
          type: 'contract_signed',
          title: '새로운 계약 서명이 완료되었습니다',
          message: `계약번호 ${contract.contractNumber}의 서명이 완료되었습니다.`,
          relatedId: contract.id,
          relatedType: 'contract',
        });
      }

      // Notify the customer
      const customerUserId = customerId || contract.customerId;
      if (customerUserId) {
        await this.notificationsService.createNotification({
          userId: customerUserId,
          type: 'contract_signed',
          title: '계약 서명이 완료되었습니다',
          message: `계약번호 ${contract.contractNumber}의 서명이 완료되었습니다.`,
          relatedId: contract.id,
          relatedType: 'contract',
        });
      }
    } catch {
      // Do not fail the signature flow if notification fails
    }

    return this.findContractByQr(qrCode);
  }
}
