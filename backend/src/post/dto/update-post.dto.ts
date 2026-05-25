import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class UpdatePostDto extends PartialType(CreatePostDto) {}
