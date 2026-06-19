import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      status: 'ok',
      message: 'Intercontinental Crest API is active',
      timestamp: new Date().toISOString(),
    };
  }
}
