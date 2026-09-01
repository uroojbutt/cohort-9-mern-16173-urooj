import { Test, TestingModule } from '@nestjs/testing';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { NotesController, AuthenticatedRequest } from './notes.controller';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './schemas/note.schema';

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

describe('NotesController', () => {
  let controller: NotesController;
  let service: sinon.SinonStubbedInstance<NotesService>;
  let mockNotesService: sinon.SinonStubbedInstance<NotesService>;

  const mockReq: AuthenticatedRequest = {
    user: { userId: 'user-123', email: 'test@example.com' },
  };

  beforeEach(async () => {
    try {
      // Create a Sinon-stubbed instance so methods like `.resolves()` exist and are typed.
      mockNotesService = sinon.createStubInstance(NotesService);

      const module: TestingModule = await Test.createTestingModule({
        controllers: [NotesController],
        providers: [{ provide: NotesService, useValue: mockNotesService }],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => true })
        .compile();

      controller = module.get<NotesController>(NotesController);
      service = module.get(NotesService) as unknown as sinon.SinonStubbedInstance<NotesService>;
    } catch (err) {
      throw new Error(
        `NotesController test fixture setup failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  });

  afterEach(() => {
    sinon.restore();
  });

  it('create should delegate to service with req.user.userId', async () => {
    const dto: CreateNoteDto = { title: 'Test', content: '<p>x</p>' };
    mockNotesService.create.resolves({ ...dto, userId: mockReq.user.userId } as unknown as Note);

    try {
      const result = await controller.create(mockReq, dto);

      expect(service.create).to.have.been.calledWith(mockReq.user.userId, dto);
      expect(result).to.deep.include(dto);
    } catch (err) {
      throw withTestContext(err, 'NotesController#create should delegate to service with req.user.userId');
    }
  });

  it('findAll should delegate to service with req.user.userId', async () => {
    mockNotesService.findAll.resolves([]);

    try {
      const result = await controller.findAll(mockReq);

      expect(service.findAll).to.have.been.calledWith(mockReq.user.userId);
      expect(result).to.deep.equal([]);
    } catch (err) {
      throw withTestContext(err, 'NotesController#findAll should delegate to service with req.user.userId');
    }
  });

  it('findOne should delegate to service with id and userId', async () => {
    mockNotesService.findOne.resolves({ _id: 'note-1' } as unknown as Note);

    try {
      const result = await controller.findOne(mockReq, 'note-1');

      expect(service.findOne).to.have.been.calledWith(mockReq.user.userId, 'note-1');
      expect(result).to.deep.equal({ _id: 'note-1' });
    } catch (err) {
      throw withTestContext(err, 'NotesController#findOne should delegate to service with id and userId');
    }
  });

  it('update should delegate to service with id, userId and dto', async () => {
    const dto: UpdateNoteDto = { title: 'Updated' };
    mockNotesService.update.resolves({ _id: 'note-1', ...dto } as unknown as Note);

    try {
      const result = await controller.update(mockReq, 'note-1', dto);

      expect(service.update).to.have.been.calledWith(mockReq.user.userId, 'note-1', dto);
      expect(result).to.deep.include(dto);
    } catch (err) {
      throw withTestContext(err, 'NotesController#update should delegate to service with id, userId and dto');
    }
  });

  it('remove should delegate to service with id and userId', async () => {
    mockNotesService.remove.resolves(undefined);

    try {
      const result = await controller.remove(mockReq, 'note-1');

      expect(service.remove).to.have.been.calledWith(mockReq.user.userId, 'note-1');
      expect(result).to.be.undefined;
    } catch (err) {
      throw withTestContext(err, 'NotesController#remove should delegate to service with id and userId');
    }
  });
});