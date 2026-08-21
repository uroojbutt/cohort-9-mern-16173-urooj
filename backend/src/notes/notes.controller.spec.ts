import { Test, TestingModule } from '@nestjs/testing';
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

  const mockNotesService: jest.Mocked<Pick<NotesService, 'create' | 'findAll' | 'findOne' | 'update' | 'remove'>> = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
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
    jest.clearAllMocks();
  });

  it('create should delegate to service with req.user.userId', async () => {
    const dto: CreateNoteDto = { title: 'Test', content: '<p>x</p>' };
    mockNotesService.create.mockResolvedValue({ ...dto, userId: mockReq.user.userId } as any);

    const result = await controller.create(mockReq, dto);

    expect(service.create).toHaveBeenCalledWith(mockReq.user.userId, dto);
    expect(result).toMatchObject(dto);
  });

  it('findAll should delegate to service with req.user.userId', async () => {
    mockNotesService.findAll.mockResolvedValue([]);

    const result = await controller.findAll(mockReq);

    expect(service.findAll).toHaveBeenCalledWith(mockReq.user.userId);
    expect(result).toEqual([]);
  });

  it('findOne should delegate to service with id and userId', async () => {
    mockNotesService.findOne.mockResolvedValue({ _id: 'note-1' } as any);

    const result = await controller.findOne(mockReq, 'note-1');

    expect(service.findOne).toHaveBeenCalledWith(mockReq.user.userId, 'note-1');
    expect(result).toEqual({ _id: 'note-1' });
  });

  it('update should delegate to service with id, userId and dto', async () => {
    const dto: UpdateNoteDto = { title: 'Updated' };
    mockNotesService.update.mockResolvedValue({ _id: 'note-1', ...dto } as any);

    const result = await controller.update(mockReq, 'note-1', dto);

    expect(service.update).toHaveBeenCalledWith(mockReq.user.userId, 'note-1', dto);
    expect(result).toMatchObject(dto);
  });

  it('remove should delegate to service with id and userId', async () => {
    mockNotesService.remove.mockResolvedValue(undefined);

    const result = await controller.remove(mockReq, 'note-1');

    expect(service.remove).toHaveBeenCalledWith(mockReq.user.userId, 'note-1');
    expect(result).toBeUndefined();
  });
});