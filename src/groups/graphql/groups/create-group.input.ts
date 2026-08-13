import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateGroupInput {
  @Field(() => String)
  name!: string;
}
