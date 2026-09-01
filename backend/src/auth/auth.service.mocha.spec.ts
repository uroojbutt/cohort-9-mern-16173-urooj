import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: sinon.stub(),
    findByEmailWithPassword: sinon.stub(),
    create: sinon.stub(),
  };

  const mockJwtService = {
    sign: sinon.stub().returns('mock-token'),
  };

  beforeEach(async () => {
    try {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          { provide: UsersService, useValue: mockUsersService },
          { provide: JwtService, useValue: mockJwtService },
        ],
      }).compile();

      service = module.get<AuthService>(AuthService);
    } catch (error) {
      console.error('Failed to compile AuthService testing module:', error);
      throw error;
    }
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should be defined', () => {
    expect(service).to.exist;
  });
});