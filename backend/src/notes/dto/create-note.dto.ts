import { IsString, IsNotEmpty, MaxLength, IsOptional, Matches } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Matches(/\S/, { message: 'Title must not be empty or whitespace only' })
  title: string;

  @IsOptional()
  @IsString()
  content?: string;
}