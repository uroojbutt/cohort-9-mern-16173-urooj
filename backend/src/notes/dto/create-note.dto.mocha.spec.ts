import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { expect } from 'chai';
import { CreateNoteDto } from './create-note.dto';

interface TestContextError extends Error {
  testContext?: string;
}

function withTestContext(err: unknown, context: string): TestContextError {
  const wrapped: TestContextError =
    err instanceof Error ? err : new Error(String(err));
  wrapped.testContext = context;
  return wrapped;
}

describe('CreateNoteDto', () => {
  describe('validation', () => {
    it('should pass validation with a valid title and content', async () => {
      const dto = plainToInstance(CreateNoteDto, {
        title: 'Valid Title',
        content: 'Valid content',
      });
      try {
        const errors = await validate(dto);
        expect(errors.length).to.equal(0);
      } catch (err) {
        throw withTestContext(
          err,
          'CreateNoteDto should pass validation with a valid title and content',
        );
      }
    });

    it('should fail validation when title is empty/whitespace-only', async () => {
      const dto = plainToInstance(CreateNoteDto, {
        title: '   ',
        content: 'some content',
      });
      try {
        const errors = await validate(dto);
        expect(errors.length).to.be.greaterThan(0);
      } catch (err) {
        throw withTestContext(
          err,
          'CreateNoteDto should fail validation when title is empty/whitespace-only',
        );
      }
    });

    it('should fail validation when title exceeds 150 characters', async () => {
      const dto = plainToInstance(CreateNoteDto, {
        title: 'a'.repeat(151),
        content: 'some content',
      });
      try {
        const errors = await validate(dto);
        expect(errors.length).to.be.greaterThan(0);
      } catch (err) {
        throw withTestContext(
          err,
          'CreateNoteDto should fail validation when title exceeds 150 characters',
        );
      }
    });

    it('should pass validation when title is exactly at the 150 character limit', async () => {
      const dto = plainToInstance(CreateNoteDto, {
        title: 'a'.repeat(150),
        content: 'some content',
      });
      try {
        const errors = await validate(dto);
        expect(errors.length).to.equal(0);
      } catch (err) {
        throw withTestContext(
          err,
          'CreateNoteDto should pass validation when title is exactly at the 150 character limit',
        );
      }
    });

    it('should pass validation when content is undefined', async () => {
      const dto = plainToInstance(CreateNoteDto, {
        title: 'Valid Title',
      });
      try {
        const errors = await validate(dto);
        expect(errors.length).to.equal(0);
      } catch (err) {
        throw withTestContext(
          err,
          'CreateNoteDto should pass validation when content is undefined',
        );
      }
    });

    it('should fail validation when content is not a string', async () => {
      const dto = plainToInstance(CreateNoteDto, {
        title: 'Valid Title',
        content: 123,
      });
      try {
        const errors = await validate(dto);
        expect(errors.length).to.be.greaterThan(0);
      } catch (err) {
        throw withTestContext(
          err,
          'CreateNoteDto should fail validation when content is not a string',
        );
      }
    });
  });
});