import { useCallback } from 'react';
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

  const initiatePayment = useCallback(async (productId, onSuccess) => {
    // 1. Load Razorpay SDK
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error('Failed to load payment gateway. Check your internet connection.');
      return;
    }

    const toastId = toast.loading('Creating order...');

    try {
      // 2. Create order on backend
      const { data } = await api.post('/payment/create-order', { productId });
      toast.dismiss(toastId);

      // 3. Open Razorpay checkout
      const options = {
        key: data.keyId,
        amount: data.amount,           // in paise
        currency: data.currency,
        name: 'ShopFlow',
        description: data.productName,
        order_id: data.razorpayOrderId,
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#6c63ff' },
        modal: {
          ondismiss: () => toast('Payment cancelled', { icon: '⚠️' }),
        },

        // 4. Payment success handler
        handler: async (response) => {
          const verifyToast = toast.loading('Verifying payment...');
          try {
            // 5. Verify signature on backend — NEVER trust frontend status
            const { data: verifyData } = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.dismiss(verifyToast);

            if (verifyData.success) {
              toast.success('Payment successful! Order placed.', { duration: 4000 });
              await refreshUser(); // refresh wallet balance
              onSuccess?.(verifyData.order);
            } else {
              toast.error('Payment verification failed.');
            }
          } catch (err) {
            toast.dismiss(verifyToast);
            toast.error(err.response?.data?.message || 'Verification error. Contact support.');
          }
        },
      };

      const rzp = new window.Razorpay(options);

      // Handle payment failure events from Razorpay modal
      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error.description}`);
        console.error('Razorpay payment failed:', response.error);
      });

      rzp.open();
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || 'Failed to initiate payment.');
    }
  }, [user, refreshUser]);

  return { initiatePayment };
};

export default useRazorpay;
