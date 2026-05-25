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
  async create(createPostDto: CreatePostDto, userId: number) {
    return this.prisma.post.create({
      data: {
        ...createPostDto,
        authorId: userId,
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
  async update(
    id: number,
    updatePostDto: UpdatePostDto,
    userId: number,
    userRole: string,
  ) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Cannot find post with id #${id}`);
    }

    // Only admin or the author can edit their posts
    const isAdmin = userRole?.toLowerCase() === 'admin';
    if (post.authorId !== userId && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to edit this post',
      );
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

    // Only admin or the author can delete their posts
    const isAdmin = userRole?.toLowerCase() === 'admin';
    if (post.authorId !== userId && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to delete this post',
      );
    }

    await this.prisma.post.delete({ where: { id } });
    return { message: `Successfully deleted post #${id}!` };
  }
}
