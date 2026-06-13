import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'

export class UpdateUserDto {
	@ApiProperty({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;
}
