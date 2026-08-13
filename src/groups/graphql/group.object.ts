import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { GroupStatus } from './group-status.enum';

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
