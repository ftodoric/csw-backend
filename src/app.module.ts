import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthModule } from '@auth'
import { typeOrmConfig } from '@config'
import { GamesModule } from '@games'
import { PlayersController, PlayersModule } from '@players'
import { SeedModule } from '@seed'
import { TeamsModule } from '@teams'

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
    TeamsModule,
    GamesModule,
    PlayersModule,
    SeedModule,
  ],
  controllers: [PlayersController],
})
export class AppModule {}
