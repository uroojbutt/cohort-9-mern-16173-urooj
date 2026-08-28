import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { expect } from 'chai';
import { CreateNoteDto } from './create-note.dto';

describe('CreateNoteDto', () => {
  describe('validation', () => {
    it('should pass validation with a valid title and content', async () => {
      const dto = plainToInstance(CreateNoteDto, {
        title: 'Valid Title',
        content: 'Valid content',
      });
      const errors = await validate(dto);
      expect(errors.length).to.equal(0);
    });

    it('should fail validation when title is empty/whitespace-only', async () => {
      const dto = plainToInstance(CreateNoteDto, {
        title: '   ',
        content: 'some content',
      });
      const errors = await validate(dto);
      expect(errors.length).to.be.greaterThan(0);
    });

    it('should fail validation when title exceeds 150 characters', async () => {
      const dto = plainToInstance(CreateNoteDto, {
        title: 'a'.repeat(151),
        content: 'some content',
      });
      const errors = await validate(dto);
      expect(errors.length).to.be.greaterThan(0);
    });

    it('should pass validation when title is exactly at the 150 character limit', async () => {
      const dto = plainToInstance(CreateNoteDto, {
        title: 'a'.repeat(150),
        content: 'some content',
      });
      const errors = await validate(dto);
      expect(errors.length).to.equal(0);
    });

    it('should pass validation when content is undefined', async () => {
      const dto = plainToInstance(CreateNoteDto, {
        title: 'Valid Title',
      });
      const errors = await validate(dto);
      expect(errors.length).to.equal(0);
    });

    it('should fail validation when content is not a string', async () => {
      const dto = plainToInstance(CreateNoteDto, {
        title: 'Valid Title',
        content: 123,
      });
      const errors = await validate(dto);
      expect(errors.length).to.be.greaterThan(0);
    });
  });
});