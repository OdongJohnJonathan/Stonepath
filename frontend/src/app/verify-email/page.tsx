"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const success = searchParams.get("success");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(
    success ? "success" : token ? "verifying" : "idle"
  );
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (token && !success) {
      // Redirect browser directly to backend — it will verify and redirect back with ?success=true
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email?token=${token}`;
    }
  }, [token, success]);

  useEffect(() => {
    if (status === "success") {
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(timer); router.push("/login"); }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, router]);

  return (
    <div style={{ background: "rgba(13,15,26,0.85)", border: "1px solid rgba(201,168,76,0.2)", backdropFilter: "blur(24px)", padding: "40px 36px" }}>
      {status === "verifying" && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, fontWeight: 300, color: "white", marginBottom: 12 }}>
            Verifying...
          </h1>
          <p style={{ color: "#8892a4", fontSize: 14, lineHeight: 1.6 }}>
            Please wait while we verify your email address.
          </p>
        </>
      )}

      {status === "success" && (
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
      )}

      {status === "idle" && (
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
          <img src="/logo.png" alt="Stonepath Estates" style={{ height: 36, width: 36, borderRadius: "50%", objectFit: "cover" }} />
          <span style={{ fontSize: 22, color: "white", fontFamily: "Cormorant Garamond, serif" }}>Stonepath Estates</span>
        </div>
        <Suspense fallback={
          <div style={{ background: "rgba(13,15,26,0.85)", border: "1px solid rgba(201,168,76,0.2)", backdropFilter: "blur(24px)", padding: "40px 36px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, fontWeight: 300, color: "white", marginBottom: 12 }}>
              Verifying...
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
