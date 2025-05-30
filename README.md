

```markdown
```
# Music Streaming Platform

A full-stack music streaming platform with user, artist, and admin roles.

## Features

- User authentication and authorization
- Music streaming for subscribed users
- Artist music upload and management
- Admin approval system for music tracks
- Stripe integration for subscription payments

## Project Structure

```
```
music-streaming-platform/
├── frontend/          # React frontend application
└── backend/           # Node.js/Express backend server
```
```
## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Stripe account

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Stripe Webhook Setup

To test Stripe webhooks locally, use the Stripe CLI to forward events to your local backend server. Run the following command in your terminal:

```bash
.\stripe.exe listen --forward-to localhost:5000/api/subscription/webhook
```

This will forward any Stripe event (such as successful payments or subscription updates) to your local webhook endpoint.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## User Roles

1. End User (Listener)
   - Register and browse music
   - Subscribe to access music streaming
   - View track information

2. Artist
   - Register as an artist
   - Upload music tracks
   - View upload status

3. Admin
   - Review and approve/reject tracks
   - Manage content

## Technologies Used

- Frontend:
  - React
  - React Router
  - Axios
  - Stripe.js

- Backend:
  - Node.js
  - Express
  - MongoDB
  - JWT Authentication
  - Stripe API
  - Multer (file uploads)

## License

MIT
```

