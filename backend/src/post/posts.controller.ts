import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { diskStorage } from 'multer';

@Controller('posts')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PostsController {
  constructor(private readonly postService: PostsService) {}

  @Post()
  @RequirePermissions('post:create', 'post:manage')
  @UseInterceptors(
    FileInterceptor('image', {
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
    @UploadedFile() file: Express.Multer.File,
  ) {
    // check file ở terminal backend
    console.log('1. FILE BẮT ĐƯỢC TỪ MULTER:', file);
    console.log('2. DỮ LIỆU DTO TỪ BODY:', createPostDto);
    let imageUrl: string | null = null;
    if (file) {
      imageUrl = `/uploads/${file.filename}`;
    }

    const userId = Number(req.user.userId);
    return this.postService.create(createPostDto, userId, imageUrl);
  }

  @Get()
  findAll() {
    return this.postService.findAll();
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
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.postService.remove(id, req.user.userId, req.user.role);
  }
}
