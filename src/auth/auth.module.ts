import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserRepository } from './user.repository'
import { User } from './user.entity'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { JwtStrategy } from './jwt.strategy'
import { ConfigService } from '@nestjs/config'
import { jwtConfigOptions } from 'src/config/jwt.config'

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
  exports: [JwtStrategy, PassportModule],
  providers: [AuthService, UserRepository, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
