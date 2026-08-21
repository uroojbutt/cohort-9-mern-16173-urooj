import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types, Model } from 'mongoose';
import { NotesService } from './notes.service';
import { Note } from './schemas/note.schema';
import { CreateNoteDto } from './dto/create-note.dto';

type MockNoteModel = jest.Mock & {
  find: jest.Mock;
  findOne: jest.Mock;
  findOneAndUpdate: jest.Mock;
  deleteOne: jest.Mock;
};

const mockNote = {
  _id: new Types.ObjectId().toString(),
  title: 'Test note',
  content: '<p>Hello</p>',
  userId: new Types.ObjectId().toString(),
};

describe('NotesService', () => {
  let service: NotesService;
  let model: MockNoteModel;

  beforeEach(async () => {
    let module: TestingModule;
    try {
      module = await Test.createTestingModule({
        providers: [
          NotesService,
          {
            provide: getModelToken(Note.name),
            useValue: jest.fn().mockImplementation((dto) => ({
              ...dto,
              save: jest.fn().mockResolvedValue({ ...mockNote, ...dto }),
            })),
          },
        ],
      }).compile();
    } catch (err) {
      throw new Error(`NotesService test module failed to initialize: ${err}`);
    }

    service = module.get<NotesService>(NotesService);
    model = module.get(getModelToken(Note.name)) as MockNoteModel;

    model.find = jest.fn();
    model.findOne = jest.fn();
    model.findOneAndUpdate = jest.fn();
    model.deleteOne = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a note linked to the user', async () => {
      const dto: CreateNoteDto = { title: 'Test note', content: '<p>Hello</p>' };
      const result = await service.create(mockNote.userId, dto);

      expect(model).toHaveBeenCalledWith({ ...dto, userId: mockNote.userId });
      expect(result).toMatchObject(dto);
    });
  });

  describe('findAll', () => {
    it('should return notes scoped to the user, sorted by updatedAt desc', async () => {
      const exec = jest.fn().mockResolvedValue([mockNote]);
      const sort = jest.fn().mockReturnValue({ exec });
      model.find.mockReturnValue({ sort });

      const result = await service.findAll(mockNote.userId);

      expect(model.find).toHaveBeenCalledWith({ userId: mockNote.userId });
      expect(sort).toHaveBeenCalledWith({ updatedAt: -1 });
      expect(result).toEqual([mockNote]);
    });
  });

  describe('findOne', () => {
    it('should return a note when found and owned by the user', async () => {
      const exec = jest.fn().mockResolvedValue(mockNote);
      model.findOne.mockReturnValue({ exec });

      const result = await service.findOne(mockNote.userId, mockNote._id);

      expect(model.findOne).toHaveBeenCalledWith({
        _id: mockNote._id,
        userId: mockNote.userId,
      });
      expect(result).toEqual(mockNote);
    });

    it('should throw NotFoundException for an invalid id', async () => {
      await expect(
        service.findOne(mockNote.userId, 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when note is not found', async () => {
      const exec = jest.fn().mockResolvedValue(null);
      model.findOne.mockReturnValue({ exec });

      await expect(
        service.findOne(mockNote.userId, mockNote._id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the note when owned by the user', async () => {
      const updated = { ...mockNote, title: 'Updated' };
      const exec = jest.fn().mockResolvedValue(updated);
      model.findOneAndUpdate.mockReturnValue({ exec });

      const result = await service.update(mockNote.userId, mockNote._id, {
        title: 'Updated',
      });

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockNote._id, userId: mockNote.userId },
        { title: 'Updated' },
        { new: true, runValidators: true },
      );
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when note is not found', async () => {
      const exec = jest.fn().mockResolvedValue(null);
      model.findOneAndUpdate.mockReturnValue({ exec });

      await expect(
        service.update(mockNote.userId, mockNote._id, { title: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete the note with the correct ownership filter', async () => {
      const exec = jest.fn().mockResolvedValue({ deletedCount: 1 });
      model.deleteOne.mockReturnValue({ exec });

      await expect(
        service.remove(mockNote.userId, mockNote._id),
      ).resolves.toBeUndefined();

      expect(model.deleteOne).toHaveBeenCalledWith({
        _id: mockNote._id,
        userId: mockNote.userId,
      });
    });

    it('should throw NotFoundException when nothing was deleted', async () => {
      const exec = jest.fn().mockResolvedValue({ deletedCount: 0 });
      model.deleteOne.mockReturnValue({ exec });

      await expect(
        service.remove(mockNote.userId, mockNote._id),
      ).rejects.toThrow(NotFoundException);
    });
  });
});