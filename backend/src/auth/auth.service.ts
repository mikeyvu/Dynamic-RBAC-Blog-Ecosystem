import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const userExist = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (userExist) {
      throw new BadRequestException('This email is already existed!');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const defaultRole = await this.prisma.role.findFirst({
      where: { name: 'Author' },
    });

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        roles: defaultRole
          ? {
              create: {
                roleId: defaultRole.id,
              },
            }
          : undefined,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return {
      message: 'Sign up successfully! Welcome new Author',
      user: newUser,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Email has not been registered yet');
    }

    const isPasswordMatched = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordMatched) {
      throw new UnauthorizedException('Incorrect Password, please try again!');
    }

    const permissionSet = new Set<string>();
    const roleNames: string[] = [];

    if (user.roles) {
      for (const userRole of user.roles) {
        if (userRole.role) {
          roleNames.push(userRole.role.name);

          if (userRole.role.permissions) {
            for (const rolePerm of userRole.role.permissions) {
              if (rolePerm.permission?.code) {
                permissionSet.add(rolePerm.permission.code);
              }
            }
          }
        }
      }
    }

    // Change set to an array
    const permissions = Array.from(permissionSet);

    // LGet the main role (the role that stand the first in the array)
    const primaryRole = roleNames.length > 0 ? roleNames[0] : null;

    //construc token with user details
    const payload = {
      userId: user.id,
      email: user.email,
      role: primaryRole,
      permissions: permissions,
    };

    // Sign token
    const accessToken = this.jwtService.sign(payload);

    const { password, ...userWithoutPassword } = user;

    //Response to send to frontend
    return {
      message: 'Login Successfully!',
      access_token: accessToken,
      user: {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        roles: roleNames,
        permissions: permissions,
      },
    };
  }
}
