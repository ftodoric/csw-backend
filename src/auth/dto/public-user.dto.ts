import { User } from '@auth/entities'

export class PublicProfileDto {
  id: string
  username: string

  static fromUserEntity(user: User) {
    const profile = new PublicProfileDto()
    profile.id = user.id
    profile.username = user.username
    return profile
  }
}
