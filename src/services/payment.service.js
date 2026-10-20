import api from './api';

/**
 * Dynamic script loader for Razorpay Checkout SDK
 * Ensures https://checkout.razorpay.com/v1/checkout.js is loaded exactly once
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout SDK.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * UrbanCab Payment & Invoicing Service
 * Integrates Razorpay order generation, signature verification,
 * electronic tax receipts, and driver settlement ledger.
 */
export const paymentService = {
  /**
   * Initialize a server-side Razorpay order for an active/completed ride
   * @param {string} rideId
   * @returns {Promise<{ order_id: string, amount: number, currency: string, razorpay_key_id: string, ride_id: string }>}
   */
  async createOrder(rideId) {
    const response = await api.post('/api/v1/payments/create-order', { ride_id: rideId });
    return response.data;
  },

  /**
   * Verify Razorpay cryptographic signature and settle ride transaction
   * @param {Object} payload { ride_id, order_id, payment_id, signature }
   * @returns {Promise<{ payment: Object, driver_earnings: Object }>}
   */
  async verifyPayment(payload) {
    const response = await api.post('/api/v1/payments/verify', payload);
    return response.data;
  },

  /**
   * Fetch itemized digital tax invoice & receipt
   * @param {string} rideId
   * @returns {Promise<Object>} Receipt metadata, fare breakdown, and transit coordinates
   */
  async getReceipt(rideId) {
    const response = await api.get(`/api/v1/payments/receipt/${rideId}`);
    return response.data;
  },

  /**
   * Fetch driver partner earnings summary and transaction history
   * @returns {Promise<{ summary: Object, recent_earnings: Array }>}
   */
  async getEarnings() {
    const response = await api.get('/api/v1/payments/earnings');
    return response.data;
  },

  /**
   * End-to-end Razorpay checkout orchestrator
   * Loads checkout script, generates server order, launches modal, and verifies signature.
   *
   * @param {Object} params
   * @param {Object} params.ride - The ride object ({ id, final_fare, estimated_fare, ... })
   * @param {Object} params.user - Current authenticated user
   * @param {Function} params.onSuccess - Callback invoked on successful payment & verification
   * @param {Function} [params.onDismiss] - Callback invoked when user closes modal before completion
   * @param {Function} [params.onError] - Callback invoked on failure
   */
  async checkout({ ride, user, onSuccess, onDismiss, onError }) {
    try {
      // 1. Ensure Razorpay SDK script is available
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay Payment Gateway could not be initialized. Check your network connection.');
      }

      // 2. Generate server-side payment order
      const order = await this.createOrder(ride.id);

      const razorpayKey =
        order.razorpay_key_id ||
        import.meta.env.VITE_RAZORPAY_API_KEY ||
        'rzp_test_Tp1NRQbVASd8ub';

      // 3. Configure Razorpay Checkout options
      const options = {
        key: razorpayKey,
        amount: Math.round(Number(order.amount) * 100),
        currency: order.currency || 'INR',
        name: 'UrbanCab Mobility',
        description: `Trip Settlement #${ride.id.slice(0, 8).toUpperCase()}`,
        order_id: order.order_id,
        prefill: {
          name: user?.full_name || 'Passenger',
          email: user?.email || '',
          contact: user?.phone_number || '',
        },
        notes: {
          ride_id: ride.id,
          vehicle_category: ride.vehicle_category || 'standard',
        },
        theme: {
          color: '#09090B',
          backdrop_color: 'rgba(9, 9, 11, 0.85)',
        },
        modal: {
          ondismiss: () => {
            if (onDismiss) onDismiss();
          },
        },
        handler: async (response) => {
          try {
            // 4. Verify payment signature on backend
            const verifyPayload = {
              ride_id: ride.id,
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            };

            const verificationResult = await this.verifyPayment(verifyPayload);
            if (onSuccess) {
              onSuccess(verificationResult);
            }
          } catch (verifyErr) {
            if (onError) {
              onError(verifyErr);
            }
          }
        },
      };

      // 4. Instantiate and launch Razorpay checkout modal
      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', (failResponse) => {
        const errorDesc =
          failResponse.error?.description ||
          failResponse.error?.reason ||
          'Payment transaction was declined.';
        if (onError) {
          onError(new Error(errorDesc));
        }
      });

      razorpayInstance.open();
    } catch (err) {
      if (onError) {
        onError(err);
      } else {
        throw err;
      }
    }
  },
};

export default paymentService;
