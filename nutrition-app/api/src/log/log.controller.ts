import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LogService } from './log.service';
import { AddEntryDto } from './dto/add-entry.dto';

@ApiTags('log')
@Controller('log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get()
  @ApiOperation({ summary: 'Get log entries for a date (default: today)' })
  getEntries(@Query('date') date?: string) { return this.logService.getEntries(date); }

  @Get('totals')
  @ApiOperation({ summary: 'Get macro totals for a date (default: today)' })
  getTotals(@Query('date') date?: string) { return this.logService.getTotals(date); }

  @Post()
  @ApiOperation({ summary: 'Add a food entry to the log' })
  addEntry(@Body() dto: AddEntryDto) { return this.logService.addEntry(dto); }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a log entry by ID' })
  removeEntry(@Param('id') id: string, @Query('date') date?: string) {
    this.logService.removeEntry(id, date);
    return { message: 'Entry removed' };
  }
}
