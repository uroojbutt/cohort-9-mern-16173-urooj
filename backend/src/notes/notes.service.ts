import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Note, NoteDocument } from './schemas/note.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
  ) {}

  async create(userId: string, dto: CreateNoteDto): Promise<Note> {
    const note = new this.noteModel({ ...dto, userId });
    return note.save();
  }

  async findAll(userId: string): Promise<Note[]> {
    return this.noteModel
      .find({ userId })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findOne(userId: string, id: string): Promise<Note> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Note not found');
    }
    const note = await this.noteModel.findOne({ _id: id, userId }).exec();
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  async update(userId: string, id: string, dto: UpdateNoteDto): Promise<Note> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Note not found');
    }
    const note = await this.noteModel
      .findOneAndUpdate({ _id: id, userId }, dto, { new: true })
      .exec();
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  async remove(userId: string, id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Note not found');
    }
    const result = await this.noteModel.deleteOne({ _id: id, userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Note not found');
    }
  }
}