// import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
// import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
// import { AuthGuard } from '@nestjs/passport';
// import { Response } from 'express';
// import { AuthService } from './auth.service';

// @ApiTags('OAuth')
// @Controller('auth')
// export class OAuthController {
//   constructor(private authService: AuthService) {}

//   @Get('google')
//   @UseGuards(AuthGuard('google'))
//   @ApiOperation({ summary: 'Initiate Google login' })
//   async googleAuth() {}

//   @Get('google/callback')
//   @UseGuards(AuthGuard('google'))
//   @ApiExcludeEndpoint()
//   async googleCallback(@Req() req, @Res() res: Response) {
//     const token = await this.authService.handleOAuthLogin(req.user);
//     res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
//   }
// }
