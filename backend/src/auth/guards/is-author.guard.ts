import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotFoundError } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class IsAuthorGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const postId = Number(request.params.id);

    if (!user) {
      throw new ForbiddenException('User authentication context is missing');
    }

    if (isNaN(postId)) {
      throw new NotFoundError('Invalid post ID format');
    }

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} does not exist`);
    }

    const isAdmin = user.role === 'Admin' || user.roles?.includes('Admin');
    const hasManagerPermission = user.permissions?.includes('post:manage');
    if (isAdmin || hasManagerPermission) {
      return true;
    }

    if (Number(post.authorId) !== Number(user.userId)) {
      throw new ForbiddenException(
        'Access denied. You can only edit your own post',
      );
    }
    return true;
  }
}
