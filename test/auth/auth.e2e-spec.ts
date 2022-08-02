import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import * as request from 'supertest';
import { faker } from '@faker-js/faker';

import { AuthModule } from '../../src/auth/auth.module';
import { UsersModule } from '../../src/users/users.module';
import config from '../../src/config/config';

describe('[Feature] Auth - /auth', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [config],
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5433,
          username: 'postgres',
          password: 'postgres',
          database: 'postgres',
          autoLoadEntities: true,
          synchronize: true,
        }),
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Flow', () => {
    it('register, login and receiving user information', async () => {
      const email = faker.internet.email();
      const password = faker.internet.password();

      // Register
      const registerResult = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ password, email });

      expect(registerResult.statusCode).toBe(HttpStatus.CREATED);
      expect(registerResult.body.email).toBe(email);
      expect(registerResult.body).toHaveProperty('id');
      expect(registerResult.body).not.toHaveProperty('password');

      // Login with invalid password
      const loginError = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'invalid_password', email });

      expect(loginError.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(loginError.body.message).toMatchInlineSnapshot(`"Unauthorized"`);

      // Login
      const loginResult = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password, email });

      expect(loginResult.statusCode).toBe(HttpStatus.CREATED);
      expect(loginResult.body).toHaveProperty('accessToken');

      // Authenticated request
      const meResult = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${loginResult.body.accessToken}`);

      expect(meResult.statusCode).toBe(HttpStatus.OK);
      expect(meResult.body.email).toBe(email);
      expect(meResult.body.id).toBe(registerResult.body.id);
      expect(meResult.body).not.toHaveProperty('password');
    });
  });

  describe('Register [POST /register]', () => {
    const email = faker.internet.email();
    const shortPassword = faker.internet.password(7);
    const password = faker.internet.password();

    it('password is required', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ email })
        .expect(HttpStatus.BAD_REQUEST)
        .then((error) => {
          expect(error.body.message).toMatchInlineSnapshot(`
                      Array [
                        "password must be longer than or equal to 8 characters",
                        "password should not be empty",
                      ]
                  `);
        });
    });

    it('password must no be too short', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: shortPassword })
        .expect(HttpStatus.BAD_REQUEST)
        .then((error) => {
          expect(error.body.message).toMatchInlineSnapshot(`
                      Array [
                        "password must be longer than or equal to 8 characters",
                      ]
                  `);
        });
    });

    it('email is required', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ password })
        .expect(HttpStatus.BAD_REQUEST)
        .then((error) => {
          expect(error.body.message).toMatchInlineSnapshot(`
                      Array [
                        "email must be an email",
                        "email should not be empty",
                      ]
                  `);
        });
    });

    it('email must be valid', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ password, email: 'invalid_email' })
        .expect(HttpStatus.BAD_REQUEST)
        .then((error) => {
          expect(error.body.message).toMatchInlineSnapshot(`
                      Array [
                        "email must be an email",
                      ]
                  `);
        });
    });

    it('email must be unique', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ password, email });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ password, email })
        .expect(HttpStatus.BAD_REQUEST)
        .then((error) => {
          expect(error.body.message).toMatchInlineSnapshot(
            `"User with given email already exists"`,
          );
        });
    });
  });

  describe('Login [POST /login]', () => {
    const email = faker.internet.email();
    const password = faker.internet.password();

    it('password is required', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email })
        .expect(HttpStatus.UNAUTHORIZED)
        .then((error) => {
          expect(error.body.message).toMatchInlineSnapshot(`"Unauthorized"`);
        });
    });

    it('email is required', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ password })
        .expect(HttpStatus.UNAUTHORIZED)
        .then((error) => {
          expect(error.body.message).toMatchInlineSnapshot(`"Unauthorized"`);
        });
    });

    it('user must exist', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(HttpStatus.UNAUTHORIZED)
        .then((error) => {
          expect(error.body.message).toMatchInlineSnapshot(`"Unauthorized"`);
        });
    });
  });

  describe('Me [GET /me]', () => {
    it('token is required', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(HttpStatus.UNAUTHORIZED)
        .then((error) => {
          expect(error.body.message).toMatchInlineSnapshot(`"Unauthorized"`);
        });
    });
  });
});
