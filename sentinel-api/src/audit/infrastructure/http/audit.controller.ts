import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaginatedResult, PaginationDto } from '../../../shared/application/pagination.dto';
import { Role } from '../../../shared/constants/roles.enum';
import { Roles } from '../../../shared/infrastructure/guards/roles.decorator';
import { AuditEntryView, GetAuditLogQuery } from '../../application/queries/get-audit-log.query';

@ApiTags('Audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Roles(Role.AUDITOR, Role.COMPLIANCE_OFFICER)
  @ApiOperation({ summary: 'List all audit log entries (paginated)' })
  async list(@Query() pagination: PaginationDto): Promise<PaginatedResult<AuditEntryView>> {
    return this.queryBus.execute(new GetAuditLogQuery(pagination.skip, pagination.take));
  }

  @Get(':aggregateId')
  @Roles(Role.AUDITOR, Role.COMPLIANCE_OFFICER)
  @ApiOperation({ summary: 'Get audit trail for a specific aggregate' })
  async getByAggregate(
    @Param('aggregateId', ParseUUIDPipe) aggregateId: string,
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResult<AuditEntryView>> {
    return this.queryBus.execute(
      new GetAuditLogQuery(pagination.skip, pagination.take, aggregateId),
    );
  }
}
