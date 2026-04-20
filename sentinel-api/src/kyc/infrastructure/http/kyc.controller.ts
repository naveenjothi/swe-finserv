import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginatedResult, PaginationDto } from '../../../shared/application/pagination.dto';
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
  @ApiOperation({ summary: 'Open a new KYC case for a client record' })
  async open(@Body() dto: OpenKycCaseDto): Promise<OpenKycCaseResult> {
    return this.commandBus.execute(
      new OpenKycCaseCommand(dto.client_record_id, 'system'),
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transition a KYC case to a new status' })
  async transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionKycDto,
  ): Promise<TransitionKycResult> {
    return this.commandBus.execute(
      new TransitionKycCommand(id, dto.status, 'system', dto.notes),
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all KYC cases (paginated)' })
  async list(@Query() pagination: PaginationDto): Promise<PaginatedResult<KycCaseView>> {
    return this.queryBus.execute(new GetKycCasesQuery(pagination.skip, pagination.take));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a KYC case by ID' })
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<KycCaseView> {
    return this.queryBus.execute(new GetKycCaseByIdQuery(id));
  }
}
