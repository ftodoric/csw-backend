import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { AuthCredentialsDto } from './dto/auth-credentials.dto'
import { UserRepository } from './user.repository'
import * as bcrypt from 'bcrypt'
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception'
import { JwtService } from '@nestjs/jwt'
import { JwtPayload } from './jwt-payload.interface'
import { PublicProfileDto } from './dto/public-user.dto'

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
