import { Controller, Get, Patch, Param, Body, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
	constructor(private usersService: UsersService) {}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.usersService.findOne(id);
	}

	@Patch(':id')
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateUserDto,
		@CurrentUser() user: { userId: number; email: string },
	) {
		if (user.userId !== id) {
			throw new ForbiddenException('You can only update your own profile');
		}
		return this.usersService.update(id, dto);
	}
}
