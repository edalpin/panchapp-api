import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class LoginWithGoogleInput {
  @Field(() => String)
  idToken!: string;
}
