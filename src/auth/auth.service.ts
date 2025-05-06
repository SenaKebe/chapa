import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserType } from '@prisma/client';
import { sendOtpEmail } from './utils/mailer';
import { generateOtp, getOtpExpiry } from './utils/otp-generator';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new HttpException('Email already in use', HttpStatus.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const otp = generateOtp();
    const otpExpires = getOtpExpiry();

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        password: hashedPassword,
        phoneNumber: dto.phoneNumber,
        address: dto.address,
        userType: dto.userType,
        userStatus: 'INACTIVE',
        otp,
        otpExpires,
      },
    });

    await sendOtpEmail(user.email, otp);

    // Generate a short-lived OTP token (JWT)
    const otpToken = this.jwtService.sign(
      { email: user.email },
      { expiresIn: '10m' },
    );

    // ✅ Return user data (without sensitive fields)
    const { password, otp: _, otpExpires: __, ...safeUser } = user;

    return {
      message: 'OTP sent to your email. Please verify to complete signup.',
      otpToken,
      user: safeUser, // 👈 safe user data
    };
  }

  async verifyOtp(otpToken: string, otp: string) {
    let email: string;

    try {
      const decoded = this.jwtService.verify(otpToken);
      email = decoded.email;
    } catch (err) {
      throw new HttpException(
        'Invalid or expired OTP token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (
      !user ||
      user.otp !== otp ||
      !user.otpExpires ||
      new Date() > user.otpExpires
    ) {
      throw new HttpException('Invalid or expired OTP', HttpStatus.BAD_REQUEST);
    }

    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: {
        userStatus: 'ACTIVE',
        otp: null,
        otpExpires: null,
      },
    });

    const authToken = this.jwtService.sign({
      userId: updatedUser.id,
      email: updatedUser.email,
      userType: updatedUser.userType,
    });

    return {
      message: 'User verified successfully',
      token: authToken,
      user: updatedUser,
    };
  }

  async signin(dto: SigninDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // if (user?.isOAuth) {
    //   console.warn(`Password login attempt for OAuth user: ${dto.email}`);
    //   throw new HttpException(
    //     {
    //       statusCode: HttpStatus.BAD_REQUEST,
    //       message: 'This account uses Google Sign-In',
    //       solution: {
    //         action: 'Sign in with Google',
    //         link: '/auth/google', // Optional: Frontend can use this to redirect
    //       },
    //     },
    //     HttpStatus.BAD_REQUEST,
    //   );
    // }

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    if (user.userStatus !== 'ACTIVE') {
      throw new HttpException(
        'Account is not active. Please verify your email or contact support.',
        HttpStatus.FORBIDDEN,
      );
    }

    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      userType: user.userType,
    });

    return { message: 'Login successful', token };
  }
  // async handleOAuthLogin(profile: {
  //   googleId: string;
  //   email: string;
  //   fullName: string;
  //   avatar?: string;
  // }) {
  //   // Check if user exists by Google ID or email
  //   let user = await this.prisma.user.findFirst({
  //     where: {
  //       OR: [{ googleId: profile.googleId }, { email: profile.email }],
  //     },
  //   });

  //   // Create new user if not found (using MongoDB's ObjectId)
  //   if (!user) {
  //     user = await this.prisma.user.create({
  //       data: {
  //         email: profile.email,
  //         fullName: profile.fullName,
  //         googleId: profile.googleId,
  //         password: '',
  //         avatar: profile.avatar,
  //         isOAuth: true,
  //         userType: UserType.USER, // Default role
  //         userStatus: 'ACTIVE', // Skip email verification
  //       },
  //     });
  //   }

  //   // Generate JWT
  //   const token = this.jwtService.sign({
  //     userId: user.id, // MongoDB's ObjectId
  //     email: user.email,
  //     userType: user.userType,
  //   });

  //   return { user, token };
  // }
}
