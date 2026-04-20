import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import {
  KYC_CASE_REPOSITORY,
  KycCaseRepositoryPort,
} from '../../domain/ports/kyc-case.repository.port';
import { TransitionKycCommand, TransitionKycResult } from './transition-kyc.command';

@CommandHandler(TransitionKycCommand)
export class TransitionKycHandler
  implements ICommandHandler<TransitionKycCommand, TransitionKycResult>
{
  constructor(
    @Inject(KYC_CASE_REPOSITORY)
    private readonly repo: KycCaseRepositoryPort,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: TransitionKycCommand): Promise<TransitionKycResult> {
    const kycCase = await this.repo.findById(command.kycCaseId);
    if (!kycCase) {
      throw new NotFoundException(`KYC case ${command.kycCaseId} not found`);
    }

    const previousStatus = kycCase.status;
    kycCase.transition(command.newStatus, command.changedBy, command.notes);

    const saved = await this.repo.save(kycCase);

    for (const event of saved.pullDomainEvents()) {
      this.eventBus.publish(event);
    }

    return {
      id: saved.id,
      status: saved.status,
      previous_status: previousStatus,
      updated_at: saved.updatedAt.toISOString(),
    };
  }
}
