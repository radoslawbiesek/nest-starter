export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  database:
    process.env.NODE_ENV === 'test'
      ? {
          host: 'localhost',
          port: 5433,
          name: 'postgres',
          user: 'postgres',
          password: 'postgres',
          synchronize: true,
        }
      : {
          host: process.env.DATABASE_HOST || 'localhost',
          port: Number(process.env.DATABASE_PORT) || 5432,
          name: process.env.DATABASE_NAME || 'postgres',
          user: process.env.DATABASE_USER || 'postgres',
          password: process.env.DATABASE_PASSWORD || 'postgres',
          synchronize: process.env.NODE_ENV === 'development',
        },
  jwt: {
    secret: process.env.JWT_SECRET || 'secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '4h',
  },
});
