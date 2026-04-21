import { ConflictException, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { KycCase } from '../../domain/entities/kyc-case.entity';
import {
  KYC_CASE_REPOSITORY,
  KycCaseRepositoryPort,
} from '../../domain/ports/kyc-case.repository.port';
import { OpenKycCaseCommand, OpenKycCaseResult } from './open-kyc-case.command';

@CommandHandler(OpenKycCaseCommand)
export class OpenKycCaseHandler implements ICommandHandler<OpenKycCaseCommand, OpenKycCaseResult> {
  constructor(
    @Inject(KYC_CASE_REPOSITORY)
    private readonly repo: KycCaseRepositoryPort,
  ) {}

  async execute(command: OpenKycCaseCommand): Promise<OpenKycCaseResult> {
    const existing = await this.repo.findByClientRecordId(command.clientRecordId);
    if (existing) {
      throw new ConflictException(
        `KYC case already exists for client record ${command.clientRecordId}`,
      );
    }

    const kycCase = KycCase.create({
      clientRecordId: command.clientRecordId,
      assignedTo: null,
      notes: null,
      documents: [],
      createdBy: command.createdBy,
      ...(command.initialStatus && { status: command.initialStatus }),
    });

    const saved = await this.repo.save(kycCase);

    return {
      id: saved.id,
      client_record_id: saved.clientRecordId,
      status: saved.status,
      created_by: saved.createdBy,
    };
  }
}
