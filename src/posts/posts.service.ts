import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from  '../prisma/prisma.service'
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
	constructor(private prisma: PrismaService) {}

	create(dto: CreatePostDto, authorId: number) {
		return this.prisma.post.create({
			data: {
				...dto,
				authorId,
			},
		});
	}

	findAll() {
		return this.prisma.post.findMany({
			include: { author: { select: { id: true, name: true, email: true } } },
		});
	}

	async findOne(id: number) {
		const post = await this.prisma.post.findUnique({
			where: { id },
			include: { author: { select: { id: true, name: true, email: true} } },
		});

		if (!post) {
			throw new NotFoundException('Post not found');
		}

		return post;
	}

	async update(id: number, dto: UpdatePostDto, userId: number) {
		const post = await this.prisma.post.findUnique({ where : { id } });

		if (!post) {
			throw new NotFoundException('Post not found');
		}

		if (post.authorId !== userId) {
			throw new ForbiddenException('You can only update your own posts');
		}

		return this.prisma.post.update({
			where: { id },
			data: dto,
		})
	}

	async remove(id: number, userId: number) {
		const post = await this.prisma.post.findUnique({ where: { id } });

		if (!post) {
			throw new NotFoundException('Post not found');
		}

		if (post.authorId !== userId) {
			throw new  ForbiddenException('You can only delete your own posts');
		}

		return this.prisma.post.delete({ where: { id } });
	}

}
