# Backend - SaaS Hotel

API REST para cadastro de usuarios, hoteis, reservas e pagamentos (Stripe).

## Stack
- Node.js + Express
- PostgreSQL (pg)
- JWT para autenticacao
- Multer para upload de imagens
- Stripe para pagamentos

## Requisitos
- Node.js 18+ (recomendado)
- PostgreSQL
- Conta Stripe (chaves secretas e webhook)

## Setup
1) Instale dependencias:
```bash
npm install
```

2) Configure o arquivo `.env`:
```env
PORT=5000

DB_USER=seu_usuario
DB_HOST=localhost
DB_NAME=seu_banco
DB_PASSWORD=sua_senha
DB_PORT=5432

JWT_SECRET=sua_chave_jwt

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

3) Suba o servidor:
```bash
node server.js
```

Servidor inicia em `http://localhost:5000`.

## Endpoints
Base URL: `http://localhost:5000`

### Usuarios
- `POST /api/users/register`  
  Body: `{ name, email, password }`
- `POST /api/users/registerAdmin` (auth, admin)  
  Body: `{ name, email, password }`
- `POST /api/users/login`  
  Body: `{ email, password }`
- `GET /api/users/profile` (auth)

### Hoteis
- `POST /api/hotels/add` (auth, admin, multipart)  
  Body: `name, description, location, price_per_night, available_rooms, image`
- `GET /api/hotels/`
- `GET /api/hotels/:id`
- `PUT /api/hotels/update/:id` (auth, admin, multipart)
- `DELETE /api/hotels/delete/:id` (auth, admin)

Imagens ficam disponiveis em `/uploads/<arquivo>`.

### Reservas
- `POST /api/bookings/add` (auth)  
  Body: `{ hotel_id, check_in, check_out }`
- `GET /api/bookings/` (auth)  
  Admin ve todas; usuario ve apenas as proprias.
- `DELETE /api/bookings/cancel/:id` (auth)

### Disponibilidade
- `GET /api/availability/:hotelId?date=YYYY-MM-DD`
- `PUT /api/availability/:hotelId` (auth)  
  Body: `{ date, slots }`

### Pagamentos (Stripe)
- `POST /api/payments/checkout` (auth)  
  Body: `{ booking_id }` -> retorna `url` para checkout
- `POST /api/payments/webhook` (Stripe webhook)

## Autenticacao
Envie o token JWT no header:
```
Authorization: Bearer <token>
```

## Upload de imagens
Use `multipart/form-data` no endpoint de hoteis com o campo `image`.
Tipos aceitos: JPG, JPEG, PNG. Limite: 5MB.

## Observacoes
- O campo `image` do hotel e salvo como nome do arquivo em `uploads/`.
- Ajuste URLs de front-end usadas no Stripe (`success_url` e `cancel_url`) em `routes/payments.js`.
