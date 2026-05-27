import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty({ message: 'Cannot leave title blank!' })
  @IsString()
  @Length(3, 100, { message: 'Title must be between 3 and 100 characters' })
  title!: string;

  @IsNotEmpty({ message: 'Cannot leave content blank!' })
  @IsString()
  content!: string;
}
