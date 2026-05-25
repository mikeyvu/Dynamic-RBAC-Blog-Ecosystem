import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty({ message: 'Cannot leave title blank!' })
  @IsString()
  title!: string;

  @IsNotEmpty({ message: 'Cannot leave content blank!' })
  @IsString()
  content!: string;
}
