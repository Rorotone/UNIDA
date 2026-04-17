import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validar presencia y longitud
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son obligatorios.' });
    }
    if (username.trim().length < 3 || username.trim().length > 30) {
      return res.status(400).json({ message: 'El username debe tener entre 3 y 30 caracteres.' });
    }
    if (password.length < 6 || password.length > 72) {
      return res.status(400).json({ message: 'La contraseña debe tener entre 6 y 72 caracteres.' });
    }

    // Check if user already exists
    const [existingUsers] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'El usuario ya existe.' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const [result] = await db.execute('INSERT INTO users (username, password, rol) VALUES (?, ?, ?)', [username, hashedPassword, 'usuario']);
    
    res.status(201).json({ message: 'Usuario registrado exitosamente', userId: result.insertId });
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    res.status(500).json({ message: 'Error al registrar el usuario' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    const user = users[0];
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // Generate JWT
    const JWT_SECRET = process.env.JWT_SECRET;
    const token = jwt.sign({ userId: user.id, username: user.username, rol: user.rol }, JWT_SECRET, { expiresIn: '1h' });   
    
    res.json({ message: 'Inicio de sesión exitoso', token });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
  
};

export const getUsers = async (req, res) => {
    try {
      const [users] = await db.execute('SELECT id, username FROM users');
      res.status(200).json(users);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId; // From authenticateToken middleware

    // Find user
    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = users[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'La nueva contraseña debe ser diferente de la contraseña actual' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

    res.json({ message: 'Contraseña cambiada exitosamente' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Error al cambiar la contraseña' });
  }  
  
};

export const getUserProfile = async (req, res) => {
  try {
  const userId = req.user.userId; // From authenticateToken middleware

    // Fetch user profile details
  const [users] = await db.execute('SELECT id, username, rol FROM users WHERE id = ?', [userId]);
    
  if (users.length === 0) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

    const userProfile = users[0];
    
    res.json({
      id: userProfile.id,
      username: userProfile.username,
      rol: userProfile.rol
    });
  } catch (error) {
    console.error('Error al obtener el perfil del usuario:', error);
    res.status(500).json({ message: 'Error al obtener el perfil del usuario' });
  }
};