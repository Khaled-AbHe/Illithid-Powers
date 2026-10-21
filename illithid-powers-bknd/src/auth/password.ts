import bcrypt from "bcrypt";

/** bcrypt cost. Tests lower it via BCRYPT_ROUNDS; production keeps the default. */
export const bcryptRounds = () => Number(process.env.BCRYPT_ROUNDS ?? 12);

export const hashPassword = (password: string) => bcrypt.hash(password, bcryptRounds());
export const hashPasswordSync = (password: string) => bcrypt.hashSync(password, bcryptRounds());
