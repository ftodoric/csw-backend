import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { InjectRepository } from '@nestjs/typeorm'

import { Request } from 'express'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { JwtPayload } from './jwt-payload.interface'
import { User } from './user.entity'
import { UserRepository } from './user.repository'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(UserRepository) private userRepository: UserRepository
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const data = request?.cookies['jwt']

          if (!data) {
            return null
          }

          return data.accessToken
        },
      ]),
    })
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { username } = payload
    const user: User = await this.userRepository.findOneBy({ username })

    if (!user) throw new UnauthorizedException()

    return user
  }
}
