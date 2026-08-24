import { Test, TestingModule } from '@nestjs/testing';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { NotesController, AuthenticatedRequest } from './notes.controller';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

describe('NotesController', () => {
  let controller: NotesController;
  let service: NotesService;

  const mockReq: AuthenticatedRequest = {
    user: { userId: 'user-123', email: 'test@example.com' },
  };

  const mockNotesService = {
    create: sinon.stub(),
    findAll: sinon.stub(),
    findOne: sinon.stub(),
    update: sinon.stub(),
    remove: sinon.stub(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [{ provide: NotesService, useValue: mockNotesService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotesController>(NotesController);
    service = module.get<NotesService>(NotesService);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('create should delegate to service with req.user.userId', async () => {
    const dto: CreateNoteDto = { title: 'Test', content: '<p>x</p>' };
    mockNotesService.create.resolves({ ...dto, userId: mockReq.user.userId });

    const result = await controller.create(mockReq, dto);

    expect(service.create).to.have.been.calledWith(mockReq.user.userId, dto);
    expect(result).to.deep.include(dto);
  });

  it('findAll should delegate to service with req.user.userId', async () => {
    mockNotesService.findAll.resolves([]);

    const result = await controller.findAll(mockReq);

    expect(service.findAll).to.have.been.calledWith(mockReq.user.userId);
    expect(result).to.deep.equal([]);
  });

  it('findOne should delegate to service with id and userId', async () => {
    mockNotesService.findOne.resolves({ _id: 'note-1' });

    const result = await controller.findOne(mockReq, 'note-1');

    expect(service.findOne).to.have.been.calledWith(mockReq.user.userId, 'note-1');
    expect(result).to.deep.equal({ _id: 'note-1' });
  });

  it('update should delegate to service with id, userId and dto', async () => {
    const dto: UpdateNoteDto = { title: 'Updated' };
    mockNotesService.update.resolves({ _id: 'note-1', ...dto });

    const result = await controller.update(mockReq, 'note-1', dto);

    expect(service.update).to.have.been.calledWith(mockReq.user.userId, 'note-1', dto);
    expect(result).to.deep.include(dto);
  });

  it('remove should delegate to service with id and userId', async () => {
    mockNotesService.remove.resolves(undefined);

    const result = await controller.remove(mockReq, 'note-1');

    expect(service.remove).to.have.been.calledWith(mockReq.user.userId, 'note-1');
    expect(result).to.be.undefined;
  });
});