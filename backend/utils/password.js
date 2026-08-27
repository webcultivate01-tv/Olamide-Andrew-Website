import bcrypt from "bcrypt";

// 10 rounds is the usual default: slow enough to make cracking expensive,
// fast enough that logging in still feels instant.
const SALT_ROUNDS = 10;

// Turns "Admin123" into "$2b$10$....". Only the hash is ever saved to MySQL.
export const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

// Checks a typed password against the stored hash. Returns true or false.
export const comparePassword = async (plainPassword, passwordHash) => {
  return bcrypt.compare(plainPassword, passwordHash);
};
