import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Usuário já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, 'user']
    );

    const token = jwt.sign({ id: newUser.rows[0].id, email, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ message: 'Usuário cadastrado com sucesso!', token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao cadastrar usuário' });
  }
});

router.post('/registerAdmin', authMiddleware, async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem criar novos administradores.' });
    }

    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Usuário já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, 'admin']
    );

    const token = jwt.sign({ id: newUser.rows[0].id, email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ message: 'Administrador cadastrado com sucesso!', token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao cadastrar administrador' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Senha incorreta' });
    }

    const role = user.rows[0].role || 'user';

    const token = jwt.sign(
      { id: user.rows[0].id, email, role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({ message: 'Login bem-sucedido!', token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]);
    res.status(200).json(user.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar perfil do usuário' });
  }
});

export default router;
