# AppBazaar - Full-Stack MERN App Marketplace

AppBazaar is a comprehensive mobile application marketplace built with the MERN stack (MongoDB, Express.js, React, Node.js). It provides a platform for users to discover, download, and manage mobile applications, while developers can create and publish their apps.

## 🚀 Features

### For Users
- **Marketplace Browsing**: Card-based browsing with search and filter options
- **User Authentication**: JWT-based authentication with secure login/registration
- **Wishlist Management**: Save apps for later review
- **Purchase System**: Buy and manage purchased applications with Razorpay integration
- **Reviews & Ratings**: Rate and review purchased apps
- **User Dashboard**: View purchases, wishlist, and activity
- **Auction System**: Create auctions for custom app development needs
- **Bidding System**: Submit bids on auctions as a developer

### For Developers
- **App Management**: Full CRUD operations for apps
- **App Publishing**: Submit apps for review and approval
- **Developer Dashboard**: Track app performance and statistics
- **App Analytics**: View downloads, ratings, and revenue
- **Auction Bidding**: Submit proposals and bids on client projects
- **Project Management**: Manage accepted auction projects

### For Admins
- **User Management**: Manage user accounts and roles
- **App Moderation**: Review and approve/reject app submissions
- **System Administration**: Monitor system health and statistics
- **Content Management**: Feature apps and manage categories

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security middleware
- **cors** - Cross-origin resource sharing
- **Razorpay** - Payment gateway integration
- **Multer** - File upload handling

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Lucide React** - Icon library

## 📁 Project Structure

```
AppBazaar/
├── backend/                 # Backend server
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── server.js          # Main server file
│   └── package.json       # Backend dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux store and slices
│   │   ├── services/      # API services
│   │   └── App.jsx        # Main app component
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
└── README.md              # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```


3. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```


3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Apps
- `GET /api/apps` - Get all apps with filters
- `GET /api/apps/featured` - Get featured apps
- `GET /api/apps/:id` - Get app by ID
- `POST /api/apps` - Create new app
- `PUT /api/apps/:id` - Update app
- `DELETE /api/apps/:id` - Delete app

### Users
- `GET /api/users/wishlist` - Get user's wishlist
- `GET /api/users/purchases` - Get user's purchases
- `GET /api/users/my-apps` - Get user's apps
- `GET /api/users/app-stats` - Get app statistics

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/apps` - Get all apps
- `PUT /api/admin/apps/:id/status` - Update app status
- `GET /api/admin/dashboard` - Get dashboard stats

### Auctions
- `GET /api/auctions` - Get all auctions with filters
- `GET /api/auctions/featured` - Get featured auctions
- `GET /api/auctions/:id` - Get auction by ID
- `POST /api/auctions` - Create new auction
- `PUT /api/auctions/:id` - Update auction
- `DELETE /api/auctions/:id` - Delete auction
- `POST /api/auctions/:id/bid` - Submit bid on auction
- `PUT /api/auctions/:id/bid/:bidId/accept` - Accept bid
- `GET /api/auctions/user/my-auctions` - Get user's auctions
- `GET /api/auctions/user/my-bids` - Get user's bids

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/user/payments` - Get user's payment history
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments/refund` - Process refund (Admin only)

## 🔐 Authentication & Authorization

- **JWT Tokens**: Secure authentication with JSON Web Tokens
- **Role-Based Access**: User and admin roles with different permissions

## 🎯 New Features

### Auction System
- **Buyer Auctions**: Users can create auctions for custom app development needs
- **Developer Bidding**: Developers can submit proposals and bids on projects
- **Project Management**: Track auction status, accepted bids, and project progress
- **Budget Management**: Set min/max budget ranges for projects

### Payment Integration
- **Razorpay Gateway**: Secure payment processing for app purchases
- **Multiple Payment Methods**: Support for cards, UPI, net banking, and wallets
- **Payment Verification**: Secure payment verification with signature validation
- **Refund System**: Admin-controlled refund processing
- **Payment History**: Complete transaction history and analytics
- **Protected Routes**: Middleware to protect sensitive endpoints
- **Password Security**: bcrypt hashing for secure password storage

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Dark Mode**: Toggle between light and dark themes
- **Modern Components**: Beautiful, accessible UI components
- **Loading States**: Smooth loading animations and feedback
- **Error Handling**: User-friendly error messages and validation

## 📱 Key Components

### App Cards
- Display app information in an attractive card format
- Show ratings, downloads, and pricing
- Quick actions for wishlist and purchase

### Search & Filters
- Advanced search functionality
- Category-based filtering
- Price range filtering
- Sorting options

### User Dashboard
- Overview of user activity
- App management interface
- Statistics and analytics

### Admin Panel
- User management tools
- App moderation interface
- System health monitoring

## 🚀 Deployment

### Backend Deployment
1. Set environment variables for production
2. Use PM2 or similar process manager
3. Configure MongoDB connection
4. Set up reverse proxy (nginx)

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Deploy to static hosting (Vercel, Netlify, etc.)
3. Configure environment variables
4. Update API base URL


## 🔮 Future Enhancements

- **Payment Integration**: Stripe/PayPal for app purchases
- **Push Notifications**: Real-time updates for users
- **Analytics Dashboard**: Advanced app performance metrics
- **API Rate Limiting**: Enhanced security measures
- **Multi-language Support**: Internationalization
- **Mobile App**: Native mobile applications

---

**AppBazaar** - Your Ultimate App Marketplace 🚀


