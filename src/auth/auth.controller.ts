import { Controller, Post, Body, Res, Get, UseGuards } from '@nestjs/common'

import { Response } from 'express'

import { AuthService } from './auth.service'
import { AuthCredentialsDto } from './dto/auth-credentials.dto'
import { PublicProfileDto } from './dto/public-user.dto'
import { JwtAuthGuard } from './jwt-auth.guard'
import { User } from './user.decorator'
import { User as UserEntity } from './user.entity'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  signUp(@Body() authCredentialsDto: AuthCredentialsDto): Promise<void> {
    return this.authService.signUp(authCredentialsDto)
  }

  @Post('/login')
  async logIn(
    @Body() authCredentialsDto: AuthCredentialsDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ accessToken: string }> {
    const token = await this.authService.logIn(authCredentialsDto)

    res.cookie('jwt', token, { httpOnly: true })
    return token
  }

  @Post('/logout')
  @UseGuards(JwtAuthGuard)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt', { httpOnly: true })
    return { msg: 'success' }
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@User() user: UserEntity): Promise<UserEntity> {
    return user
  }

  @Get('/users')
  @UseGuards(JwtAuthGuard)
  async getAllUsers(): Promise<PublicProfileDto[]> {
    return this.authService.getAllusers()
  }
}
