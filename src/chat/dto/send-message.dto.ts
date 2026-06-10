import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 1, minimum: 1, maximum: 2 })
  @IsInt()
  @Min(1)
  @Max(2)
  userId: number;

  @ApiProperty({ example: 'Hello!', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  text: string;
}
