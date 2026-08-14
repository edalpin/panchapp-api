import { User } from '@/users/graphql/user.object';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthPayload {
  @Field(() => User)
  user!: User;
}
