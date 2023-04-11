import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import * as bcrypt from 'bcrypt'
import { DataSource, Repository } from 'typeorm'

import { AuthCredentialsDto, PublicProfileDto } from './dto'
import { User } from './entities'

@Injectable()
export class AuthRepository extends Repository<User> {
  constructor(dataSource: DataSource) {
    super(User, dataSource.createEntityManager())
  }

  async createUser(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const { username, password } = authCredentialsDto

    // Hash password
    const salt = await bcrypt.genSalt()
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = this.create({ username, password: hashedPassword })
    try {
      await this.save(user)
    } catch (error) {
      // Duplicate username
      if (error.code === '23505')
        throw new ConflictException('Username already exists.')
      else throw new InternalServerErrorException()
    }
  }

  async getAllUsers(): Promise<PublicProfileDto[]> {
    const query = this.createQueryBuilder('user')

    const users: User[] = await query.getMany()

    return users.map((user) => {
      return PublicProfileDto.fromUserEntity(user)
    })
  }
}
