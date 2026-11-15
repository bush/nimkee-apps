import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFoodDto {
  @ApiProperty() @IsString() @IsNotEmpty() name!: string;
  @ApiProperty() @IsNumber() @Min(0) calories!: number;
  @ApiProperty() @IsNumber() @Min(0) protein!: number;
  @ApiProperty() @IsNumber() @Min(0) carbs!: number;
  @ApiProperty() @IsNumber() @Min(0) fat!: number;
  @ApiProperty() @IsString() @IsNotEmpty() serving!: string;
}
