import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class LeaveGroupPayload {
  @Field(() => Boolean)
  left!: boolean;

  @Field(() => Boolean)
  archived!: boolean;
}
