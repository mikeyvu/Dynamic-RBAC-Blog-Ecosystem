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
  async findAll(query: {
    hasImage?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
  }) {
    const { hasImage, startDate, endDate, page, limit } = query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.max(Number(limit) || 10, 1);
    const skip = (currentPage - 1) * perPage;

    // Khởi tạo object điều kiện lọc mặc định rỗng
    const whereCondition: any = {};

    // 1. Logic lọc theo khoảng ngày (Created Date Range)
    if (startDate || endDate) {
      whereCondition.createdAt = {};
      if (startDate) {
        whereCondition.createdAt.gte = new Date(startDate); // Lớn hơn hoặc bằng ngày bắt đầu
      }
      if (endDate) {
        whereCondition.createdAt.lte = new Date(endDate); // Nhỏ hơn hoặc bằng ngày kết thúc
      }
    }

    // 2. Logic lọc bài post CÓ ẢNH hoặc KHÔNG CÓ ẢNH
    if (hasImage !== undefined) {
      if (hasImage === 'true') {
        // Có ảnh: tức là số lượng bản ghi quan hệ trong bảng postDocument phải > 0
        whereCondition.documents = {
          some: {}, // Có ít nhất 1 document liên kết
        };
      } else if (hasImage === 'false') {
        // Không có ảnh: không tồn tại bất kỳ bản ghi nào trong bảng postDocument
        whereCondition.documents = {
          none: {}, // Không có document nào liên kết
        };
      }
    }

    // Thực thi query bốc data từ DB lên
    const [totalItems, posts] = await Promise.all([
      this.prisma.post.count({ where: whereCondition }), // Đếm tổng để tính số trang
      this.prisma.post.findMany({
        where: whereCondition,
        take: perPage, // 🌟 Ép Prisma chỉ lấy đúng lượng bài chỉ định
        skip: skip, // 🌟 Ép Prisma bỏ qua các bài của các trang trước
        include: {
          documents: true,
          user: { select: { email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / perPage);

    // 4. Trả về cấu trúc bọc metadata phân trang xịn sò
    return {
      meta: {
        totalItems,
        itemCount: posts.length,
        itemsPerPage: perPage,
        totalPages,
        currentPage,
      },
      items: posts, // Danh sách bài viết thực tế của trang đó
    };
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
