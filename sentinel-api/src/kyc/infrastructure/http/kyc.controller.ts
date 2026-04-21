import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResult, PaginationDto } from '../../../shared/application/pagination.dto';
import { IsOptional, IsString } from 'class-validator';

export class KycListQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

import { Role } from '../../../shared/constants/roles.enum';
import { Roles } from '../../../shared/infrastructure/guards/roles.decorator';
import { OpenKycCaseDto, TransitionKycDto } from '../../application/dto/kyc.dto';
import {
  OpenKycCaseCommand,
  OpenKycCaseResult,
} from '../../application/commands/open-kyc-case.command';
import {
  TransitionKycCommand,
  TransitionKycResult,
} from '../../application/commands/transition-kyc.command';
import {
  GetKycCasesQuery,
  GetKycCaseByIdQuery,
  KycCaseView,
} from '../../application/queries/get-kyc-cases.query';

@ApiTags('KYC')
@Controller('kyc')
export class KycController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles(Role.COMPLIANCE_OFFICER)
  @ApiOperation({ summary: 'Open a new KYC case for a client record' })
  async open(@Body() dto: OpenKycCaseDto): Promise<OpenKycCaseResult> {
    return this.commandBus.execute(new OpenKycCaseCommand(dto.client_record_id, 'system'));
  }

  @Patch(':id/status')
  @Roles(Role.COMPLIANCE_OFFICER)
  @ApiOperation({ summary: 'Transition a KYC case to a new status' })
  async transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionKycDto,
  ): Promise<TransitionKycResult> {
    return this.commandBus.execute(new TransitionKycCommand(id, dto.status, 'system', dto.notes));
  }

  @Get()
  @Roles(Role.COMPLIANCE_OFFICER)
  @ApiOperation({ summary: 'List all KYC cases (paginated)' })
  async list(@Query() queryDto: KycListQueryDto): Promise<PaginatedResult<KycCaseView>> {
    return this.queryBus.execute(
      new GetKycCasesQuery(queryDto.skip, queryDto.take, queryDto.status),
    );
  }

  @Get(':id')
  @Roles(Role.COMPLIANCE_OFFICER)
  @ApiOperation({ summary: 'Get a KYC case by ID' })
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<KycCaseView> {
    return this.queryBus.execute(new GetKycCaseByIdQuery(id));
  }
}
