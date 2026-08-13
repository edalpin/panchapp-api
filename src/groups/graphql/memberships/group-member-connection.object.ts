import { PageInfo } from '@/core/pagination/page-info.object';
import { User } from '@/users/graphql/user.object';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GroupMemberConnection {
  @Field(() => [User])
  nodes!: User[];

  @Field(() => PageInfo)
  pageInfo!: PageInfo;
}
