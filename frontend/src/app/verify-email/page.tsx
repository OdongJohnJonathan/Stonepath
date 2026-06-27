"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get("success");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (success) {
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(timer); router.push("/login"); }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [success, router]);

  return (
    <div style={{ background: "rgba(13,15,26,0.85)", border: "1px solid rgba(201,168,76,0.2)", backdropFilter: "blur(24px)", padding: "40px 36px" }}>
      {success ? (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, fontWeight: 300, color: "white", marginBottom: 12 }}>
            Email Verified!
          </h1>
          <p style={{ color: "#8892a4", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Your email has been verified successfully. Redirecting to login in {countdown} seconds...
          </p>
          <Link href="/login" style={{ display: "block", background: "#c9a84c", color: "#0a0a0b", padding: "14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>
            Sign In Now
          </Link>
        </>
      ) : (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, fontWeight: 300, color: "white", marginBottom: 12 }}>
            Check Your Email
          </h1>
          <p style={{ color: "#8892a4", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            We sent a verification link to your email address. Click the link to verify your account.
          </p>
          <p style={{ color: "#8892a4", fontSize: 12 }}>
            Didn&apos;t receive it? Check your spam folder.
          </p>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0a0a0b 0%, #1a1410 40%, #0d1520 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40, justifyContent: "center", cursor: "pointer" }} onClick={() => router.push("/")}>
          <div style={{ width: 28, height: 28, border: "1px solid #c9a84c", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 12, height: 12, background: "#c9a84c", transform: "rotate(45deg)" }} />
          </div>
          <span style={{ fontSize: 22, color: "white", fontFamily: "Cormorant Garamond, serif" }}>Stonepath™</span>
        </div>

        <Suspense fallback={
          <div style={{ background: "rgba(13,15,26,0.85)", border: "1px solid rgba(201,168,76,0.2)", backdropFilter: "blur(24px)", padding: "40px 36px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, fontWeight: 300, color: "white", marginBottom: 12 }}>
              Loading...
            </h1>
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 12 }}>
          <Link href="/" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>← Back to listings</Link>
        </p>
      </div>
    </div>
  );
}