import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserModel = {
    create: sinon.stub(),
    findOne: sinon.stub(),
  };

  beforeEach(async () => {
    try {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UsersService,
          { provide: getModelToken(User.name), useValue: mockUserModel },
        ],
      }).compile();

      service = module.get<UsersService>(UsersService);
    } catch (error) {
      console.error('Failed to compile UsersService testing module:', error);
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