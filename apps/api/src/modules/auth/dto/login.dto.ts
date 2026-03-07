import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class LoginPasswordDto {
  @IsEmail({}, { message: 'Email tidak valid' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password!: string;
}

export class RequestOtpDto {
  @Matches(/^08\d{8,12}$/, { message: 'Nomor HP tidak valid' })
  phone!: string;
}

export class VerifyOtpDto {
  @Matches(/^08\d{8,12}$/)
  phone!: string;

  @IsString()
  @MinLength(6)
  code!: string;
}
