import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Posts (e2e)', () => {
  let app: INestApplication<App>;

  const userA = {
    email: `userA@test.com`,
    password: 'password123',
    name: 'User A',
  };
  const userB = {
    email: `userB@test.com`,
    password: 'password123',
    name: 'User B',
  };

  let tokenA: string;
  let tokenB: string;
  let postId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // register & login user A (pemilik post)
    await request(app.getHttpServer()).post('/auth/register').send(userA);
    const loginA = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userA.email, password: userA.password });
    tokenA = loginA.body.access_token;

    // register & login user B (bukan pemilik, buat test ownership)
    await request(app.getHttpServer()).post('/auth/register').send(userB);
    const loginB = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userB.email, password: userB.password });
    tokenB = loginB.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /posts', () => {
    // request tanpa token harus ditolak
    it('should reject create without token', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'No Auth Post' })
        .expect(401);
    });

    // create post berhasil, authorId diambil dari token
    it('should create a post for the authenticated user', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'My First Post', content: 'Hello world' })
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe('My First Post');
          expect(res.body.authorId).toBeDefined();
          postId = res.body.id;
        });
    });

    // body tanpa title (required) harus ditolak
    it('should reject invalid body (missing title)', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ content: 'No title here' })
        .expect(400);
    });
  });

  describe('GET /posts', () => {
    // list semua post (protected, butuh token)
    it('should list all posts (authenticated)', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /posts/:id', () => {
    // detail post termasuk info author (relasi)
    it('should get post detail with author info', () => {
      return request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(postId);
          expect(res.body.author).toBeDefined();
        });
    });

    // post yang gak ada harus 404
    it('should return 404 for non-existent post', () => {
      return request(app.getHttpServer())
        .get('/posts/999999')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });
  });

  describe('PATCH /posts/:id (ownership)', () => {
    // owner boleh update post miliknya
    it('should allow owner to update their post', () => {
      return request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Updated Title' })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Updated Title');
        });
    });

    // user lain ga boleh update post yang bukan miliknya
    it('should reject update from a different user (403)', () => {
      return request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'Hacked Title' })
        .expect(403);
    });
  });

  describe('DELETE /posts/:id (ownership)', () => {
    // user lain ga boleh delete post yang bukan miliknya
    it('should reject delete from a different user (403)', () => {
      return request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);
    });

    // owner boleh delete post miliknya
    it('should allow owner to delete their post', () => {
      return request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
    });

    // post yang udah dihapus harus 404 kalau diakses lagi
    it('should return 404 after post is deleted', () => {
      return request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });
  });
});
