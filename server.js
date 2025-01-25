import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import usersRoutes from './routes/users.js';
import hotelsRoutes from './routes/hotels.js';
import bookingsRoutes from './routes/bookings.js';
import paymentsRoutes from './routes/payments.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Servir arquivos estáticos corretamente
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
app.use('/api/users', usersRoutes);
app.use('/api/hotels', hotelsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/payments', paymentsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
