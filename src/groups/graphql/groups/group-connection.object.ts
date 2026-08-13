import { PageInfo } from '@/core/pagination/page-info.object';
import { Group } from '@/groups/graphql/groups/group.object';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GroupConnection {
  @Field(() => [Group])
  nodes!: Group[];

  @Field(() => PageInfo)
  pageInfo!: PageInfo;
}
