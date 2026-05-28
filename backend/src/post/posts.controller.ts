import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';
import { UpdatePostDto } from './dto/update-post.dto';
import { RequirePermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionGuard } from 'src/auth/guards/permissions.guard';
import { IsAuthorGuard } from 'src/auth/guards/is-author.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { diskStorage } from 'multer';

@Controller('posts')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PostsController {
  constructor(private readonly postService: PostsService) {}

  @Post()
  @RequirePermissions('post:create', 'post:manage')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          //generate unique filename by using timestamp to avoid override
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      // Limit to only allow image file upload
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
          return callback(new Error('Only image files are allowed.'), false);
        }
        callback(null, true);
      },
    }),
  )
  create(
    @Body() createPostDto: CreatePostDto,
    @Req() req: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const imageFiles = (req as any).files || files; // Đảm bảo bắt trọn mảng file từ multer bóc ra
    const imageUrls: string[] = [];

    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach((file: Express.Multer.File) => {
        imageUrls.push(`/uploads/${file.filename}`);
      });
    }
    const userId = Number(req.user.userId);
    return this.postService.create(createPostDto, userId, imageUrls);
  }

  @Get()
  findAll(
    @Query('hasImage') hasImage?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // 🌟 Đẩy toàn bộ các tham số lọc này vào trong Service để Prisma xử lý câu lệnh WHERE
    return this.postService.findAll({
      hasImage,
      startDate,
      endDate,
      page,
      limit,
    });
  }

  @Patch(':id')
  @UseGuards(IsAuthorGuard)
  @RequirePermissions('post:update', 'post:manage')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postService.update(id, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(IsAuthorGuard)
  @RequirePermissions('post:delete', 'post:manage')
  remove(@Param('id', ParseIntPipe) id: number) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.postService.remove(id);
  }
}
