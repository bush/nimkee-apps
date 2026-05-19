import { Module } from '@nestjs/common';
import { LambdaInvokeService } from './lambda-invoke.service';
import { ProxyDirectController } from './proxy-direct.controller';

@Module({
  providers: [LambdaInvokeService],
  controllers: [ProxyDirectController],
})
export class ProxyDirectModule {}
