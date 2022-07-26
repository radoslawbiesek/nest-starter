import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { createMockRepository, MockRepository } from '../common/test-utils';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<MockRepository>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('returns the user object if the user exists', async () => {
      const email = faker.internet.email();
      const expectedUser = {};
      userRepository.findOne?.mockResolvedValueOnce(expectedUser);

      const user = await service.findOne(email);

      expect(userRepository.findOne).toHaveBeenLastCalledWith({
        where: { email },
      });
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(user).toEqual(expectedUser);
    });

    it('returns null if the user does not exist', async () => {
      const invalidEmail = faker.internet.email();
      userRepository.findOne?.mockResolvedValueOnce(undefined);

      const user = await service.findOne(invalidEmail);

      expect(user).toBeNull();
    });
  });

  describe('create', () => {
    it('uses the hashed password to save in the database', async () => {
      const email = faker.internet.email();
      const password = faker.internet.password();
      const hashedPassword = faker.datatype.string();
      const id = faker.datatype.number();
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementationOnce(() => Promise.resolve(hashedPassword));
      userRepository.findOne?.mockResolvedValueOnce(undefined);
      userRepository.create?.mockResolvedValueOnce(
        Promise.resolve({ id, email, password }),
      );

      await service.create({ email, password });

      expect((bcrypt.hash as jest.Mock).mock.calls[0][0]).toBe(password);
      expect(userRepository.create).toHaveBeenCalledWith({
        email,
        password: hashedPassword,
      });
      expect(userRepository.create).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledTimes(1);
    });

    it('throws BadRequestException if the user with given email already exists', async () => {
      const email = faker.internet.email();
      const password = faker.internet.password();
      const id = faker.datatype.number();
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(Promise.resolve({ email, password, id }));

      try {
        await service.create({ email, password });
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.message).toMatchInlineSnapshot(
          `"User with given email already exists"`,
        );
      }
    });
  });
});
