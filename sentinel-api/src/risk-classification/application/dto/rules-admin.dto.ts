import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString, MaxLength } from 'class-validator';
import { RulesPayload } from '../../domain/value-objects/rules-payload.vo';

export class PublishRuleSetDto {
  @ApiProperty({ example: 'v2.0.0-2024' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  version!: string;

  @ApiProperty({
    example: {
      high_risk: {
        countries: ['Russia', 'Belarus'],
        boolean_flags: {
          pep_status: true,
          sanctions_screening_match: true,
          adverse_media_flag: true,
        },
      },
      medium_risk: {
        countries: ['Brazil', 'Turkey'],
        client_types: ['ENTITY'],
        income_threshold: 500000,
        income_source_of_funds: ['Inheritance', 'Gift'],
      },
    },
  })
  @IsObject()
  payload!: RulesPayload;
}

export class FcaWebhookDto {
  @ApiProperty({ example: 'v3.0.0-fca-2024' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  version!: string;

  @ApiProperty()
  @IsObject()
  payload!: RulesPayload;
}
