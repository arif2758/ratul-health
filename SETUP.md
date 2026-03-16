# RatboD - Health Analysis Application

A Next.js health analysis and tracking application built with TailwindCSS, shadcn, Mongoose, and next-auth@beta.

## Tech Stack

- **Framework**: Next.js 16.1.6
- **UI**: TailwindCSS 4, shadcn components, Lucide icons
- **Database**: MongoDB with Mongoose
- **Authentication**: next-auth@beta
- **Language**: TypeScript
- **Styling**: TailwindCSS with custom utilities

## Project Structure

```
src/
├── app/                          # Next.js app router
│   ├── api/                      # API route handlers
│   │   ├── auth/[...nextauth]/   # NextAuth endpoints
│   │   ├── register/             # User registration
│   │   ├── login/                # User login
│   │   ├── logout/               # User logout
│   │   ├── me/                   # Get current user
│   │   ├── profile/              # Update profile
│   │   ├── metrics/              # Health metrics endpoints
│   │   └── goals/                # Goals endpoints
│   ├── layout.tsx                # Root layout with SessionProvider
│   ├── page.tsx                  # Main application page
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── Goals.tsx                 # Goals component
│   ├── History.tsx               # History component
│   └── ui/                       # shadcn UI components
├── lib/
│   ├── auth/                     # NextAuth configuration
│   │   ├── auth.config.ts        # Auth providers and callbacks
│   │   └── auth.ts               # Auth handlers export
│   ├── db/                       # Database configuration
│   │   ├── connection.ts         # MongoDB connection
│   │   └── models/               # Mongoose models
│   │       ├── User.ts
│   │       ├── Metrics.ts
│   │       └── Goal.ts
│   ├── calculations.ts           # Health calculation utilities
│   └── utils.ts                  # Utility functions
├── services/
│   └── queries.ts                # Client-side queries/API service
└── types/
    └── next-auth.d.ts            # NextAuth type definitions
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rat-health?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

#### Getting MongoDB URI

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Add a database user with username and password
4. Whitelist your IP address
5. Get the connection string from "Connect" > "Connect your application"
6. Replace `<password>` with your database user password

#### Generating NEXTAUTH_SECRET

```bash
# Generate a random secret
openssl rand -base64 32
```

Or use Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### Authentication

- User registration and login
- Session management with NextAuth
- Secure password hashing with bcryptjs
- Protected API routes

### Health Analysis

- BMI calculation
- Basal Metabolic Rate (BMR) calculation
- Total Daily Energy Expenditure (TDEE)
- Body fat percentage estimation (Katch-McArdle formula)
- Ideal body weight calculation (Devine formula)

### User Features

- Create and edit user profile
- Save health metrics history
- Set and track health goals
- Download PDF reports
- Dark/Light mode toggle
- Metric/Imperial unit conversion

## API Endpoints

### Authentication

- `POST /api/register` - Create new user account
- `POST /api/login` - User login (handled by NextAuth)
- `POST /api/logout` - User logout
- `GET /api/me` - Get current user profile
- `POST /api/profile` - Update user profile

### Health Data

- `GET /api/metrics` - Get user's metrics history
- `POST /api/metrics` - Save new metrics
- `DELETE /api/metrics/[id]` - Delete specific metric

### Goals

- `GET /api/goals` - Get user's goals
- `POST /api/goals` - Create new goal

## Building for Production

```bash
npm run build
npm run start
```

The application will be available at `http://localhost:3000`

## Database Models

### User Model

- `email` (required, unique)
- `password` (hashed)
- `name`
- `image` (profile picture)
- `emailVerified`
- `createdAt`, `updatedAt`

### Metrics Model

- `userId` (reference to User)
- `weight`, `height`, `age`
- `gender` (male/female)
- `activityLevel`
- `bodyFatPercentage`, `bmi`, `bmr`, `tdee`
- `idealWeight`
- `createdAt`, `updatedAt`

### Goal Model

- `userId` (reference to User)
- `title`, `description`
- `targetWeight`, `targetBodyFat`, `targetDate`
- `completed` (boolean)
- `createdAt`, `updatedAt`

## Calculations

### BMI (Body Mass Index)

```
BMI = weight(kg) / (height(m) ^ 2)
```

### BMR (Basal Metabolic Rate - Harris-Benedict)

```
Male: 88.362 + (13.397 × weight) + (4.799 × height) - (5.677 × age)
Female: 447.593 + (9.247 × weight) + (3.098 × height) - (4.330 × age)
```

### TDEE (Total Daily Energy Expenditure)

```
TDEE = BMR × Activity Factor

Activity Factors:
- Sedentary: 1.2
- Lightly Active: 1.375
- Moderately Active: 1.55
- Very Active: 1.725
- Extra Active: 1.9
```

### Body Fat % (Katch-McArdle)

```
Male: 495 / (1.0808 + 0.0000267 × waist) - 450
Female: 495 / (1.29579 - 0.35004 × ((waist + hip) / 2) + 0.22100 × height) - 450
```

### Ideal Body Weight (Devine Formula)

```
Male: 50kg + 2.3kg per inch over 5'0"
Female: 45.5kg + 2.3kg per inch over 5'0"
```

## Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas
- Verify database user credentials
- Wait for cluster to be active (can take a few minutes after creation)

### NextAuth Issues

- Ensure `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your deployment URL
- Check that `/api/auth/[...nextauth]` route exists

### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `npm install`
- Make sure all environment variables are set

## License

Apache License 2.0

## Support

For issues and questions, please visit the project repository.
