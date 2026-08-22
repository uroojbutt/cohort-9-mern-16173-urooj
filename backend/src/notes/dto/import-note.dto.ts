import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ImportNoteDto {
  @IsOptional()
  @IsMongoId()
  _id?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  content?: string;
}