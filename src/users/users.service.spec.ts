import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';

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
    it('should return the user object if the user exists', async () => {
      const email = 'test@test.com';
      const expectedUser = {};
      userRepository.findOne?.mockResolvedValueOnce(expectedUser);

      const user = await service.findOne(email);

      expect(userRepository.findOne).toHaveBeenLastCalledWith({
        where: { email },
      });
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(user).toEqual(expectedUser);
    });

    it('should throw the NotFoundException if the user does not exist', async () => {
      const invalidEmail = 'test@test.com';
      userRepository.findOne?.mockResolvedValueOnce(undefined);

      try {
        await service.findOne(invalidEmail);
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
        expect(err.message).toMatchInlineSnapshot(`"User not found"`);
      }
    });
  });

  describe('create', () => {
    it('should use the hashed password to save in the database', async () => {
      const email = 'test@test.com';
      const password = 'password';
      const hashedPassword = 'hashedPassword';
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(hashedPassword));

      await service.create({ email, password });

      expect((bcrypt.hash as jest.Mock).mock.calls[0][0]).toBe(password);
      expect(userRepository.create).toHaveBeenCalledWith({
        email,
        password: hashedPassword,
      });
      expect(userRepository.create).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
