import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException, Logger } from '@nestjs/common';
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
  db: { startSession: sinon.SinonStub };
};

/** Error with a test-identifying context tag attached in catch blocks below. */
interface TestContextError extends Error {
  testContext?: string;
}

function withTestContext(err: unknown, context: string): TestContextError {
  const wrapped: TestContextError =
    err instanceof Error ? err : new Error(String(err));
  wrapped.testContext = context;
  return wrapped;
}

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
    sinon.stub(Logger.prototype, 'error');

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
    model.create = sinon.stub().resolves();

    const fakeSession = {
      withTransaction: async (fn: () => Promise<void>) => {
        await fn();
      },
      endSession: sinon.stub().resolves(),
    };
    model.db = { startSession: sinon.stub().resolves(fakeSession) };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('create', () => {
    it('should create and return a note linked to the user', async () => {
      const dto: CreateNoteDto = { title: 'Test note', content: '<p>Hello</p>' };

      try {
        const result = await service.create(mockNote.userId, dto);

        expect(model).to.have.been.calledWith({ ...dto, userId: mockNote.userId });
        expect(result).to.deep.include(dto);
      } catch (err) {
        throw withTestContext(err, 'NotesService#create should create and return a note linked to the user');
      }
    });
  });

  describe('findAll', () => {
    it('should return notes scoped to the user, sorted by updatedAt desc', async () => {
      const exec = sinon.stub().resolves([mockNote]);
      const sort = sinon.stub().returns({ exec });
      model.find.returns({ sort });

      try {
        const result = await service.findAll(mockNote.userId);

        expect(model.find).to.have.been.calledWith({ userId: mockNote.userId });
        expect(sort).to.have.been.calledWith({ updatedAt: -1 });
        expect(result).to.deep.equal([mockNote]);
      } catch (err) {
        throw withTestContext(err, 'NotesService#findAll should return notes scoped to the user, sorted by updatedAt desc');
      }
    });
  });

  describe('findOne', () => {
    it('should return a note when found and owned by the user', async () => {
      const exec = sinon.stub().resolves(mockNote);
      model.findOne.returns({ exec });

      try {
        const result = await service.findOne(mockNote.userId, mockNote._id);

        expect(model.findOne).to.have.been.calledWith({
          _id: mockNote._id,
          userId: mockNote.userId,
        });
        expect(result).to.deep.equal(mockNote);
      } catch (err) {
        throw withTestContext(err, 'NotesService#findOne should return a note when found and owned by the user');
      }
    });

    it('should throw NotFoundException for an invalid id', async () => {
      try {
        await service.findOne(mockNote.userId, 'invalid-id');
        expect.fail('Expected NotFoundException to be thrown');
      } catch (err) {
        if (err instanceof NotFoundException) {
          expect(err).to.be.instanceOf(NotFoundException);
        } else {
          throw withTestContext(err, 'NotesService#findOne should throw NotFoundException for an invalid id');
        }
      }
    });

    it('should throw NotFoundException when note is not found', async () => {
      const exec = sinon.stub().resolves(null);
      model.findOne.returns({ exec });

      try {
        await service.findOne(mockNote.userId, mockNote._id);
        expect.fail('Expected NotFoundException to be thrown');
      } catch (err) {
        if (err instanceof NotFoundException) {
          expect(err).to.be.instanceOf(NotFoundException);
        } else {
          throw withTestContext(err, 'NotesService#findOne should throw NotFoundException when note is not found');
        }
      }
    });
  });

  describe('update', () => {
    it('should update and return the note when owned by the user', async () => {
      const updated = { ...mockNote, title: 'Updated' };
      const exec = sinon.stub().resolves(updated);
      model.findOneAndUpdate.returns({ exec });

      try {
        const result = await service.update(mockNote.userId, mockNote._id, {
          title: 'Updated',
        });

        expect(model.findOneAndUpdate).to.have.been.calledWith(
          { _id: mockNote._id, userId: mockNote.userId },
          { title: 'Updated' },
          { new: true, runValidators: true },
        );
        expect(result).to.deep.equal(updated);
      } catch (err) {
        throw withTestContext(err, 'NotesService#update should update and return the note when owned by the user');
      }
    });

    it('should throw NotFoundException when note is not found', async () => {
      const exec = sinon.stub().resolves(null);
      model.findOneAndUpdate.returns({ exec });

      try {
        await service.update(mockNote.userId, mockNote._id, { title: 'x' });
        expect.fail('Expected NotFoundException to be thrown');
      } catch (err) {
        if (err instanceof NotFoundException) {
          expect(err).to.be.instanceOf(NotFoundException);
        } else {
          throw withTestContext(err, 'NotesService#update should throw NotFoundException when note is not found');
        }
      }
    });
  });

  describe('remove', () => {
    it('should delete the note with the correct ownership filter', async () => {
      const exec = sinon.stub().resolves({ deletedCount: 1 });
      model.deleteOne.returns({ exec });

      try {
        const result = await service.remove(mockNote.userId, mockNote._id);
        expect(result).to.be.undefined;

        expect(model.deleteOne).to.have.been.calledWith({
          _id: mockNote._id,
          userId: mockNote.userId,
        });
      } catch (err) {
        throw withTestContext(err, 'NotesService#remove should delete the note with the correct ownership filter');
      }
    });

    it('should throw NotFoundException when nothing was deleted', async () => {
      const exec = sinon.stub().resolves({ deletedCount: 0 });
      model.deleteOne.returns({ exec });

      try {
        await service.remove(mockNote.userId, mockNote._id);
        expect.fail('Expected NotFoundException to be thrown');
      } catch (err) {
        if (err instanceof NotFoundException) {
          expect(err).to.be.instanceOf(NotFoundException);
        } else {
          throw withTestContext(err, 'NotesService#remove should throw NotFoundException when nothing was deleted');
        }
      }
    });
  });

  describe('importNotes', () => {
    it('should throw BadRequestException for invalid JSON', async () => {
      const buffer = Buffer.from('{not valid json', 'utf-8');

      try {
        await service.importNotes(mockNote.userId, buffer, 'test.json');
        expect.fail('Expected BadRequestException to be thrown');
      } catch (err) {
        if (err instanceof BadRequestException) {
          expect(err).to.be.instanceOf(BadRequestException);
        } else {
          throw withTestContext(err, 'NotesService#importNotes should throw BadRequestException for invalid JSON');
        }
      }
    });

    it('should throw BadRequestException for an unrecognized file format', async () => {
      const buffer = Buffer.from(JSON.stringify({ foo: 'bar' }), 'utf-8');

      try {
        await service.importNotes(mockNote.userId, buffer, 'test.json');
        expect.fail('Expected BadRequestException to be thrown');
      } catch (err) {
        if (err instanceof BadRequestException) {
          expect(err).to.be.instanceOf(BadRequestException);
        } else {
          throw withTestContext(err, 'NotesService#importNotes should throw BadRequestException for an unrecognized file format');
        }
      }
    });

    it('should skip notes that fail DTO validation', async () => {
      const buffer = Buffer.from(JSON.stringify([{ content: 'no title' }]), 'utf-8');

      try {
        const result = await service.importNotes(mockNote.userId, buffer, 'test.json');

        expect(result).to.deep.equal({ imported: 0, skipped: 1 });
        expect(model.create.called).to.be.false;
      } catch (err) {
        throw withTestContext(err, 'NotesService#importNotes should skip notes that fail DTO validation');
      }
    });

    it('should skip a note whose _id already exists for the user', async () => {
      const buffer = Buffer.from(
        JSON.stringify([{ _id: mockNote._id, title: 'Dup', content: 'x' }]),
        'utf-8',
      );
      const exec = sinon.stub().resolves(mockNote);
      model.findOne.returns({ session: sinon.stub().returns({ exec }) });

      try {
        const result = await service.importNotes(mockNote.userId, buffer, 'test.json');

        expect(result).to.deep.equal({ imported: 0, skipped: 1 });
        expect(model.create.called).to.be.false;
      } catch (err) {
        throw withTestContext(err, 'NotesService#importNotes should skip a note whose _id already exists for the user');
      }
    });

    it('should import a valid new note (accepts { notes: [...] } wrapper too)', async () => {
      const buffer = Buffer.from(
        JSON.stringify({ notes: [{ title: 'Imported', content: 'body' }] }),
        'utf-8',
      );
      model.create.resolves(mockNote);

      try {
        const result = await service.importNotes(mockNote.userId, buffer, 'test.json');

        expect(result).to.deep.equal({ imported: 1, skipped: 0 });
        expect(model.create.calledOnce).to.be.true;
      } catch (err) {
        throw withTestContext(err, 'NotesService#importNotes should import a valid new note (accepts { notes: [...] } wrapper too)');
      }
    });

    it('should skip and log when create throws for a note', async () => {
      const buffer = Buffer.from(
        JSON.stringify([{ title: 'Imported', content: 'body' }]),
        'utf-8',
      );
      model.create.rejects(new Error('DB write failed'));

      try {
        const result = await service.importNotes(mockNote.userId, buffer, 'test.json');

        expect(result).to.deep.equal({ imported: 0, skipped: 1 });
      } catch (err) {
        throw withTestContext(err, 'NotesService#importNotes should skip and log when create throws for a note');
      }
    });
  });
});