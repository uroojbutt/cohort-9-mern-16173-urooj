import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Note, NoteDocument } from './schemas/note.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { ImportNoteDto } from './dto/import-note.dto';

export interface ExportNotesResponse {
  exportedAt: string;
  count: number;
  notes: Note[];
}

const MAX_IMPORT_RECORDS = 500;

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
  ) {}

  async create(userId: string, dto: CreateNoteDto): Promise<Note> {
    try {
      const note = new this.noteModel({ ...dto, userId });
      return await note.save();
    } catch (err) {
      this.logger.error(`Failed to create note for user ${userId}`, err);
      throw new InternalServerErrorException('Could not create note');
    }
  }

  async findAll(userId: string): Promise<Note[]> {
    try {
      return await this.noteModel.find({ userId }).sort({ updatedAt: -1 }).exec();
    } catch (err) {
      this.logger.error(`Failed to fetch notes for user ${userId}`, err);
      throw new InternalServerErrorException('Could not fetch notes');
    }
  }

  async findOne(userId: string, id: string): Promise<Note> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Note not found');
    }
    let note: Note | null;
    try {
      note = await this.noteModel.findOne({ _id: id, userId }).exec();
    } catch (err) {
      this.logger.error(`Failed to fetch note ${id} for user ${userId}`, err);
      throw new InternalServerErrorException('Could not fetch note');
    }
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  async update(userId: string, id: string, dto: UpdateNoteDto): Promise<Note> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Note not found');
    }
    let note: Note | null;
    try {
      note = await this.noteModel
        .findOneAndUpdate({ _id: id, userId }, dto, { new: true, runValidators: true })
        .exec();
    } catch (err) {
      this.logger.error(`Failed to update note ${id} for user ${userId}`, err);
      throw new InternalServerErrorException('Could not update note');
    }
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  async remove(userId: string, id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Note not found');
    }
    let result: { deletedCount?: number };
    try {
      result = await this.noteModel.deleteOne({ _id: id, userId }).exec();
    } catch (err) {
      this.logger.error(`Failed to delete note ${id} for user ${userId}`, err);
      throw new InternalServerErrorException('Could not delete note');
    }
    if (!result.deletedCount) {
      throw new NotFoundException('Note not found');
    }
  }

  async exportNotes(userId: string): Promise<ExportNotesResponse> {
    try {
      const notes = await this.noteModel.find({ userId }).sort({ updatedAt: -1 }).exec();
      return {
        exportedAt: new Date().toISOString(),
        count: notes.length,
        notes,
      };
    } catch (err) {
      this.logger.error(`Failed to export notes for user ${userId}`, err);
      throw new InternalServerErrorException('Could not export notes');
    }
  }
  async importNotes(userId: string, fileBuffer: Buffer, filename: string): Promise<{ imported: number; skipped: number }> {
  const isTxt = filename.toLowerCase().endsWith('.txt');

  const rawNotes: unknown[] = isTxt
    ? this.parseTxtNotes(fileBuffer.toString('utf-8'))
    : this.parseJsonNotes(fileBuffer);

  if (rawNotes.length > MAX_IMPORT_RECORDS) {
    throw new BadRequestException(`Cannot import more than ${MAX_IMPORT_RECORDS} notes at once`);
  }

  const session = await this.noteModel.db.startSession();
  let imported = 0;
  let skipped = 0;

  try {
    await session.withTransaction(async () => {
      imported = 0;
      skipped = 0;

      for (const raw of rawNotes) {
        const dto = plainToInstance(ImportNoteDto, raw);
        const errors = await validate(dto);
        if (errors.length > 0) {
          skipped++;
          continue;
        }

        if (dto._id) {
          const existing = await this.noteModel
            .findOne({ _id: dto._id, userId })
            .session(session)
            .exec();
          if (existing) {
            skipped++;
            continue;
          }
        }

        await this.noteModel.create(
          [
            {
              ...(dto._id ? { _id: new Types.ObjectId(dto._id) } : {}),
              title: dto.title,
              content: dto.content ?? '',
              userId,
            },
          ],
          { session },
        );
        imported++;
      }
    });
  } catch (err) {
    this.logger.error(`Import transaction failed for user ${userId}`, err);
    throw new InternalServerErrorException('Could not complete import');
  } finally {
    await session.endSession();
  }

  return { imported, skipped };
}



  private parseJsonNotes(fileBuffer: Buffer): unknown[] {
    let parsed: unknown;
    try {
      parsed = JSON.parse(fileBuffer.toString('utf-8'));
    } catch {
      throw new BadRequestException('Invalid JSON file');
    }

    const rawNotes: unknown[] | null = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { notes?: unknown[] })?.notes)
        ? (parsed as { notes: unknown[] }).notes
        : null;

    if (!rawNotes) {
      throw new BadRequestException('Invalid import file format');
    }
    return rawNotes;
  }

  private parseTxtNotes(text: string): unknown[] {
  const blocks = text
    .split(/\n===NOTE===\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  if (blocks.length === 0) {
    throw new BadRequestException('Invalid or empty TXT file');
  }

  return blocks.map((block) => {
    const lines = block.split('\n');
    const title = lines[0]?.trim() ?? '';
    const content = lines.slice(1).join('\n').trim();
    return { title, content };
  });
}
}