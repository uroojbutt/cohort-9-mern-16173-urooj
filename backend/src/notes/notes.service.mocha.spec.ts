import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { NotesService } from './notes.service';
import { Note } from './schemas/note.schema';
import { CreateNoteDto } from './dto/create-note.dto';

type MockNoteModel = sinon.SinonStub & {
  find: sinon.SinonStub;
  findOne: sinon.SinonStub;
  findOneAndUpdate: sinon.SinonStub;
  deleteOne: sinon.SinonStub;
  create: sinon.SinonStub;
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
    const modelConstructor = sinon
      .stub()
      .callsFake((dto: CreateNoteDto & { userId: string }) => ({
        ...dto,
        save: sinon.stub().resolves({ ...mockNote, ...dto }),
      })) as unknown as MockNoteModel;

    try {
      module = await Test.createTestingModule({
        providers: [
          NotesService,
          {
            provide: getModelToken(Note.name),
            useValue: modelConstructor,
          },
        ],
      }).compile();
    } catch (err) {
      throw new Error(`NotesService test module failed to initialize: ${err}`);
    }

    service = module.get<NotesService>(NotesService);
    model = module.get(getModelToken(Note.name)) as MockNoteModel;

    model.find = sinon.stub();
    model.findOne = sinon.stub();
    model.findOneAndUpdate = sinon.stub();
    model.deleteOne = sinon.stub();
    model.create = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('create', () => {
    it('should create and return a note linked to the user', async () => {
      const dto: CreateNoteDto = { title: 'Test note', content: '<p>Hello</p>' };
      const result = await service.create(mockNote.userId, dto);

      expect(model).to.have.been.calledWith({ ...dto, userId: mockNote.userId });
      expect(result).to.deep.include(dto);
    });

    it('should throw InternalServerErrorException when save fails', async () => {
      const failingConstructor = sinon.stub().callsFake(() => ({
        save: sinon.stub().rejects(new Error('DB write failed')),
      })) as unknown as MockNoteModel;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          NotesService,
          { provide: getModelToken(Note.name), useValue: failingConstructor },
        ],
      }).compile();
      const failingService = module.get<NotesService>(NotesService);

      try {
        await failingService.create(mockNote.userId, { title: 'x', content: 'y' });
        expect.fail('Expected InternalServerErrorException to be thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(InternalServerErrorException);
      }
    });
  });

  describe('findAll', () => {
    it('should return notes scoped to the user, sorted by updatedAt desc', async () => {
      const exec = sinon.stub().resolves([mockNote]);
      const sort = sinon.stub().returns({ exec });
      model.find.returns({ sort });

      const result = await service.findAll(mockNote.userId);

      expect(model.find).to.have.been.calledWith({ userId: mockNote.userId });
      expect(sort).to.have.been.calledWith({ updatedAt: -1 });
      expect(result).to.deep.equal([mockNote]);
    });

    it('should throw InternalServerErrorException when query fails', async () => {
      const sort = sinon.stub().returns({ exec: sinon.stub().rejects(new Error('DB error')) });
      model.find.returns({ sort });

      try {
        await service.findAll(mockNote.userId);
        expect.fail('Expected InternalServerErrorException to be thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(InternalServerErrorException);
      }
    });
  });

  describe('findOne', () => {
    it('should return a note when found and owned by the user', async () => {
      const exec = sinon.stub().resolves(mockNote);
      model.findOne.returns({ exec });

      const result = await service.findOne(mockNote.userId, mockNote._id);

      expect(model.findOne).to.have.been.calledWith({
        _id: mockNote._id,
        userId: mockNote.userId,
      });
      expect(result).to.deep.equal(mockNote);
    });

    it('should throw NotFoundException for an invalid id', async () => {
      try {
        await service.findOne(mockNote.userId, 'invalid-id');
        expect.fail('Expected NotFoundException to be thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(NotFoundException);
      }
    });

    it('should throw NotFoundException when note is not found', async () => {
      const exec = sinon.stub().resolves(null);
      model.findOne.returns({ exec });

      try {
        await service.findOne(mockNote.userId, mockNote._id);
        expect.fail('Expected NotFoundException to be thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(NotFoundException);
      }
    });

    it('should throw InternalServerErrorException when query fails', async () => {
      const exec = sinon.stub().rejects(new Error('DB error'));
      model.findOne.returns({ exec });

      try {
        await service.findOne(mockNote.userId, mockNote._id);
        expect.fail('Expected InternalServerErrorException to be thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(InternalServerErrorException);
      }
    });
  });

  describe('update', () => {
    it('should update and return the note when owned by the user', async () => {
      const updated = { ...mockNote, title: 'Updated' };
      const exec = sinon.stub().resolves(updated);
      model.findOneAndUpdate.returns({ exec });

      const result = await service.update(mockNote.userId, mockNote._id, {
        title: 'Updated',
      });

      expect(model.findOneAndUpdate).to.have.been.calledWith(
        { _id: mockNote._id, userId: mockNote.userId },
        { title: 'Updated' },
        { new: true, runValidators: true },
      );
      expect(result).to.deep.equal(updated);
    });

    it('should throw NotFoundException for an invalid id', async () => {
      try {
        await service.update(mockNote.userId, 'invalid-id', { title: 'x' });
        expect.fail('Expected NotFoundException to be thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(NotFoundException);
      }
    });

    it('should throw NotFoundException when note is not found', async () => {
      const exec = sinon.stub().resolves(null);
      model.findOneAndUpdate.returns({ exec });

      try {
        await service.update(mockNote.userId, mockNote._id, { title: 'x' });
        expect.fail('Expected NotFoundException to be thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(NotFoundException);
      }
    });

    it('should throw InternalServerErrorException when query fails', async () => {
      const exec = sinon.stub().rejects(new Error('DB error'));
      model.findOneAndUpdate.returns({ exec });

      try {
        await service.update(mockNote.userId, mockNote._id, { title: 'x' });
        expect.fail('Expected InternalServerErrorException to be thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(InternalServerErrorException);
      }
    });
  });

  describe('remove', () => {
    it('should delete the note with the correct ownership filter', async () => {
      const exec = sinon.stub().resolves({ deletedCount: 1 });
      model.deleteOne.returns({ exec });

      const result = await service.remove(mockNote.userId, mockNote._id);
      expect(result).to.be.undefined;

      expect(model.deleteOne).to.have.been.calledWith({
        _id: mockNote._id,
        userId: mockNote.userId,
      });
    });

    it('should throw NotFoundException for an invalid id', async () => {
      try {
        await service.remove(mockNote.userId, 'invalid-id');
        expect.fail('Expected NotFoundException to be thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(NotFoundException);
      }
    });

    it('should throw NotFoundException when nothing was deleted', async () => {
      const exec = sinon.stub().resolves({ deletedCount: 0 });
      model.deleteOne.returns({ exec });

      try {
        await service.remove(mockNote.userId, mockNote._id);
        expect.fail('Expected NotFoundException to be thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(NotFoundException);
      }
    });

    it('should throw InternalServerErrorException when query fails', async () => {
      const exec = sinon.stub().rejects(new Error('DB error'));
      model.deleteOne.returns({ exec });

      try {
        await service.remove(mockNote.userId, mockNote._id);
        expect.fail('Expected InternalServerErrorException to be thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(InternalServerErrorException);
      }
    });
  });

  describe('exportNotes', () => {
    it('should return exported notes with metadata', async () => {
      const exec = sinon.stub().resolves([mockNote]);
      const sort = sinon.stub().returns({ exec });
      model.find.returns({ sort });

      const result = await service.exportNotes(mockNote.userId);

      expect(result.count).to.equal(1);
      expect(result.notes).to.deep.equal([mockNote]);
      expect(result.exportedAt).to.be.a('string');
    });

    it('should throw InternalServerErrorException when query fails', async () => {
      const sort = sinon.stub().returns({ exec: sinon.stub().rejects(new Error('DB error')) });
      model.find.returns({ sort });

      try {
        await service.exportNotes(mockNote.userId);
        expect.fail('Expected InternalServerErrorException to be thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(InternalServerErrorException);
      }
    });
  });

  describe('importNotes', () => {
    it('should throw BadRequestException for invalid JSON', async () => {
      const buffer = Buffer.from('{not valid json', 'utf-8');

      try {
        await service.importNotes(mockNote.userId, buffer);
        expect.fail('Expected BadRequestException to be thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(BadRequestException);
      }
    });

    it('should throw BadRequestException for an unrecognized file format', async () => {
      const buffer = Buffer.from(JSON.stringify({ foo: 'bar' }), 'utf-8');

      try {
        await service.importNotes(mockNote.userId, buffer);
        expect.fail('Expected BadRequestException to be thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(BadRequestException);
      }
    });

    it('should skip notes that fail DTO validation', async () => {
      const buffer = Buffer.from(JSON.stringify([{ content: 'no title' }]), 'utf-8');

      const result = await service.importNotes(mockNote.userId, buffer);

      expect(result).to.deep.equal({ imported: 0, skipped: 1 });
      expect(model.create.called).to.be.false;
    });

    it('should skip a note whose _id already exists for the user', async () => {
      const buffer = Buffer.from(
        JSON.stringify([{ _id: mockNote._id, title: 'Dup', content: 'x' }]),
        'utf-8',
      );
      const exec = sinon.stub().resolves(mockNote);
      model.findOne.returns({ exec });

      const result = await service.importNotes(mockNote.userId, buffer);

      expect(result).to.deep.equal({ imported: 0, skipped: 1 });
      expect(model.create.called).to.be.false;
    });

    it('should import a valid new note (accepts { notes: [...] } wrapper too)', async () => {
      const buffer = Buffer.from(
        JSON.stringify({ notes: [{ title: 'Imported', content: 'body' }] }),
        'utf-8',
      );
      model.create.resolves(mockNote);

      const result = await service.importNotes(mockNote.userId, buffer);

      expect(result).to.deep.equal({ imported: 1, skipped: 0 });
      expect(model.create.calledOnce).to.be.true;
    });

    it('should skip and log when create throws for a note', async () => {
      const buffer = Buffer.from(
        JSON.stringify([{ title: 'Imported', content: 'body' }]),
        'utf-8',
      );
      model.create.rejects(new Error('DB write failed'));

      const result = await service.importNotes(mockNote.userId, buffer);

      expect(result).to.deep.equal({ imported: 0, skipped: 1 });
    });
  });
});