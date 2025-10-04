# 🕰️ Time Capsule

A modern, secure web application that allows users to create digital time capsules and schedule them for future delivery via email.

## ✨ Features

- 📝 Create time capsules with messages, files, and media
- ⏰ Schedule capsules for future delivery
- 🏷️ Categorize capsules (personal, special, academic, mental, business, legacy, social)
- 📧 Automated email delivery on scheduled dates
- 📊 Dashboard with category-wise organization
- 🔐 Secure user authentication with JWT
- 📁 File upload support (up to 10MB)
- 🚀 Performance optimized with database indexing
- 💾 Automatic session management
- 🔒 Security headers and input validation

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, bcrypt
- **Email**: Nodemailer
- **Scheduler**: node-cron
- **Frontend**: HTML/CSS/JavaScript

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Gmail account (for email delivery)

## 🚀 Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Vyomkhurana/TimeCapsulee.git
cd TimeCapsulee
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
   
   Copy `.env.example` to `.env` and update with your values:
```bash
cp .env.example .env
```

   Update the `.env` file with your configuration:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_jwt_secret
SESSION_SECRET=your_session_secret
BASE_URL=http://localhost:3000
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

4. **Create uploads directory:**
```bash
mkdir -p public/uploads
```

5. **Start the application:**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## Setting up Gmail for Email Delivery

1. Go to your Google Account settings (https://myaccount.google.com)
2. Enable 2-Step Verification
3. Go to Security > App Passwords
4. Select "Mail" and "Windows Computer"
5. Generate and copy the 16-character password
6. Use this password in your .env file as EMAIL_PASSWORD

## Usage

1. Register/Login to your account
2. Create a new time capsule from the dashboard
3. Fill in the capsule details:
   - Title
   - Message
   - Category
   - Schedule Date
   - Optional: Add files/media
4. Submit the capsule
5. View your capsules organized by category
6. Receive your capsule via email on the scheduled date

## 🔒 Security Features

- Password hashing with bcrypt (12 salt rounds)
- JWT-based authentication
- Session management with automatic expiry
- Input validation and sanitization
- Security headers (XSS Protection, Content-Type Options, Frame Options)
- CORS configuration
- File upload restrictions

## 📈 Performance Optimizations

- Database indexing for faster queries
- Connection pooling
- Static file caching
- Compression middleware ready
- Efficient error handling
- Graceful shutdown handling

## 🐛 Health Check

Access the health check endpoint to monitor server status:
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-04T10:00:00.000Z",
  "uptime": 123.45
}
```

## 📝 API Endpoints

- `POST /users/signup` - Register new user
- `POST /users/login` - User login
- `POST /users/logout` - User logout
- `POST /users/forgot-password` - Request password reset
- `POST /users/reset-password` - Reset password
- `GET /api/capsules` - Get user's capsules
- `POST /api/capsules` - Create new capsule
- `GET /api/capsules/:id` - Get single capsule
- `PUT /api/capsules/:id` - Update capsule
- `DELETE /api/capsules/:id` - Delete capsule

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

[MIT License](LICENSE)

## 👨‍💻 Author

**Vyom Khurana**
- GitHub: [@Vyomkhurana](https://github.com/Vyomkhurana) 