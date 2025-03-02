import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTodoDto {
  @IsOptional() // Makes `limit` optional
  @Type(() => Number) 
  @IsInt({ message: 'Limit must be an integer' }) // Validates as an integer
  @Min(1, { message: 'Limit must be at least 1' }) // Minimum value allowed
  @Max(100, { message: 'Limit cannot exceed 100' }) // Maximum value allowed
  limit?: number;

  @IsOptional() // Makes `next` optional
  @IsString({ message: 'Next must be a string' }) // Validates as a string
  next?: string;
}