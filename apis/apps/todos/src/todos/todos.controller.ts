import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpStatus,
  BadRequestException,
  ParseIntPipe
} from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { QueryTodoDto } from './dto/query-todo.dto';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ITodosController } from './interfaces/todos-controller';
import { Permissions } from '../permissions/permissions.decorator'
import { PermissionsGuard } from '../permissions/permissions.guard'

// https://auth0.com/blog/developing-a-secure-api-with-nestjs-adding-role-based-access-control/#Implement-Role-Based-Access-Control-in-NestJS

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('todos')
export class TodosController implements ITodosController {
  constructor(protected readonly todosService: TodosService) {}

  @Post()
  @Permissions('create:todos')
  create(@Body() createTodoDto: CreateTodoDto) {
    Logger.debug('Creating todo ...', TodosController.name);
    try {
      return this.todosService.create(createTodoDto);
    } catch(error) {
      Logger.log(error)
    }
  }

  //findAll(@Query('next') next?: string,  @Query('limit') limit?: number) {

  @Get()
  @Permissions('read:todos')
  findAll(@Query(new ValidationPipe({ transform: true })) query: QueryTodoDto) {
    Logger.debug('Finding all todos ...', TodosController.name);
    const { next, limit } = query;
    return this.todosService.findAll(next, limit);
  }

  // Not we don't need to define a custom error here, its just an
  // example to show how to override the error and provide a custom
  // message
  @Get(':id')
  @Permissions('read:todos')
  findOne(
    @Param(
      'id',
      new ParseUUIDPipe({
        errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
        exceptionFactory: () =>
          new BadRequestException('Invalid UUID format for Todo ID'),
      }),
    )
    id: string,
  ) {
    return this.todosService.findOne(id);
  }

  @Patch(':id')
  @Permissions('update:todos')
  update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto) {
    return this.todosService.update(id, updateTodoDto);
  }

  @Delete(':id')
  @Permissions('delete:todos')
  remove(@Param('id') id: string) {
    return this.todosService.remove(id);
  }
}
