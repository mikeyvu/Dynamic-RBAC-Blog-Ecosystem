import { Injectable, NotFoundException } from '@nestjs/common';
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
    imageUrls: string[],
  ) {
    console.log('1.Url dc truyen vao service:', imageUrls);
    return this.prisma.post.create({
      data: {
        title: createPostDto.title,
        content: createPostDto.content,
        authorId: userId,
        documents: {
          createMany: {
            data: imageUrls.map((url) => ({ imageUrl: url })),
          },
        },
      },
      include: {
        documents: true,
      },
    });
  }

  // Get all post from database, include user information and documents for frontend
  async findAll() {
    return this.prisma.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        documents: true, // 🌟 THÊM DÒNG NÀY: Trả kèm mảng ảnh về cho Frontend map ra giao diện
      },
      orderBy: {
        createdAt: 'desc', // sort from newest post on top
      },
    });
  }

  // Update Post. Handle text updates and optional new image attachment
  async update(id: number, updatePostDto: UpdatePostDto, newImageUrl?: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Cannot find post with id #${id}`);
    }

    // Luồng xử lý update động
    return this.prisma.post.update({
      where: { id },
      data: {
        title: updatePostDto.title,
        content: updatePostDto.content,
        // 🌟 Nếu người dùng upload thêm ảnh mới khi edit, chèn thêm một bản ghi vào bảng PostDocument
        ...(newImageUrl && {
          documents: {
            create: {
              imageUrl: newImageUrl,
            },
          },
        }),
      },
      include: {
        documents: true, // Trả về kèm cấu trúc ảnh mới nhất sau khi sửa
      },
    });
  }

  // Delete post. Since cascade delete is enabled in schema, it will auto delete related documents
  async remove(id: number) {
    // 🌟 SỬA DÒNG NÀY: Loại bỏ các tham số thừa trùng khớp với Controller
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Cannot find post with id #${id} to delete!`);
    }

    await this.prisma.post.delete({ where: { id } });
    return { message: `Successfully deleted post #${id}!` };
  }
}
