import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async findOne(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return null;
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const { password, email } = createUserDto;

    const existingUser = await this.findOne(email);

    if (existingUser) {
      throw new BadRequestException('User with given email already exists');
    } else {
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await this.userRepository.create({
        email,
        password: hashedPassword,
      });
      return this.userRepository.save(user);
    }
  }
}
