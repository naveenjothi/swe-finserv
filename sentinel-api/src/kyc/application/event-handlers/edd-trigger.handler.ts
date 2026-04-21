import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CommandBus } from '@nestjs/cqrs';
import { OnboardingSubmittedEvent } from '../../../onboarding/domain/events/onboarding-submitted.event';
import { RiskTier } from '../../../risk-classification/domain/value-objects/risk-tier.vo';
import { OpenKycCaseCommand } from '../commands/open-kyc-case.command';
import { KycStatus } from '../../domain/value-objects/kyc-status.vo';

@EventsHandler(OnboardingSubmittedEvent)
export class EddTriggerHandler implements IEventHandler<OnboardingSubmittedEvent> {
  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: OnboardingSubmittedEvent) {
    if (event.computedTier === RiskTier.HIGH) {
      await this.commandBus.execute(
        new OpenKycCaseCommand(event.aggregateId, 'SYSTEM', KycStatus.ENHANCED_DUE_DILIGENCE),
      );
    } else if (event.computedTier === RiskTier.MEDIUM) {
      await this.commandBus.execute(
        new OpenKycCaseCommand(event.aggregateId, 'SYSTEM', KycStatus.PENDING),
      );
    }
  }
}
