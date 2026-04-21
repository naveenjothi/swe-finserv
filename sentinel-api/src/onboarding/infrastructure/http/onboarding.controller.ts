import 'multer';
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginatedResult, PaginationDto } from '../../../shared/application/pagination.dto';
import { Role } from '../../../shared/constants/roles.enum';
import { Roles } from '../../../shared/infrastructure/guards/roles.decorator';
import { SubmitOnboardingDto } from '../../application/dto/submit-onboarding.dto';
import {
  SubmitOnboardingCommand,
  SubmitOnboardingResult,
} from '../../application/commands/submit-onboarding.command';
import { ImportCsvCommand, ImportCsvResult } from '../../application/commands/import-csv.command';
import { GetClientsQuery, ClientView } from '../../application/queries/get-clients.query';
import {
  GetClientByIdQuery,
  ClientDetailView,
} from '../../application/queries/get-client-by-id.query';

@ApiTags('Onboarding')
@Controller()
export class OnboardingController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('onboarding')
  @Roles(Role.RM)
  @ApiOperation({ summary: 'Submit a client onboarding record' })
  async submit(
    @Body() dto: SubmitOnboardingDto,
    @Headers('x-user-name') userName?: string,
  ): Promise<SubmitOnboardingResult> {
    const performedBy = userName || 'system';
    return this.commandBus.execute(
      new SubmitOnboardingCommand(
        dto.client_name,
        {
          pep_status: dto.pep_status,
          sanctions_screening_match: dto.sanctions_screening_match,
          adverse_media_flag: dto.adverse_media_flag,
          country_of_tax_residence: dto.country_of_tax_residence,
          client_type: dto.client_type,
          annual_income: dto.annual_income,
          source_of_funds: dto.source_of_funds,
        },
        performedBy, // Now driven by the auth/user context
        dto.declared_tier ?? null,
      ),
    );
  }

  @Post('onboarding/import')
  @Roles(Role.COMPLIANCE_OFFICER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import client records from CSV with mismatch detection' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-user-name') userName?: string,
  ): Promise<ImportCsvResult> {
    const performedBy = userName || 'system';
    return this.commandBus.execute(new ImportCsvCommand(file.buffer, performedBy));
  }

  @Get('clients')
  @Roles(Role.RM, Role.COMPLIANCE_OFFICER, Role.AUDITOR)
  @ApiOperation({ summary: 'List all client onboarding records (paginated)' })
  async list(@Query() pagination: PaginationDto): Promise<PaginatedResult<ClientView>> {
    return this.queryBus.execute(new GetClientsQuery(pagination.skip, pagination.take));
  }

  @Get('clients/:id')
  @Roles(Role.RM, Role.COMPLIANCE_OFFICER, Role.AUDITOR)
  @ApiOperation({ summary: 'Get a single client onboarding record by ID' })
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<ClientDetailView> {
    return this.queryBus.execute(new GetClientByIdQuery(id));
  }
}
