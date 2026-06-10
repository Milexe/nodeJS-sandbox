import { IsInt, Max, Min } from 'class-validator';

export class TypingDto {
  @IsInt()
  @Min(1)
  @Max(2)
  userId: number;
}
