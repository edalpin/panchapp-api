import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateGroupInput {
  @Field(() => ID)
  groupId!: string;

  @Field(() => String)
  name!: string;
}
