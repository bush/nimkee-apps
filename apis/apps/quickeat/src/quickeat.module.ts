import { Module } from '@nestjs/common';
import { QuickeatController } from './quickeat.controller';
import { QuickeatService } from './quickeat.service';

@Module({
  imports: [],
  controllers: [QuickeatController],
  providers: [QuickeatService],
})
export class QuickeatModule {}
