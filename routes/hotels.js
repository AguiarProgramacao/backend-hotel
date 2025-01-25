import express from 'express';
import pool from '../db/pool.js';
import authMiddleware from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// Rota para criar um novo hotel (Apenas Admins)
router.post('/add', authMiddleware, upload.single('image'), async (req, res) => {
    const { name, description, location, price_per_night, available_rooms } = req.body;
    const image = req.file ? req.file.filename : null; // Verifica se a imagem foi enviada

    try {
        // Verifica se o usuário tem permissão de admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem adicionar hotéis.' });
        }

        // Insere o hotel no banco de dados
        const newHotel = await pool.query(
            'INSERT INTO hotels (name, description, location, price_per_night, available_rooms, image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, description, location, price_per_night, available_rooms, image]
        );

        res.status(201).json({ message: 'Hotel adicionado com sucesso!', hotel: newHotel.rows[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao adicionar hotel' });
    }
});

// Rota para listar todos os hotéis
router.get('/', async (req, res) => {
    try {
        const hotels = await pool.query('SELECT id, name, description, location, price_per_night, available_rooms, image FROM hotels');

        // Supondo que a pasta uploads esteja no diretório raiz
        const hotelsWithImageUrl = hotels.rows.map(hotel => {
            if (hotel.image) {
                hotel.image = `http://192.168.0.107:5000/uploads/${hotel.image}`; 
            }
            return hotel;
        });

        res.status(200).json(hotelsWithImageUrl);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar hotéis' });
    }
});


// Rota para buscar um hotel específico
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const hotel = await pool.query('SELECT * FROM hotels WHERE id = $1', [id]);

        if (hotel.rows.length === 0) {
            return res.status(404).json({ message: 'Hotel não encontrado' });
        }

        res.status(200).json(hotel.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar hotel' });
    }
});

// Rota para atualizar um hotel (Apenas Admins)
router.put('/update/:id', authMiddleware, upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, description, location, price_per_night, available_rooms } = req.body;
    const image = req.file ? req.file.filename : null; // Verifica se a imagem foi enviada

    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem editar hotéis.' });
        }

        const updatedHotel = await pool.query(
            'UPDATE hotels SET name = $1, description = $2, location = $3, price_per_night = $4, available_rooms = $5, image = $6 WHERE id = $7 RETURNING *',
            [name, description, location, price_per_night, available_rooms, image, id]
        );

        if (updatedHotel.rows.length === 0) {
            return res.status(404).json({ message: 'Hotel não encontrado' });
        }

        res.status(200).json({ message: 'Hotel atualizado com sucesso!', hotel: updatedHotel.rows[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar hotel' });
    }
});

// Rota para deletar um hotel (Apenas Admins)
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem excluir hotéis.' });
        }

        const deletedHotel = await pool.query('DELETE FROM hotels WHERE id = $1 RETURNING *', [id]);

        if (deletedHotel.rows.length === 0) {
            return res.status(404).json({ message: 'Hotel não encontrado' });
        }

        res.status(200).json({ message: 'Hotel removido com sucesso!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao excluir hotel' });
    }
});

export default router;