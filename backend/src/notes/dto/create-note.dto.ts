import { IsString, IsNotEmpty, MaxLength, Matches, ValidateIf } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Matches(/\S/, { message: 'Title must not be empty or whitespace only' })
  title: string;

  @ValidateIf((_obj, value) => value !== undefined)
  @IsString({ message: 'content must be a string, not null' })
  content?: string;
}