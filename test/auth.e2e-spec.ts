import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  const testUser = {
    email: `e2e-${Date.now()}@test.com`,
    password: 'password123',
    name: 'E2E Test User',
  };
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    // register success, password ga ikut di response
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          const body = res.body as { email: string; password?: string };
          expect(body.email).toBe(testUser.email);
          expect(body.password).toBeUndefined();
        });
    });

    // email yang sama ga boleh terdaftar dua kali
    it('should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });

    // format email salah harus ditolak
    it('should reject invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'not-an-email', password: 'password123' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    // login berhasil dan dapat access_token
    it('should login with correct credentials and return access_token', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200)
        .expect((res) => {
          const body = res.body as { access_token: string };
          expect(body.access_token).toBeDefined();
          accessToken = body.access_token;
        });
    });

    // password salah harus ditolak
    it('should reject wrong password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);
    });

    // email ga terdaftar harus ditolak
    it('should reject non-existent email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'password123' })
        .expect(401);
    });
  });

  describe('Protected routes', () => {
    // request tanpa token harus ditolak
    it('should reject request without token', () => {
      return request(app.getHttpServer()).get('/posts').expect(401);
    });

    // token ga valid harus ditolak
    it('should reject request with invalid token', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    // token valid boleh akses protected route
    it('should allow request with valid token', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });
});
