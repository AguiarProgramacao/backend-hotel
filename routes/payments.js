import express from 'express';
import Stripe from 'stripe';
import pool from '../db/pool.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Criar pagamento
router.post('/checkout', authMiddleware, async (req, res) => {
  const { booking_id } = req.body;
  const user_id = req.user.id;

  try {
    // Verifica se a reserva existe
    const booking = await pool.query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [booking_id, user_id]);

    if (booking.rows.length === 0) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    const total_price = booking.rows[0].total_price;

    // Criar sessão de pagamento no Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Reserva de Hotel',
            },
            unit_amount: Math.round(total_price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://f287-138-255-59-171.ngrok-free.app/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/cancel',
      metadata: { booking_id: booking_id, user_id: user_id },
    });

    // Salvar o pagamento no banco
    await pool.query(
      'INSERT INTO payments (booking_id, user_id, amount, stripe_payment_id, status) VALUES ($1, $2, $3, $4, $5)',
      [booking_id, user_id, total_price, session.id, 'pendente']
    );

    res.json({ url: session.url });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar pagamento' });
  }
});

// Webhook para atualizar status do pagamento
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const booking_id = session.metadata.booking_id;

      // Atualizar status do pagamento no banco
      await pool.query('UPDATE payments SET status = $1 WHERE stripe_payment_id = $2', ['pago', session.id]);
      await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', ['confirmado', booking_id]);

      console.log(`Pagamento confirmado para a reserva ${booking_id}`);
    }

    res.json({ received: true });

  } catch (err) {
    console.error(`Erro no webhook: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

export default router;
