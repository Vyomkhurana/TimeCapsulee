# Time Capsule

A web application that allows users to create digital time capsules and schedule them for future delivery via email.

## Features

- Create time capsules with messages, files, and media
- Schedule capsules for future delivery
- Categorize capsules (personal, special, academic, mental, business, legacy, social)
- Email delivery of capsules on scheduled dates
- Dashboard with category-wise organization
- Secure user authentication
- File upload support

## Tech Stack

- Node.js
- Express.js
- MongoDB
- HTML/CSS/JavaScript
- Nodemailer for email delivery

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Gmail account (for email delivery)

## Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd TimeCapsulee
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/timecapsule
JWT_SECRET=your_jwt_secret
BASE_URL=http://localhost:3000
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

4. Start the application:
```bash
npm start
```

## Opening in IntelliJ IDEA

To properly view all folders in IntelliJ IDEA when cloning from GitHub:

1. First, close any open projects in IntelliJ IDEA
2. Select "Open" (not "Open Project")
3. Navigate to your cloned folder
4. Select the `package.json` file specifically (this is crucial!)
5. Click "Open as Project"
6. When prompted about the Node.js project:
   - Choose "Trust Project"
   - If asked about loading dependencies from package.json, select "Yes"
7. Wait for IntelliJ to finish indexing (progress bar at bottom)
8. If folders aren't visible:
   - Go to View > Tool Windows > Project
   - Click on the gear icon (⚙️) in the Project view toolbar
   - Make sure "Show Excluded Files" is checked
   - Select "Project Structure..."
   - Go to "Modules" and mark all directories as "Sources"

## Project Structure

- `/public` - Static assets and HTML files
- `/routes` - API routes
- `/Models` - Database models
- `/Controllers` - Request handlers
- `/config` - Configuration files
- `/services` - Services like email and scheduler

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

## Contributing

Feel free to submit issues and enhancement requests.

## License

[MIT License](LICENSE) 