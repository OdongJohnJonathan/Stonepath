"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderTrackingId = searchParams.get("OrderTrackingId");

  const [status, setStatus] = useState<"checking" | "completed" | "failed" | "pending">("checking");

  useEffect(() => {
    if (!orderTrackingId) {
      setStatus("failed");
      return;
    }

    const token = localStorage.getItem("sp_token");
    if (!token) {
      setStatus("failed");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/status/${orderTrackingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "completed") setStatus("completed");
        else if (data.status === "failed" || data.status === "reversed") setStatus("failed");
        else setStatus("pending");
      })
      .catch(() => setStatus("failed"));
  }, [orderTrackingId]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0a0a0b 0%, #1a1410 40%, #0d1520 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40, justifyContent: "center", cursor: "pointer" }} onClick={() => router.push("/")}>
          <img src="/logo.png" alt="Stonepath Estates" style={{ height: 36, width: 36, borderRadius: "50%", objectFit: "cover" }} />
          <span style={{ fontSize: 22, color: "white", fontFamily: "Cormorant Garamond, serif" }}>Stonepath Estates</span>
        </div>

        <div style={{ background: "rgba(13,15,26,0.85)", border: "1px solid rgba(201,168,76,0.2)", backdropFilter: "blur(24px)", padding: "40px 36px" }}>
          {status === "checking" && (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
              <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, fontWeight: 300, color: "white", marginBottom: 12 }}>
                Confirming Payment...
              </h1>
              <p style={{ color: "#8892a4", fontSize: 14, lineHeight: 1.6 }}>
                Please wait while we confirm your payment with Pesapal.
              </p>
            </>
          )}

          {status === "completed" && (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, fontWeight: 300, color: "white", marginBottom: 12 }}>
                Payment Successful!
              </h1>
              <p style={{ color: "#8892a4", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Your payment has been confirmed and your account has been updated.
              </p>
              <Link href="/" style={{ display: "block", background: "#c9a84c", color: "#0a0a0b", padding: "14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>
                Go to Homepage
              </Link>
            </>
          )}

          {status === "pending" && (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
              <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, fontWeight: 300, color: "white", marginBottom: 12 }}>
                Payment Pending
              </h1>
              <p style={{ color: "#8892a4", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Your payment is still being processed. This page will not auto-refresh — please check back shortly.
              </p>
              <Link href="/" style={{ display: "block", background: "transparent", border: "1px solid rgba(201,168,76,0.4)", color: "#c9a84c", padding: "14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>
                Go to Homepage
              </Link>
            </>
          )}

          {status === "failed" && (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
              <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, fontWeight: 300, color: "white", marginBottom: 12 }}>
                Payment Failed
              </h1>
              <p style={{ color: "#8892a4", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                We couldn&apos;t confirm your payment. No charges were made, or the transaction was declined. Please try again.
              </p>
              <Link href="/" style={{ display: "block", background: "#c9a84c", color: "#0a0a0b", padding: "14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>
                Go to Homepage
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={null}>
      <PaymentCallbackContent />
    </Suspense>
  );
}
