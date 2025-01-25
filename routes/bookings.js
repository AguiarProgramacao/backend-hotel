import express from 'express';
import pool from '../db/pool.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Criar uma reserva (Apenas usuários autenticados)
router.post('/add', authMiddleware, async (req, res) => {
  const { hotel_id, check_in, check_out } = req.body;
  const user_id = req.user.id;

  try {
    // Verifica se o hotel existe
    const hotel = await pool.query('SELECT price_per_night FROM hotels WHERE id = $1', [hotel_id]);

    if (hotel.rows.length === 0) {
      return res.status(404).json({ message: 'Hotel não encontrado' });
    }

    // Calcula o total da reserva
    const pricePerNight = hotel.rows[0].price_per_night;
    const nights = Math.ceil((new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24));
    const total_price = nights * pricePerNight;

    // Insere a reserva no banco
    const newBooking = await pool.query(
      'INSERT INTO bookings (user_id, hotel_id, check_in, check_out, total_price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, hotel_id, check_in, check_out, total_price]
    );

    res.status(201).json({ message: 'Reserva realizada com sucesso!', booking: newBooking.rows[0] });
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({ message: 'Erro ao criar reserva' });
  }
});

// Listar todas as reservas (Somente administradores)
// Listar reservas do usuário logado (Usuário comum)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let bookings;

    if (req.user.role === 'admin') {
      // Administradores podem visualizar todas as reservas
      bookings = await pool.query(
        'SELECT b.*, h.name as hotel_name, u.name as user_name FROM bookings b JOIN hotels h ON b.hotel_id = h.id JOIN users u ON b.user_id = u.id'
      );
    } else {
      // Usuários comuns veem apenas suas reservas
      bookings = await pool.query(
        'SELECT b.*, h.name as hotel_name FROM bookings b JOIN hotels h ON b.hotel_id = h.id WHERE b.user_id = $1',
        [req.user.id]
      );
    }

    res.status(200).json(bookings.rows);
  } catch (error) {
    console.error('Erro ao buscar reservas:', error);
    res.status(500).json({ message: 'Erro ao buscar reservas' });
  }
});

// Cancelar reserva (Somente o próprio usuário ou administrador)
router.delete('/cancel/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const isAdmin = req.user.role === 'admin';

  try {
    // Verifica se a reserva existe
    const booking = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);

    if (booking.rows.length === 0) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    // Verifica se o usuário tem permissão para cancelar
    if (!isAdmin && booking.rows[0].user_id !== user_id) {
      return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para cancelar esta reserva.' });
    }

    // Remove a reserva
    await pool.query('DELETE FROM bookings WHERE id = $1', [id]);

    res.status(200).json({ message: 'Reserva cancelada com sucesso!' });
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    res.status(500).json({ message: 'Erro ao cancelar reserva' });
  }
});

export default router;
