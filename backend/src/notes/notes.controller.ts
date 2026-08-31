import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { NotesService, ExportNotesResponse } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Note } from './schemas/note.schema';

export interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateNoteDto): Promise<Note> {
    return this.notesService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest): Promise<Note[]> {
    return this.notesService.findAll(req.user.userId);
  }

  @Get('export')
  async exportNotes(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ExportNotesResponse> {
    let data: ExportNotesResponse;
    try {
      data = await this.notesService.exportNotes(req.user.userId);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException(
        `Failed to export notes: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const date = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="notes-export-${date}.json"`,
      'Cache-Control': 'no-store',
    });
    return data;
  }

  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  importNotes(
  @Req() req: AuthenticatedRequest,
  @UploadedFile() file: Express.Multer.File,
): Promise<{ imported: number; skipped: number }> {
  if (!file) {
    throw new BadRequestException('No file uploaded');
  }
  return this.notesService.importNotes(req.user.userId, file.buffer, file.originalname);
}

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<Note> {
    return this.notesService.findOne(req.user.userId, id);
  }

  @Put(':id')
  update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateNoteDto): Promise<Note> {
    return this.notesService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<void> {
    return this.notesService.remove(req.user.userId, id);
  }
}