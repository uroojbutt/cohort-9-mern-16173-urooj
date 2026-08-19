import { Injectable, ConflictException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

export interface AuthResponse {
  access_token: string;
  user: { id: string; email: string; name: string };
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(email: string, password: string, name: string): Promise<AuthResponse> {
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');

    try {
      const hashed = await bcrypt.hash(password, 10);
      const user = await this.usersService.create(email, hashed, name);
      return this.buildAuthResponse(user._id.toString(), user.email, user.name);
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException('Email already registered');
      }
      throw new InternalServerErrorException('Signup failed');
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    let user;
    try {
      user = await this.usersService.findByEmailWithPassword(email);
    } catch {
      throw new InternalServerErrorException('Login failed');
    }

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    return this.buildAuthResponse(user._id.toString(), user.email, user.name);
  }

  private buildAuthResponse(userId: string, email: string, name: string): AuthResponse {
    const payload = { sub: userId, email };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: userId, email, name },
    };
  }
}