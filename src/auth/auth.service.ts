import { Injectable } from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import * as _ from 'lodash';

import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findOne(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      return _.omit(user, 'password');
    }

    return null;
  }
}
