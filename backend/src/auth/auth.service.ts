import { Injectable } from "@nestjs/common";
import { RegisterDto } from "./dto/register.dto";

@Injectable() 
export class AuthService {
    constructor(private readonly prisma: PrismaService) {}

    async register(dto: RegisterDto) {
        const userExist = await this.prisma.user.findUnique({
            
        })
    }
}