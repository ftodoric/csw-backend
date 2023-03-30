import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'

import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception'
import * as bcrypt from 'bcrypt'

import { AuthCredentialsDto } from './dto/auth-credentials.dto'
import { PublicProfileDto } from './dto/public-user.dto'
import { JwtPayload } from './jwt-payload.interface'
import { UserRepository } from './user.repository'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    private jwtService: JwtService
  ) {}

  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    return this.userRepository.createUser(authCredentialsDto)
  }

  async logIn(
    authCredentialsDto: AuthCredentialsDto
  ): Promise<{ accessToken: string }> {
    const { username, password } = authCredentialsDto

    const user = await this.userRepository.findOneBy({ username })

    if (user && (await bcrypt.compare(password, user.password))) {
      const payload: JwtPayload = { username }
      const accessToken = await this.jwtService.sign(payload)
      return { accessToken }
    } else throw new UnauthorizedException('Wrong authentication credentials')
  }

  async getAllusers(): Promise<PublicProfileDto[]> {
    return this.userRepository.getAllUsers()
  }
}
