import { Test, TestingModule } from '@nestjs/testing';
import { expect } from 'chai';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    try {
      const app: TestingModule = await Test.createTestingModule({
        controllers: [AppController],
        providers: [AppService],
      }).compile();

      appController = app.get<AppController>(AppController);
    } catch (error) {
      console.error('Test setup failed:', error);
      throw error;
    }
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).to.equal('Hello World!');
    });
  });
});