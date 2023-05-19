import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'

import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception'
import * as bcrypt from 'bcrypt'

import { AuthRepository } from './auth.repository'
import { AuthCredentialsDto, PublicProfileDto } from './dto'
import { User } from './entities'
import { JwtPayload } from './jwt-payload.interface'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AuthRepository)
    private userRepository: AuthRepository,
    private jwtService: JwtService
  ) {}

  /**
   * User registration.
   * @param authCredentialsDto
   * @returns {string} user ID
   */
  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<string> {
    return this.userRepository.createUser(authCredentialsDto)
  }

  /**
   * User log in.
   * @param authCredentialsDto
   * @returns {{ accessToken: string }} Access token used for authentication.
   */
  async logIn(authCredentialsDto: AuthCredentialsDto): Promise<{ accessToken: string }> {
    const { username, password } = authCredentialsDto

    const user = await this.userRepository.findOneBy({ username })

    if (user && (await bcrypt.compare(password, user.password))) {
      const payload: JwtPayload = { username }
      const accessToken = await this.jwtService.sign(payload)
      return { accessToken }
    } else throw new UnauthorizedException('Wrong authentication credentials.')
  }

  async getAllusers(): Promise<PublicProfileDto[]> {
    return this.userRepository.getAllUsers()
  }

  async getUserById(id: string): Promise<User> {
    return this.userRepository.getUserById(id)
  }
}
