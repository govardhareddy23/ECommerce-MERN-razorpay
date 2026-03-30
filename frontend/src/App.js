import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Products from './pages/Products';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Orders from './pages/Orders';
import Wallet from './pages/Wallet';
import OwnerDashboard from './pages/OwnerDashboard';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#13151f',
                color: '#f1f2f8',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#13151f' } },
              error:   { iconTheme: { primary: '#f43f5e', secondary: '#13151f' } },
              loading: { iconTheme: { primary: '#7c3aed', secondary: '#13151f' } },
            }}
          />
          <Navbar />
          <main style={{ minHeight: 'calc(100vh - 68px)' }}>
            <Routes>
              <Route path="/" element={<Products />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
              <Route path="/owner-dashboard" element={<ProtectedRoute ownerOnly><OwnerDashboard /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
