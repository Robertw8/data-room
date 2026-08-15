import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from 'prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { hash, compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await hash(dto.password, 12);

    const createdUser = await this.prisma.user.create({
      data: { email: dto.email, passwordHash },
      omit: { passwordHash: true },
    });

    // Returning access token after registration unless we'd have email confirmation
    const accessToken = await this.generateAccessToken(createdUser);

    return { accessToken };
  }

  async login(dto: LoginDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!existingUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatches = await compare(
      dto.password,
      existingUser.passwordHash,
    );

    if (!isPasswordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.generateAccessToken(existingUser);

    return { accessToken };
  }

  private generateAccessToken(user: {
    id: string;
    email: string;
  }): Promise<string> {
    return this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });
  }
}
