import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePostDto, authorId: number) {
    return this.prisma.post.create({
      data: { ...dto, authorId },
    });
  }

  findAll() {
    return this.prisma.post.findMany({
      include: { author: { select: { id: true, name: true, email: true } } },
    });
  }

  findById(id: number) {
    return this.prisma.post.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
  }

  update(id: number, dto: UpdatePostDto) {
    return this.prisma.post.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: number) {
    return this.prisma.post.delete({ where: { id } });
  }
}