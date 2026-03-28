# ShopFlow: MERN E-commerce with Razorpay

ShopFlow is a modern, high-performance e-commerce platform built with the MERN stack (MongoDB, Express, React, Node.js) and integrated with Razorpay for secure payments. It features a full checkout flow, user authentication, a simulated wallet system, and dynamic product management.

## 🚀 Key Features

-   **Full Payment Lifecycle**: Securely integrated with **Razorpay**.
-   **User Authentication**: Robust JWT-based authentication for admins and customers.
-   **Wallet System**: Simulated wallet allows users to add funds and buy products directly.
-   **Admin Dashboard**: Manage products, view sales metrics, and track orders.
-   **Responsive Design**: Premium dark-mode UI that works seamlessly on all devices.
-   **SEO Optimized**: Semantic HTML and meta tags for better search visibility.

## 🛠️ Tech Stack

-   **Frontend**: React, Axios, React Router, React Hot Toast.
-   **Backend**: Node.js, Express, Mongoose.
-   **Payment Gateway**: Razorpay SDK.
-   **Database**: MongoDB Atlas.

## 📦 Getting Started

### 1. Prerequisite
-   Node.js installed on your machine.
-   A MongoDB Atlas account.
-   A Razorpay account (Test Mode).

### 2. Configuration
Create a `.env` file in the **backend** folder:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CLIENT_URL=http://localhost:3000
```

### 3. Installation
Install dependencies in both folders:
```bash
# In backend
npm install

# In frontend
npm install
```

### 4. Running the App
Start both servers in separate terminals:
```bash
# Backend
npm run dev

# Frontend
npm start
```

### 5. Seeding the Database
To populate the database with initial products:
```bash
cd backend
npm run seed
```

## 🔒 Security Note
The `.env` files are ignored by git to protect sensitive API keys. Always use `.env.example` for sharing configuration templates.

## 📄 License
MIT License
