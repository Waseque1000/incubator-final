import jwt from 'jsonwebtoken';

export function verifyToken(req) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    return null;
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
    return verified;
  } catch (err) {
    return null;
  }
}
