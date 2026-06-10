import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

export class SendMessageDto {
  @IsInt()
  @Min(1)
  @Max(2)
  userId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  text: string;
}
