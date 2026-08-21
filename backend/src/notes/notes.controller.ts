import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(@Req() req:any, @Body() dto: CreateNoteDto) {
    return this.notesService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Req() req:any) {
    return this.notesService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req:any, @Param('id') id: string) {
    return this.notesService.findOne(req.user.userId, id);
  }

  @Put(':id')
  update(@Req() req:any, @Param('id') id: string, @Body() dto: UpdateNoteDto) {
    return this.notesService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req:any, @Param('id') id: string) {
    return this.notesService.remove(req.user.userId, id);
  }
}