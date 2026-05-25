import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './post/posts.module';

//	The root module of the application.
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PostsModule,
    // UserModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
