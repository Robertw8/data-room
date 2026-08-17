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
import { Prisma } from 'src/generated/prisma/client';

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

    let createdUser: { id: string; email: string };

    try {
      createdUser = await this.prisma.user.create({
        data: { email: dto.email, passwordHash },
        omit: { passwordHash: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('User with this email already exists');
      }

      throw error;
    }

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
