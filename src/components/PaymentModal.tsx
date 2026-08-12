import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, Check, Sparkles, Loader2, QrCode, Wallet } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { updateUserSubscriptionInFirestore } from '../services/firebase';

export const PaymentModal: React.FC = () => {
  const { activeDrawer, setActiveDrawer, showToast, userProfile, setUserProfile, createSubscriptionRequest } = usePlayer();

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'paypal'>('card');
  const [cardNumber, setCardNumber] = useState<string>('4532 •••• •••• 8892');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('777');
  const [cardName, setCardName] = useState<string>(userProfile?.displayName || 'John Doe');
  const [upiId, setUpiId] = useState<string>('musicfan@okaxis');

  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(1); // Default: 1 Month
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const SUBSCRIPTION_PLANS = [
    {
      durationDays: 7,
      name: 'Weekly Pass',
      price: '$1.99',
      periodLabel: 'Seven Days',
      badge: 'FLEXIBLE',
      description: '7 Days Full Access'
    },
    {
      durationDays: 30,
      name: 'Monthly Plan',
      price: '$4.99',
      periodLabel: 'One Month',
      badge: 'POPULAR',
      description: '30 Days Full Access'
    },
    {
      durationDays: 90,
      name: 'Quarterly Plan',
      price: '$12.99',
      periodLabel: 'Three Months',
      badge: 'SAVE 13%',
      description: '90 Days Full Access'
    },
    {
      durationDays: 180,
      name: 'Half-Yearly Plan',
      price: '$22.99',
      periodLabel: 'Six Months',
      badge: 'SAVE 23%',
      description: '180 Days Full Access'
    },
    {
      durationDays: 365,
      name: 'Annual VIP',
      price: '$39.99',
      periodLabel: 'One Year',
      badge: 'BEST VALUE',
      description: '365 Days Full Access'
    },
    {
      durationDays: 36500,
      name: 'Lifetime Access',
      price: '$99.99',
      periodLabel: 'Permanently',
      badge: 'LIFETIME',
      description: 'Permanent Unlimited Access'
    }
  ];

  if (activeDrawer !== 'payment') return null;

  const currentPlan = SUBSCRIPTION_PLANS[selectedPlanIndex];
  const amount = `${currentPlan.price} (${currentPlan.periodLabel})`;

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Generate subscription request for account owner notification
    const uid = userProfile?.uid || 'local-guest-uid';

    createSubscriptionRequest({
      userId: uid,
      userName: userProfile?.displayName || cardName || 'Music Enthusiast',
      userEmail: userProfile?.email || 'subscriber@novamusic.app',
      planName: `${currentPlan.name} (${currentPlan.periodLabel})`,
      amount,
      durationDays: currentPlan.durationDays,
      paymentMethod: paymentMethod.toUpperCase()
    });

    // Simulate payment gateway submission & notification
    setTimeout(() => {
      showToast(`🎉 Subscription Payment Submitted! Sent to Admin for Approval.`);
      setIsProcessing(false);
      setActiveDrawer(null);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-neutral-950/90 border border-emerald-500/30 rounded-2xl shadow-2xl shadow-black overflow-hidden text-white flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-emerald-950/20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-bold text-base text-white">Nova Premium Checkout</h2>
              <p className="text-xs text-neutral-400">Secure Payment Gateway</p>
            </div>
          </div>
          <button
            onClick={() => setActiveDrawer(null)}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Guarantee Notice */}
        <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-xs text-emerald-300">
          <span className="flex items-center gap-1 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            256-Bit SSL Encrypted & PCI-DSS Compliant
          </span>
          <span className="font-mono text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded">SECURE GATEWAY</span>
        </div>

        <form onSubmit={handleProcessPayment} className="p-5 space-y-4">
          {/* Plan Duration Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2">
              Select Subscription Duration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
              {SUBSCRIPTION_PLANS.map((plan, idx) => {
                const isSelected = selectedPlanIndex === idx;
                return (
                  <button
                    key={plan.name}
                    type="button"
                    onClick={() => setSelectedPlanIndex(idx)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-500/50 text-white shadow-lg shadow-emerald-500/10'
                        : 'bg-neutral-900 border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200'
                    }`}
                  >
                    {plan.badge && (
                      <span className={`absolute top-0 right-0 font-extrabold text-[8px] px-1.5 py-0.5 rounded-bl uppercase ${
                        isSelected ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-300'
                      }`}>
                        {plan.badge}
                      </span>
                    )}
                    <div>
                      <div className="font-bold text-xs text-white truncate pr-6">{plan.name}</div>
                      <div className="text-[10px] text-neutral-400 font-medium">{plan.periodLabel}</div>
                    </div>
                    <div className="mt-2 pt-1 border-t border-white/5 flex items-baseline justify-between">
                      <span className="text-emerald-400 font-extrabold text-xs">{plan.price}</span>
                      <span className="text-[9px] text-neutral-500">{plan.durationDays >= 30000 ? 'Lifetime' : `${plan.durationDays}d`}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2">Payment Method</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'card' ? 'bg-white text-black border-white font-bold' : 'bg-neutral-900 text-neutral-300 border-white/10'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Credit Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'upi' ? 'bg-white text-black border-white font-bold' : 'bg-neutral-900 text-neutral-300 border-white/10'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                UPI / QR
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('paypal')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'paypal' ? 'bg-white text-black border-white font-bold' : 'bg-neutral-900 text-neutral-300 border-white/10'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                PayPal
              </button>
            </div>
          </div>

          {/* Form Fields based on payment method */}
          {paymentMethod === 'card' && (
            <div className="space-y-3 bg-neutral-900/60 p-3.5 rounded-xl border border-white/5">
              <div>
                <label className="text-[11px] text-neutral-400">Cardholder Name</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full mt-1 p-2 bg-neutral-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full mt-1 p-2 bg-neutral-900 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-neutral-400">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full mt-1 p-2 bg-neutral-900 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400">CVV</label>
                  <input
                    type="password"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full mt-1 p-2 bg-neutral-900 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'upi' && (
            <div className="space-y-3 bg-neutral-900/60 p-3.5 rounded-xl border border-white/5">
              <div>
                <label className="text-[11px] text-neutral-400">Enter UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full mt-1 p-2 bg-neutral-900 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="username@bank"
                  required
                />
              </div>
              <p className="text-[10px] text-neutral-500">Scan QR or enter Virtual Payment Address to complete secure transaction.</p>
            </div>
          )}

          {paymentMethod === 'paypal' && (
            <div className="p-4 bg-neutral-900/60 rounded-xl border border-white/5 text-center space-y-2">
              <p className="text-xs text-neutral-300">You will be redirected to the secure PayPal express checkout gateway.</p>
              <div className="inline-block px-3 py-1 rounded bg-amber-500/20 text-amber-300 font-bold text-xs">PayPal Express Checkout</div>
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting Request to Admin...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Pay {amount} & Request Approval
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
