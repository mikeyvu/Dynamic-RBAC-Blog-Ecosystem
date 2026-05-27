import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  // Create new post, automatically assign the current logged in userId
  async create(
    createPostDto: CreatePostDto,
    userId: number,
    imageUrl: string | null,
  ) {
    console.log('1.Url dc truyen vao service:', imageUrl);
    return this.prisma.post.create({
      data: {
        title: createPostDto.title, // Gán thủ công tường minh
        content: createPostDto.content, // Gán thủ công tường minh
        authorId: userId,
        imageUrl: imageUrl,
      },
    });
  }

  // Get all post from database, include user information for frontend to map email
  async findAll() {
    return this.prisma.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', //sort from newest post on top
      },
    });
  }

  // Update Post. Declined if it's not the user's post
  async update(id: number, updatePostDto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Cannot find post with id #${id}`);
    }

    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
    });
  }

  // Delete post. Same logic with update post
  async remove(id: number, userId: number, userRole: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Cannot find post with id #${id} to delete!`);
    }

    await this.prisma.post.delete({ where: { id } });
    return { message: `Successfully deleted post #${id}!` };
  }
}
