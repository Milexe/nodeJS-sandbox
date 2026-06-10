import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class TypingDto {
  @ApiProperty({ example: 1, minimum: 1, maximum: 2 })
  @IsInt()
  @Min(1)
  @Max(2)
  userId: number;
}
