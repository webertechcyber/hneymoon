// HONEYMOON — Checkout Page
// Secure payment with IntaSend (card) and NestLink (M-Pesa for Kenya)
// ============================================================

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Heart, CreditCard, Smartphone, Shield, CheckCircle2, AlertCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getCountryCurrency } from "@/lib/constants";
import paymentService from "@/services/payment.service";
import { navigate } from "wouter/use-browser-location";


export default function CheckoutPage() {
  const { profile, refreshProfile } = useAuth();
  const [location] = useLocation();


  const [loading, setLoading] = useState(false);
const [paid, setPaid] = useState(false);

const [paymentResult, setPaymentResult] =
    useState<"success" | "failed" | null>(null);

const [paymentMessage, setPaymentMessage] =
    useState("");

const [phone, setPhone] = useState("");

const [showMpesaPrompt, setShowMpesaPrompt] = useState(false);

const [trackingOrderId, setTrackingOrderId] = useState("");

const [isTracking, setIsTracking] = useState(false);

const [paymentState, setPaymentState] = useState<
  | "idle"
  | "starting"
  | "waiting"
  | "success"
  | "failed"
  | "cancelled"
  | "pending_referrals"
>("idle");

  const { currency, symbol } = getCountryCurrency(profile.country);
  const amountDue = profile.amountDue ?? getCountryCurrency(profile.country).amount;
  const isKenya = profile.country?.toLowerCase() === "kenya";
  const paymentMethod = isKenya ? "M-Pesa" : "Visa / MasterCard";
  // Poll NestLink for M-Pesa payment status
  useEffect(() => {
    if (!isTracking || !trackingOrderId) return;

    const pollInterval = setInterval(async () => {

      
      try {
        
        const status = await paymentService.verifyNestLinkPayment(
  trackingOrderId
);
       if (status.pending) {

    // keep polling
    return;

}

if (status.paid && status.resultCode === 0) {

    await paymentService.completePayment(
        trackingOrderId,
    );

    await refreshProfile();

    setIsTracking(false);

    setPaymentResult("success");

    setPaymentMessage(
        "Payment successful! Redirecting..."
    );

    setTimeout(() => {

        navigate("/profile");

    }, 2500);

}
else if (!status.pending) {

    setIsTracking(false);

    setPaymentResult("failed");

    setPaymentMessage(status.message);

}

      } catch (error) {
        console.error("Tracking error:", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [isTracking, trackingOrderId, profile.uid, amountDue, currency, refreshProfile, navigate]);


//added this fxn temporary
  const handleIntaSendPayment = async () => {
  toast.info("Card payments are temporarily disabled.");
};
  //removed this fxn temporary
/*
  const handleIntaSendPayment = async () => {
    try {
      setLoading(true);
      const payment = await paymentService.getPayments(profile.uid);

const latestPayment = payment[payment.length - 1];

if (!latestPayment) {
  throw new Error("No payment record found.");
}

const result = await paymentService.startNestLinkPayment(
  latestPayment,
  formattedPhone,
);

      // Redirect to IntaSend payment page
      if (result.checkoutUrl) {
  window.location.href = result.checkoutUrl;
}
    } catch (error) {
      console.error("IntaSend payment failed:", error);
      toast.error("Failed to initiate payment. Please try again.");
      setLoading(false);
    }
  };
*/
  const handleNestLinkMpesa = async () => {
    if (!phone) {
      toast.error("Please enter your M-Pesa phone number");
      return;
    }

    // Validate phone format (should start with 254)
    const formattedPhone = phone.startsWith("254") ? phone : `254${phone.replace(/^0/, "")}`;
    if (!/^254\d{9}$/.test(formattedPhone)) {
      toast.error("Please enter a valid Kenyan phone number");
      return;
    }

    try {

    setLoading(true);
    setPaymentState("starting");

    const created = await paymentService.createPayment(profile.uid);

const latestPayment = await paymentService.getPayment(
  created.paymentId,
);

if (!latestPayment) {
  throw new Error("Unable to create payment.");
}
      
    const result =
      await paymentService.startNestLinkPayment(
        latestPayment,
        formattedPhone,
      );
      toast.success("M-Pesa prompt sent to your phone. Please enter your PIN.");
      setTrackingOrderId(result.paymentId);

setPaymentState("waiting");

setIsTracking(true);

setShowMpesaPrompt(false);
    }catch (error) {

    console.error("Tracking error:", error);

    setIsTracking(false);

    toast.error(
        "Unable to verify payment. Please try again.",
    );


    } finally {
      setLoading(false);
    }
  };

  if (paymentResult === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-background to-pink-50 p-6">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <h1 className="font-['Playfair_Display'] text-3xl font-bold text-foreground">Payment Successful!</h1>
          <p className="mt-3 text-muted-foreground">{paymentMessage}</p>
        </div>
      </div>
    );
  }

  if (paymentResult === "failed") {

    return (

        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-background to-pink-50 p-6">

            <div className="text-center max-w-md">

                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-50">

                    <AlertCircle
                        size={48}
                        className="text-red-500"
                    />

                </div>

                <h1 className="font-['Playfair_Display'] text-3xl font-bold">

                    Payment Failed

                </h1>

                <p className="mt-4 text-muted-foreground">

                    {paymentMessage}

                </p>

                <Button

                    className="mt-8"

                    onClick={() => {

                        setPaymentResult(null);

                        setPaymentMessage("");

                    }}

                >

                    Try Again

                </Button>

            </div>

        </div>

    );

}


  if (isTracking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-background to-pink-50 p-6">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50">
            <Loader size={48} className="text-blue-500 animate-spin" />
          </div>
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-foreground">Processing Payment</h1>
          <p className="mt-3 text-muted-foreground">
            Waiting for M-Pesa confirmation. Please complete the prompt on your phone.
          </p>
          <p className="mt-4 text-sm text-gray-600">
            This may take up to 2 minutes. Do not close this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-background to-pink-50 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2">
          <Heart size={24} className="text-primary" fill="currentColor" />
          <span className="font-['Playfair_Display'] text-xl font-bold text-primary">HONEYMOON</span>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                {isKenya ? (
                  <Smartphone size={20} className="text-primary" />
                ) : (
                  <CreditCard size={20} className="text-primary" />
                )}
              </div>
              <div>
                <h1 className="font-['Playfair_Display'] text-2xl font-bold text-foreground">Secure Checkout</h1>
                <p className="text-sm text-muted-foreground">Review your membership details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Member</span>
                <span className="font-medium text-foreground">{profile.displayName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Country</span>
                <span className="font-medium text-foreground">{profile.country}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <Badge variant="secondary">{paymentMethod}</Badge>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground">Membership Fee</span>
                <span className="text-2xl font-extrabold text-primary">
                  {symbol} {amountDue} {currency}
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                <Shield size={16} />
                <span>Your payment is secure and encrypted</span>
              </div>
            </div>

            {!showMpesaPrompt ? (
              <Button
                onClick={isKenya ? () => setShowMpesaPrompt(true) : handleIntaSendPayment}
                disabled={loading}
                className="mt-8 w-full gap-2 bg-primary hover:bg-primary/90 text-white"
                size="lg"
              >
                {loading && <Loader size={16} className="animate-spin" />}
                {isKenya ? "Pay with M-Pesa" : "Pay with Card"}
              </Button>
            ) : (
              <div className="mt-8 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">M-Pesa Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="0712345678 or 254712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your Safaricom M-Pesa registered phone number
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowMpesaPrompt(false)}
                    disabled={loading}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleNestLinkMpesa}
                    disabled={loading || !phone}
                    className="flex-1 gap-2 bg-primary hover:bg-primary/90"
                  >
                    {loading && <Loader size={16} className="animate-spin" />}
                    Send Prompt
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-2 rounded-lg bg-gray-50 p-4 text-xs text-gray-600">
              <div className="flex gap-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <p>
                  {isKenya
                    ? "You will receive an M-Pesa prompt on your phone. Enter your PIN to complete the payment."
                    : "You will be redirected to IntaSend to complete your card payment securely."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By proceeding, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
