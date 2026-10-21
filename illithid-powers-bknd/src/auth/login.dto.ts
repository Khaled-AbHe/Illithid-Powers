import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { normalizeUsername } from "../common/username";

export class LoginDto {
  // Same canonical form names are stored in, so how it was typed doesn't matter.
  @Transform(({ value }) => normalizeUsername(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  username: string;

  // bcrypt only uses the first 72 bytes, so cap the input there.
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password: string;
}
