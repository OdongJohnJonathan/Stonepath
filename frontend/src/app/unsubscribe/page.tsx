"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(token ? "loading" : "error");

  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(res => { if (!res.ok) throw new Error(); setStatus("success"); })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div style={{ background: "rgba(13,15,26,0.85)", border: "1px solid rgba(201,168,76,0.2)", backdropFilter: "blur(24px)", padding: "40px 36px" }}>
      {status === "loading" && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, fontWeight: 300, color: "white", marginBottom: 12 }}>
            Unsubscribing...
          </h1>
          <p style={{ color: "#8892a4", fontSize: 14, lineHeight: 1.6 }}>
            Please wait a moment.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, fontWeight: 300, color: "white", marginBottom: 12 }}>
            Unsubscribed
          </h1>
          <p style={{ color: "#8892a4", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            You&apos;ve been removed from Stonepath Estates newsletter alerts. You can resubscribe any time.
          </p>
          <Link href="/" style={{ display: "block", background: "#c9a84c", color: "#0a0a0b", padding: "14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>
            Back to Stonepath
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, fontWeight: 300, color: "white", marginBottom: 12 }}>
            Link Invalid or Expired
          </h1>
          <p style={{ color: "#8892a4", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            We couldn&apos;t process this unsubscribe link. It may have already been used.
          </p>
          <button
            onClick={() => router.push("/")}
            style={{ display: "block", width: "100%", background: "#c9a84c", color: "#0a0a0b", padding: "14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", border: "none", cursor: "pointer" }}
          >
            Back to Stonepath
          </button>
        </>
      )}
    </div>
  );
}

export default function UnsubscribePage() {
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
          </div>
        }>
          <UnsubscribeContent />
        </Suspense>
      </div>
    </div>
  );
}
