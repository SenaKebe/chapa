import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { UserType, UserStatus } from '@prisma/client';

export class SignupDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'senkeb22@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecureP@ss123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '+251911223344', required: false })
  @IsOptional()
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: 'Addis Ababa, Ethiopia', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'USER', enum: UserType })
  @IsEnum(UserType)
  userType: UserType;
}
