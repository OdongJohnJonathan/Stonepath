import jwt from 'jsonwebtoken';

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      is_premium: user.is_premium || false,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};