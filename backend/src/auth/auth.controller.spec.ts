import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
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
  

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});