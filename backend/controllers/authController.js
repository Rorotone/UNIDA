import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';

export const register = async (req, res) => {
  try {
    const { username, password, rol, nombre } = req.body;
    
    // Validar presencia y longitud
    if (!username || !password || !nombre) {
      return res.status(400).json({ message: 'Usuario, contraseña y nombre son obligatorios.' });
    }
    if (username.trim().length < 3 || username.trim().length > 30) {
      return res.status(400).json({ message: 'El username debe tener entre 3 y 30 caracteres.' });
    }
    if (password.length < 6 || password.length > 72) {
      return res.status(400).json({ message: 'La contraseña debe tener entre 6 y 72 caracteres.' });
    }
    if (nombre.trim().length < 2 || nombre.trim().length > 100) {
      return res.status(400).json({ message: 'El nombre debe tener entre 2 y 100 caracteres.' });
    }

    const rolId = rol || null;
    if (!rolId) {
      return res.status(400).json({ message: 'El rol es obligatorio.' });
    }
    const [tipoUsuario] = await db.execute('SELECT id FROM tipo_usuario WHERE id = ?', [rolId]);
    if (tipoUsuario.length === 0) {
      return res.status(400).json({ message: 'El rol seleccionado no es válido.' });
    }

    // Check if user already exists
    const [existingUsers] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'El usuario ya existe.' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const [result] = await db.execute('INSERT INTO users (username, password, rol, nombre) VALUES (?, ?, ?, ?)', [username.trim(), hashedPassword, rolId, nombre.trim()]);
    
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
    const [users] = await db.execute(
      `SELECT u.*, t.tipo as rol_nombre
       FROM users u
       JOIN tipo_usuario t ON u.rol = t.id
       WHERE u.username = ?`,
      [username]
    );
    if (users.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    if (users[0].deleted_at) {
      return res.status(403).json({ message: 'Usuario deshabilitado. Contacta al administrador.' });
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
      const [users] = await db.execute('SELECT id, username, nombre FROM users WHERE deleted_at IS NULL');
      res.status(200).json(users);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getUsersAdmin = async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT u.id, u.username, u.nombre, u.rol, t.tipo AS rol_nombre,
              u.deleted_at
       FROM users u
       JOIN tipo_usuario t ON u.rol = t.id
       ORDER BY u.deleted_at IS NOT NULL ASC, u.nombre ASC`
    );
    res.status(200).json(users);
  } catch (error) {
    console.error('Error al obtener usuarios (admin):', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const enableUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.execute('SELECT id FROM users WHERE id = ? AND deleted_at IS NOT NULL', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado o ya está habilitado.' });
    }

    await db.execute('UPDATE users SET deleted_at = NULL WHERE id = ?', [id]);
    res.json({ message: 'Usuario habilitado exitosamente.' });
  } catch (error) {
    console.error('Error al habilitar usuario:', error);
    res.status(500).json({ message: 'Error al habilitar el usuario.' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, username, rol } = req.body;

    if (!nombre || !username || !rol) {
      return res.status(400).json({ message: 'Nombre, username y rol son obligatorios.' });
    }
    if (username.trim().length < 3 || username.trim().length > 30) {
      return res.status(400).json({ message: 'El username debe tener entre 3 y 30 caracteres.' });
    }
    if (nombre.trim().length < 2 || nombre.trim().length > 100) {
      return res.status(400).json({ message: 'El nombre debe tener entre 2 y 100 caracteres.' });
    }

    const [tipoUsuario] = await db.execute('SELECT id FROM tipo_usuario WHERE id = ?', [rol]);
    if (tipoUsuario.length === 0) {
      return res.status(400).json({ message: 'El rol seleccionado no es válido.' });
    }

    const [existing] = await db.execute('SELECT id FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const [conflict] = await db.execute(
      'SELECT id FROM users WHERE username = ? AND id <> ? AND deleted_at IS NULL',
      [username.trim(), id]
    );
    if (conflict.length > 0) {
      return res.status(400).json({ message: 'El username ya está en uso.' });
    }

    await db.execute(
      'UPDATE users SET nombre = ?, username = ?, rol = ? WHERE id = ?',
      [nombre.trim(), username.trim(), rol, id]
    );

    res.json({ message: 'Usuario actualizado exitosamente.' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar el usuario.' });
  }
};

export const disableUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    if (Number(id) === Number(adminId)) {
      return res.status(400).json({ message: 'No puedes deshabilitar tu propio usuario.' });
    }

    const [existing] = await db.execute('SELECT id FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado o ya deshabilitado.' });
    }

    await db.execute('UPDATE users SET deleted_at = NOW() WHERE id = ?', [id]);
    res.json({ message: 'Usuario deshabilitado exitosamente.' });
  } catch (error) {
    console.error('Error al deshabilitar usuario:', error);
    res.status(500).json({ message: 'Error al deshabilitar el usuario.' });
  }
};

export const getTiposUsuario = async (req, res) => {
  try {
    const [tipos] = await db.execute('SELECT id, tipo FROM tipo_usuario');
    res.status(200).json(tipos);
  } catch (error) {
    console.error('Error al obtener tipos de usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId; // From authenticateToken middleware

    // Find user
    const [users] = await db.execute('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL', [userId]);
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
  const [users] = await db.execute(
      `SELECT u.id, u.username, u.nombre, t.tipo as rol
       FROM users u
       JOIN tipo_usuario t ON u.rol = t.id
       WHERE u.id = ? AND u.deleted_at IS NULL`,
      [userId]
    );
    
  if (users.length === 0) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

    const userProfile = users[0];
    
    res.json({
      id: userProfile.id,
      username: userProfile.username,
      rol: userProfile.rol,
      nombre: userProfile.nombre
    });
  } catch (error) {
    console.error('Error al obtener el perfil del usuario:', error);
    res.status(500).json({ message: 'Error al obtener el perfil del usuario' });
  }
};