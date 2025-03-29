# Time Capsule

A digital time capsule application that allows users to create and store messages, memories, and media for future delivery.

## Features

- User authentication (signup/login)
- Create time capsules with messages and media
- Schedule delivery dates
- Email notifications and reminders
- Category-based organization
- File uploads support
- Responsive dashboard

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Nodemailer for email notifications
- Multer for file uploads
- JWT for authentication

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/timecapsule.git
cd timecapsule
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASSWORD=your_app_password
```

4. Start the server:
```bash
npm start
```

## Usage

1. Sign up for a new account
2. Log in to your dashboard
3. Create a new time capsule
4. Add your message and media
5. Set a delivery date
6. Choose email delivery and reminder options
7. Save your capsule

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License. 