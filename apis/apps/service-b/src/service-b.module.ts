import { Module } from '@nestjs/common';
import { ServiceBService } from './service-b.service';
import { ServiceBController } from './service-b.controller';

@Module({
  controllers: [ServiceBController],
  providers: [ServiceBService],
})
export class ServiceBModule {}
