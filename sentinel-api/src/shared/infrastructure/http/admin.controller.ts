import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../../shared/constants/roles.enum';
import { Roles } from '../../../shared/infrastructure/guards/roles.decorator';
import { BackfillAuditEddService } from '../migrations/backfill-audit-edd.service';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly backfillService: BackfillAuditEddService) {}

  @Post('backfill')
  @Roles(Role.COMPLIANCE_OFFICER)
  @ApiOperation({ summary: 'Backfill missing audit entries and KYC cases' })
  async runBackfill() {
    return this.backfillService.runBackfill();
  }
}
