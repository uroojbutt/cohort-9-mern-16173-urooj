import { Test, TestingModule } from '@nestjs/testing';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    signup: sinon.stub(),
    login: sinon.stub(),
  };

  beforeEach(async () => {
    try {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [{ provide: AuthService, useValue: mockAuthService }],
      }).compile();

      controller = module.get<AuthController>(AuthController);
    } catch (error) {
      console.error('Failed to compile AuthController testing module:', error);
      throw error;
    }
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should be defined', () => {
    expect(controller).to.exist;
  });
});