import { Transform } from "class-transformer";
import { IsInt, IsString, Matches, Max, MaxLength, Min, MinLength } from "class-validator";
import {
  normalizeUsername,
  USERNAME_MAX,
  USERNAME_MESSAGE,
  USERNAME_PATTERN,
} from "../common/username";

// bcrypt only uses the first 72 bytes, so cap passwords there.
const PASSWORD = { min: 8, max: 72 };

export class CreatePlayerDto {
  @Transform(({ value }) => normalizeUsername(value))
  @MaxLength(USERNAME_MAX)
  @Matches(USERNAME_PATTERN, { message: USERNAME_MESSAGE })
  username: string;

  @IsString()
  @MinLength(PASSWORD.min)
  @MaxLength(PASSWORD.max)
  password: string;
}

export class RenamePlayerDto {
  @Transform(({ value }) => normalizeUsername(value))
  @MaxLength(USERNAME_MAX)
  @Matches(USERNAME_PATTERN, { message: USERNAME_MESSAGE })
  username: string;
}

export class SetPasswordDto {
  @IsString()
  @MinLength(PASSWORD.min)
  @MaxLength(PASSWORD.max)
  password: string;
}

export class SetVialsDto {
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  available: number;
}
