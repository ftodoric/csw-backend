import { Controller, Post, Body, Res, Get, UseGuards } from '@nestjs/common'

import { instanceToPlain } from 'class-transformer'
import { Response } from 'express'

import { AuthService } from './auth.service'
import { User } from './decorators'
import { PublicProfileDto, AuthCredentialsDto } from './dto'
import { User as UserEntity } from './entities'
import { JwtAuthGuard } from './jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  signUp(@Body() authCredentialsDto: AuthCredentialsDto): Promise<string> {
    return this.authService.signUp(authCredentialsDto)
  }

  @Post('/login')
  async logIn(
    @Body() authCredentialsDto: AuthCredentialsDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ accessToken: string }> {
    const token = await this.authService.logIn(authCredentialsDto)

    // Set a cookie for all future requests
    res.cookie('jwt', token, { httpOnly: true })

    return token
  }

  @Post('/logout')
  @UseGuards(JwtAuthGuard)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt', { httpOnly: true })
    return { message: 'Logged out successfully.' }
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@User() user: UserEntity): UserEntity {
    return instanceToPlain(user) as UserEntity
  }

  @Get('/users')
  @UseGuards(JwtAuthGuard)
  getAllUsers(): Promise<PublicProfileDto[]> {
    return this.authService.getAllusers()
  }
}
