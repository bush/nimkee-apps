import { IsString, IsNumber, IsNotEmpty, IsOptional, Min, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddEntryDto {
  @ApiProperty() @IsString() @IsNotEmpty() foodKey!: string;
  @ApiProperty() @IsNumber() @Min(0.1) servings!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) date?: string;
}
