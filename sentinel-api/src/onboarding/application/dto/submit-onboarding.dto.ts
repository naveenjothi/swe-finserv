import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { RiskTier } from '../../../risk-classification/domain/value-objects/risk-tier.vo';

export class SubmitOnboardingDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  client_name!: string;

  @ApiProperty({ example: 'INDIVIDUAL', enum: ['INDIVIDUAL', 'ENTITY'] })
  @IsString()
  @IsNotEmpty()
  client_type!: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  pep_status!: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  sanctions_screening_match!: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  adverse_media_flag!: boolean;

  @ApiProperty({ example: 'United Kingdom' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  country_of_tax_residence!: string;

  @ApiProperty({ example: 120000 })
  @IsNumber()
  @Min(0)
  annual_income!: number;

  @ApiProperty({ example: 'Employment' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  source_of_funds!: string;

  @ApiPropertyOptional({ enum: RiskTier, example: 'LOW' })
  @IsOptional()
  @IsEnum(RiskTier)
  declared_tier?: RiskTier;
}
