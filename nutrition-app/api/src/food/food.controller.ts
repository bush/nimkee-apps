import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FoodService } from './food.service';
import { CreateFoodDto } from './dto/create-food.dto';

@ApiTags('foods')
@Controller('foods')
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Get()
  @ApiOperation({ summary: 'List all foods, optionally filtered by search query' })
  findAll(@Query('search') search?: string) { return this.foodService.findAll(search); }

  @Get(':key')
  @ApiOperation({ summary: 'Get a single food by key' })
  findOne(@Param('key') key: string) { return this.foodService.findOne(key); }

  @Post(':key')
  @ApiOperation({ summary: 'Add a custom food' })
  create(@Param('key') key: string, @Body() dto: CreateFoodDto) { return this.foodService.create(key, dto); }

  @Delete(':key')
  @ApiOperation({ summary: 'Remove a food' })
  remove(@Param('key') key: string) { this.foodService.remove(key); return { message: `Food "${key}" removed` }; }
}
