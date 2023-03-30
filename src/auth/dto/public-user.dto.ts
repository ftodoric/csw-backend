import { User } from '../user.entity'

export class PublicProfileDto {
  username: string

  static fromUserEntity(user: User) {
    const profile = new PublicProfileDto()
    profile.username = user.username
    return profile
  }
}
