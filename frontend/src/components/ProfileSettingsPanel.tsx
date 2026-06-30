"use client";

import { useRef, useState } from "react";
import { usersApi } from "@/lib/api/users";
import { useAuth } from "@/context/AuthContext";
import { uploadImage } from "@/lib/uploadImage";

export default function ProfileSettingsPanel() {
  const { user, token, refreshUser } = useAuth();

  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name:  user?.last_name  || "",
    phone_number: user?.phone_number || "",
    profile_image_url: user?.profile_image_url || "",
  });
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !token) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB."); return; }

    setUploadingPhoto(true);
    setError("");
    try {
      const url = await uploadImage(file);
      setForm(f => ({ ...f, profile_image_url: url }));
      await usersApi.updateMe({ profile_image_url: url }, token);
      await refreshUser();
      setSuccess("Profile photo updated.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Password change state
  const [pwForm, setPwForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError]     = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    if (!token) return;
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("First and last name are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await usersApi.updateMe({
        first_name: form.first_name,
        last_name:  form.last_name,
        phone_number: form.phone_number || undefined,
        profile_image_url: form.profile_image_url || undefined,
      }, token);
      await refreshUser();
      setSuccess("Profile updated successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!token) return;
    if (!pwForm.current_password) { setPwError("Enter your current password."); return; }
    if (pwForm.new_password.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (pwForm.new_password !== pwForm.confirm_password) { setPwError("Passwords do not match."); return; }
    setPwSaving(true);
    setPwError("");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/users/me/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password }),
      }).then(async r => {
        if (!r.ok) throw new Error((await r.json()).error || "Failed");
      });
      setPwSuccess("Password changed successfully.");
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      setTimeout(() => setPwSuccess(""), 4000);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setPwSaving(false);
    }
  };

  const roleLabel: Record<number, string> = {
    1: "User",
    2: "Agent",
    3: "Moderator",
    4: "Super Admin",
    5: "Service Provider",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "var(--surface)", border: "1px solid var(--border)",
    padding: "10px 14px", color: "var(--text)", fontSize: 13, outline: "none",
    fontFamily: "'DM Sans', sans-serif", borderRadius: 2, boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, letterSpacing: "0.1em",
    textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── PROFILE INFO ── */}
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 4 }}>Account</p>
          <h3 className="font-serif" style={{ fontSize: 24, fontWeight: 400 }}>Profile Settings</h3>
        </div>

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            style={{ display: "none" }}
          />
          <div
            onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
            title="Click to change photo"
            style={{ position: "relative", width: 64, height: 64, borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--border)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: uploadingPhoto ? "wait" : "pointer" }}>
            {form.profile_image_url ? (
              <img src={form.profile_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 24, color: "var(--text-muted)" }}>
                {user?.first_name?.[0]?.toUpperCase() || "?"}
              </span>
            )}
            <div style={{
              position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: uploadingPhoto ? 1 : 0, transition: "opacity 0.15s ease",
            }}>
              <span style={{ fontSize: 9, color: "#fff", textAlign: "center", padding: "0 4px" }}>
                {uploadingPhoto ? "Uploading…" : "Change"}
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 15 }}>{user?.first_name} {user?.last_name}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{user?.email}</div>
            <div style={{ fontSize: 11, color: "var(--gold)", marginTop: 4 }}>Click your photo to change it</div>
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, background: "var(--surface)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 10, color: "var(--text-muted)" }}>
                {roleLabel[user?.role || 1]}
              </span>
              {user?.is_verified && (
                <span style={{ fontSize: 10, background: "rgba(34,197,94,0.1)", color: "#22c55e", padding: "2px 8px", borderRadius: 10 }}>✓ Verified</span>
              )}
              {user?.is_premium && (
                <span style={{ fontSize: 10, background: "rgba(168,85,247,0.1)", color: "#a855f7", padding: "2px 8px", borderRadius: 10 }}>⭐ Premium</span>
              )}
              {user?.is_agent_verified && (
                <span style={{ fontSize: 10, background: "rgba(201,168,76,0.1)", color: "var(--gold)", padding: "2px 8px", borderRadius: 10 }}>✓ Verified Agent</span>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "10px 14px", fontSize: 13, marginBottom: 16, borderRadius: 2 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", padding: "10px 14px", fontSize: 13, marginBottom: 16, borderRadius: 2 }}>
            {success}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input name="first_name" value={form.first_name} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input name="last_name" value={form.last_name} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email Address</label>
            <input value={user?.email || ""} disabled
              style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} />
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          <div>
            <label style={labelStyle}>Phone Number</label>
            <input name="phone_number" type="tel" value={form.phone_number} onChange={handleChange}
              placeholder="+256 700 000 000" style={inputStyle} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={handleSave} disabled={saving}
              style={{ background: saving ? "rgba(201,168,76,0.4)" : "var(--gold)", border: "none", color: "#000", padding: "10px 28px", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* ── CHANGE PASSWORD ── */}
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: 24 }}>
        <h3 className="font-serif" style={{ fontSize: 20, fontWeight: 400, marginBottom: 20 }}>Change Password</h3>

        {pwError && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "10px 14px", fontSize: 13, marginBottom: 16, borderRadius: 2 }}>
            {pwError}
          </div>
        )}
        {pwSuccess && (
          <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", padding: "10px 14px", fontSize: 13, marginBottom: 16, borderRadius: 2 }}>
            {pwSuccess}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Current Password</label>
            <input type="password" value={pwForm.current_password}
              onChange={e => { setPwForm(f => ({ ...f, current_password: e.target.value })); setPwError(""); }}
              placeholder="Enter current password" style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>New Password</label>
              <input type="password" value={pwForm.new_password}
                onChange={e => { setPwForm(f => ({ ...f, new_password: e.target.value })); setPwError(""); }}
                placeholder="Min. 8 characters" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input type="password" value={pwForm.confirm_password}
                onChange={e => { setPwForm(f => ({ ...f, confirm_password: e.target.value })); setPwError(""); }}
                placeholder="Repeat new password"
                style={{ ...inputStyle, borderColor: pwForm.confirm_password && pwForm.new_password !== pwForm.confirm_password ? "rgba(239,68,68,0.5)" : "var(--border)" }} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={handlePasswordChange} disabled={pwSaving}
              style={{ background: pwSaving ? "rgba(201,168,76,0.4)" : "var(--gold)", border: "none", color: "#000", padding: "10px 28px", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: pwSaving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", borderRadius: 2 }}>
              {pwSaving ? "Saving..." : "Change Password"}
            </button>
          </div>
        </div>
      </div>

      {/* Member since */}
      <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "right" }}>
        Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"}
      </div>
    </div>
  );
}