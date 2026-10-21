import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class GoogleLoginDto {
  /** The ID token the browser received from Google. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  credential: string;
}
