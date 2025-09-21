import { Injectable } from '@nestjs/common';

@Injectable()
export class ServiceDemoService {
  getHello(): string {
    return 'Hello World!';
  }
}
