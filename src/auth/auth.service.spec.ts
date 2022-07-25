import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { createMockRepository } from '../common/test-utils';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;

  const email = 'test@test.com';
  const password = 'password';
  const id = 1;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        { provide: getRepositoryToken(User), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);

    jest
      .spyOn(usersService, 'findOne')
      .mockImplementation(() => Promise.resolve({ email, password, id }));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validate', () => {
    it('should return the user object without the password when the passwords match', async () => {
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementationOnce(() => Promise.resolve(true));

      const user = await service.validateUser(email, password);

      expect(user?.email).toBe(email);
      expect(user?.id).toBe(id);
      expect(user).not.toHaveProperty('password');
    });

    it('should return null when the passwords do not match', async () => {
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementationOnce(() => Promise.resolve(false));

      const user = await service.validateUser(email, password);

      expect(user).toBe(null);
    });
  });
});
