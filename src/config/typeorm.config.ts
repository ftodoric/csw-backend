import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  url:
    configService.get('NODE_ENV') === 'test'
      ? configService.get('TEST_DATABASE_URL')
      : configService.get('DATABASE_URL'),
  autoLoadEntities: true,
  synchronize: true,
});
