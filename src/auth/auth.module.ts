import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'

import { jwtConfigOptions } from '@config'

import { AuthController } from './auth.controller'
import { AuthRepository } from './auth.repository'
import { AuthService } from './auth.service'
import { User } from './entities'
import { JwtStrategy } from './jwt.strategy'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        jwtConfigOptions(configService),
    }),
    TypeOrmModule.forFeature([User]),
  ],
  exports: [PassportModule, JwtStrategy, AuthService],
  providers: [AuthService, AuthRepository, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
