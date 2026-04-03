import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('JWT_SECRET no está definido. Revisa tu .env.');
    return res.status(500).json({ message: 'Configuración del servidor incompleta.' });
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.warn('Token inválido o expirado:', err.message);
      return res.sendStatus(401);
    }
    req.user = user;
    next();
  });
};