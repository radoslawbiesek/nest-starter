import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { createMockRepository } from '../common/test-utils';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;

  const email = faker.internet.email();
  const password = faker.internet.password();
  const id = faker.datatype.number();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        JwtService,
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
    it('should return the user object when the passwords match', async () => {
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementationOnce(() => Promise.resolve(true));

      const user = await service.validateUser(email, password);

      expect(user?.email).toBe(email);
      expect(user?.id).toBe(id);
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
