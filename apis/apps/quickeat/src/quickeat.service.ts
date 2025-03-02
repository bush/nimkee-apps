import { Injectable } from '@nestjs/common';

@Injectable()
export class QuickeatService {
  getHello(): string {
    return 'Hello World!';
  }
}
