import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  create(email: string, password: string, name: string) {
    return this.userModel.create({ email, password, name });
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }
}