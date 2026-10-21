import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AbilitiesModule } from './abilities/abilities.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { DbModule } from './db/db.module';
import { DmModule } from './dm/dm.module';
import { MeModule } from './me/me.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    AuthModule,
    MeModule,
    AbilitiesModule,
    DmModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
