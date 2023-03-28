import { Controller, Post, Body, Res, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { PublicProfileDto } from './dto/public-user.dto';
import { User } from './user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  signUp(@Body() authCredentialsDto: AuthCredentialsDto): Promise<void> {
    return this.authService.signUp(authCredentialsDto);
  }

  @Post('/login')
  async logIn(
    @Body() authCredentialsDto: AuthCredentialsDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const token = await this.authService.logIn(authCredentialsDto);

    res.cookie('jwt', token, { httpOnly: true });
    return token;
  }

  @Get('/users')
  @UseGuards(AuthGuard())
  async getAllUsers(): Promise<PublicProfileDto[]> {
    return this.authService.getAllusers();
  }
}
