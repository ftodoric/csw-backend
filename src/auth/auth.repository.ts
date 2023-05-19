import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'

import * as bcrypt from 'bcrypt'
import { DataSource, Repository } from 'typeorm'

import { AuthCredentialsDto, PublicProfileDto } from './dto'
import { User } from './entities'

@Injectable()
export class AuthRepository extends Repository<User> {
  constructor(dataSource: DataSource) {
    super(User, dataSource.createEntityManager())
  }

  /**
   * Create a single user.
   * @param authCredentialsDto
   * @returns {string} user ID
   */
  async createUser(authCredentialsDto: AuthCredentialsDto): Promise<string> {
    const { username, password } = authCredentialsDto

    // Hash salted password
    const salt = await bcrypt.genSalt()
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = this.create({ username, password: hashedPassword })

    try {
      await this.save(user)
      return user.id
    } catch (error) {
      // Duplicate username
      if (error.code === '23505') throw new ConflictException('Username already exists.')
      else throw new InternalServerErrorException()
    }
  }

  /**
   * Gets the list of all users. With public information only.
   * @returns {PublicProfileDto[]}
   */
  async getAllUsers(): Promise<PublicProfileDto[]> {
    const query = this.createQueryBuilder('user')

    const users: User[] = await query.getMany()

    return users.map((user) => {
      return PublicProfileDto.fromUserEntity(user)
    })
  }

  /**
   * Gets a user by ID.
   * @param id
   * @returns {User}
   */
  async getUserById(id: string): Promise<User> {
    try {
      const user = await this.findOneBy({ id })
      return user
    } catch (error) {
      throw new NotFoundException('User with given ID not found.')
    }
  }
}
