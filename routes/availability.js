import express from "express";
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/:hotelId', async (req, res) => {
  const { hotelId } = req.params;
  const { date } = req.query;
  try {
    res.status(200).json({ availableSlots: [] });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar horários disponíveis.' });
  }
});

router.put('/:hotelId', authMiddleware, async (req, res) => {
  const { hotelId } = req.params;
  const { date, slots } = req.body;
  try {
    res.status(200).json({ message: 'Disponibilidade atualizada com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar disponibilidade.' });
  }
});

export default router;
