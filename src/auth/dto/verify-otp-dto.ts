import { IsEmail, IsString } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  otpToken: string;

  @IsString()
  otp: string;
}
