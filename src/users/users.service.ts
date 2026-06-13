import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) {}

	async findOne(id: number) {
		const user = await this.prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				email: true,
				name: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}

		return user;
	}

	async update(id: number, dto: UpdateUserDto) {
		await this.findOne(id);
		return this.prisma.user.update({
			where: { id },
			data: dto,
			select: {
				id: true,
				email: true,
				name: true,
				createdAt: true,
				updatedAt: true,
			},
		});
	}
}
