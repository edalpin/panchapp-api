import { GroupStatus } from '@/groups/graphql/groups/group-status.enum';
import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Group {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => Boolean)
  isPersonal!: boolean;

  @Field(() => GroupStatus)
  status!: GroupStatus;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}
