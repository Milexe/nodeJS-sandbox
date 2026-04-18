import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Некорректный формат email' })
  @Transform(({ value }) => value.trim().toLowerCase())
  email: string;

  @IsString()
  @MinLength(8, { message: 'Пароль невалидный' })
  @MaxLength(128, { message: 'Пароль невалидный' })
  password: string;
}