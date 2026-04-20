import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { KycStatus } from '../../domain/value-objects/kyc-status.vo';

export class OpenKycCaseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  client_record_id!: string;
}

export class TransitionKycDto {
  @ApiProperty({ enum: KycStatus, example: 'UNDER_REVIEW' })
  @IsEnum(KycStatus)
  status!: KycStatus;

  @ApiPropertyOptional({ example: 'Documents verified, proceeding to review' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
