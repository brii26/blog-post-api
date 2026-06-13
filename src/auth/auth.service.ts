import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt'
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private jwtService: JwtService,
	) {}

	async register(dto: RegisterDto) {
		// check user exist in database?
		const existingUser = await this.prisma.user.findUnique({
			where: { email: dto.email },
		});
		if (existingUser) {
			throw new ConflictException('Email already registered');
		}

		// hash password
		const hashedPassword = await bcrypt.hash(dto.password, 10);

		// masuk database
		const user = await this.prisma.user.create({
			data: {
				email: dto.email,
				password: hashedPassword,
				name: dto.name,
			},
		});

		// exclude password
		const { password, ...result }= user;
		return result;
	}

	async login(dto: LoginDto) {
		// ambil user from database
		const user = await this.prisma.user.findUnique({
			where: { email: dto.email },
		});
		if (!user){
			throw new UnauthorizedException('Invalid credentials');
		}

		// check password matcch
		const passwordMatch = await bcrypt.compare(dto.password, user.password);
		if(!passwordMatch) {
			throw new UnauthorizedException('Invalid credentials');
		}

		// bikin token
		const payload = { sub: user.id, email: user.email };
		return {
			access_token: this.jwtService.sign(payload),
		};
	}
}
