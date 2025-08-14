import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createCheckoutSession } from '../../lib/stripe';

interface CheckoutButtonProps {
  priceId: string;
  mode: 'payment' | 'subscription';
  children: React.ReactNode;
  className?: string;
}

export function CheckoutButton({ priceId, mode, children, className }: CheckoutButtonProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      // Redirect to login or show login modal
      return;
    }

    try {
      setIsLoading(true);

      const successUrl = `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/checkout/cancel`;

      const checkoutUrl = await createCheckoutSession(
        priceId,
        mode,
        successUrl,
        cancelUrl,
        user.id
      );

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      // Show error message to user
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}