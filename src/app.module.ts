import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthModule } from './auth/auth.module'
import { typeOrmConfig } from './config/typeorm.config'
import { GamesModule } from './games/games.module'
import { TeamsModule } from './teams/teams.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        typeOrmConfig(configService),
    }),
    AuthModule,
    GamesModule,
    TeamsModule,
  ],
})
export class AppModule {}
