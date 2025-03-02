import { Controller, Get } from '@nestjs/common';
import { QuickeatService } from './quickeat.service';

@Controller()
export class QuickeatController {
  constructor(private readonly quickeatService: QuickeatService) {}

  @Get()
  getHello(): string {
    return this.quickeatService.getHello();
  }
}
