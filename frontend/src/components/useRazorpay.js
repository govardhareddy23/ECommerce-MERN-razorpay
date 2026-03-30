import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Dynamically load Razorpay checkout script
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) return resolve(true);
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const useRazorpay = () => {
  const { user, refreshUser } = useAuth();

  // ── Single-product payment ────────────────────────────────────────────────
  const initiatePayment = useCallback(async (productId, onSuccess) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) return toast.error('Failed to load payment gateway.');

    const toastId = toast.loading('Creating order...');
    try {
      const { data } = await api.post('/payment/create-order', { productId });
      toast.dismiss(toastId);

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'ShopFlow',
        description: data.productName,
        order_id: data.razorpayOrderId,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#7c3aed' },
        modal: { ondismiss: () => toast('Payment cancelled', { icon: '⚠️' }) },
        handler: async (response) => {
          const verifyToast = toast.loading('Verifying payment...');
          try {
            const { data: verifyData } = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.dismiss(verifyToast);
            if (verifyData.success) {
              toast.success('Payment successful! Order placed.', { duration: 4000 });
              await refreshUser();
              onSuccess?.(verifyData.order);
            } else {
              toast.error('Payment verification failed.');
            }
          } catch (err) {
            toast.dismiss(verifyToast);
            toast.error(err.response?.data?.message || 'Verification error.');
          }
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (r) => toast.error(`Payment failed: ${r.error.description}`));
      rzp.open();
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || 'Failed to initiate payment.');
    }
  }, [user, refreshUser]);

  // ── Cart (multi-product) payment ─────────────────────────────────────────
  const initiateCartPayment = useCallback(async (cartItems, onSuccess) => {
    if (!cartItems || cartItems.length === 0) return toast.error('Cart is empty.');

    const loaded = await loadRazorpayScript();
    if (!loaded) return toast.error('Failed to load payment gateway.');

    const toastId = toast.loading('Creating cart order...');
    try {
      const { data } = await api.post('/payment/create-cart-order', {
        items: cartItems.map((item) => ({ productId: item._id, qty: item.qty || 1 })),
      });
      toast.dismiss(toastId);

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'ShopFlow',
        description: `Cart (${cartItems.length} item${cartItems.length > 1 ? 's' : ''})`,
        order_id: data.razorpayOrderId,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#7c3aed' },
        modal: { ondismiss: () => toast('Payment cancelled', { icon: '⚠️' }) },
        handler: async (response) => {
          const verifyToast = toast.loading('Verifying payment...');
          try {
            const { data: verifyData } = await api.post('/payment/verify-cart', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              cartOrderId: data.cartOrderId,
            });
            toast.dismiss(verifyToast);
            if (verifyData.success) {
              toast.success(`${verifyData.orders?.length || cartItems.length} orders placed!`, { duration: 4000 });
              await refreshUser();
              onSuccess?.(verifyData.orders);
            } else {
              toast.error('Cart payment verification failed.');
            }
          } catch (err) {
            toast.dismiss(verifyToast);
            toast.error(err.response?.data?.message || 'Verification error.');
          }
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (r) => toast.error(`Payment failed: ${r.error.description}`));
      rzp.open();
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || 'Failed to initiate cart payment.');
    }
  }, [user, refreshUser]);

  return { initiatePayment, initiateCartPayment };
};

export default useRazorpay;
