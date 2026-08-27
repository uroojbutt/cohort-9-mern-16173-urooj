import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Note, NoteDocument } from './schemas/note.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

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
}