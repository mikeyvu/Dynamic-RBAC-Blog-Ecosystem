// 📄 Vị trí file: prisma/seed.ts
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import * as bcrypt from 'bcrypt';

// 🌟 FIX DỨT ĐIỂM RUNTIME ERROR: Khởi tạo Driver Adapter kết nối cho Postgres DB
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Truyền adapter xịn vào thay vì để object rỗng {} làm lỗi sập engine
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(
    '🌱 1. Bắt đầu dọn dẹp dữ liệu cũ (Bảo vệ tài khoản Super Admin)...',
  );
  const SUPER_ADMIN_EMAIL = 'test@example.com';

  // Xóa dữ liệu cũ theo thứ tự để tránh lỗi Khóa Ngoại
  await prisma.postDocument.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.userRole.deleteMany({});

  // Xóa sạch các User test cũ nhưng CHỪA LẠI tài khoản Super Admin
  await prisma.user.deleteMany({
    where: {
      email: {
        not: SUPER_ADMIN_EMAIL,
      },
    },
  });

  console.log('👑 2. Khởi tạo / Kiểm tra tài khoản Super Admin (ID = 1)...');
  const hashedAdminPassword = await bcrypt.hash('123456', 10);

  const adminRoleId = 1;

  const superAdmin = await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    update: {
      password: hashedAdminPassword, // Nếu admin đã có sẵn thì ghi đè mật khẩu mới thành 123456
    },
    create: {
      id: 1,
      email: SUPER_ADMIN_EMAIL,
      password: hashedAdminPassword,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdmin.id,
        roleId: adminRoleId,
      },
    },
    update: {}, // Nếu có liên kết rồi thì giữ nguyên
    create: {
      userId: superAdmin.id,
      roleId: adminRoleId,
    },
  });

  console.log(
    `👤 Super Admin hiện tại: ${superAdmin.email} (Mật khẩu đăng nhập: 123456)`,
  );

  console.log(
    '🚀 3. Tiến hành tạo 10 Users tác giả mới và gán cứng role Author (id: 3)...',
  );

  const sampleTitles = [
    'Học NestJS không khó',
    'Làm chủ Prisma ORM trong 5 phút',
    'Fix bug TypeScript xuyên màn đêm',
    'Tại sao code chạy được vậy?',
    'Kinh nghiệm setup Docker DB',
    'Xóa thư mục dist thần chưởng',
    'Xử lý lỗi Multipart Form Data',
    'Bẫy validation trong NestJS',
  ];

  // Vòng lặp tạo đúng 10 Users giả lập
  for (let u = 1; u <= 10; u++) {
    const email = `user.test${u}@example.com`;
    const authorRoleId = 3;

    // Tạo User tác giả và liên kết sang roleId: 3 trong bảng trung gian UserRole
    const createdUser = await prisma.user.create({
      data: {
        email: email,
        password: hashedAdminPassword, // Đồng nhất mật khẩu 123456 cho dễ test
        roles: {
          create: {
            roleId: authorRoleId,
          },
        },
      },
    });

    console.log(`   -> Đã tạo tác giả: ${email}`);

    // Vòng lặp sinh đúng 100 bài Post cho từng User tác giả vừa tạo
    for (let p = 1; p <= 100; p++) {
      const randomTitle =
        sampleTitles[Math.floor(Math.random() * sampleTitles.length)];

      // XỬ LÝ ẢNH ĐỘNG: Ngẫu nhiên từ 0 đến 3 ảnh cho mỗi bài post
      const imageCount = Math.floor(Math.random() * 4);
      const imageUrls: string[] = [];

      for (let i = 1; i <= imageCount; i++) {
        const randomImageId = Math.floor(Math.random() * 1000);
        imageUrls.push(`/uploads/seed-image-${randomImageId}.jpg`);
      }

      await prisma.post.create({
        data: {
          title: `${randomTitle} (Bài số ${p})`,
          content: `Đây là nội dung bài viết số ${p} dùng để kiểm tra tính năng phân quyền với role Author (id: 3) có sẵn trong hệ thống.`,
          authorId: createdUser.id, // 🌟 VÁ LỖI: Gọi chính xác biến createdUser.id ở vòng lặp cha
          documents: {
            createMany: {
              data: imageUrls.map((url) => ({ imageUrl: url })),
            },
          },
        },
      });
    }
  }

  console.log('====================================================');
  console.log('✅ SEED DỮ LIỆU HOÀN TẤT VÀ AN TOÀN!');
  console.log('====================================================');
}

// 🌟 ĐƯỢC ĐƯA RA NGOÀI HÀM MAIN: Đúng chuẩn cấu hình thực thi script độc lập
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e: Error) => {
    console.error('❌ Lỗi trong quá trình Seeding:', e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
