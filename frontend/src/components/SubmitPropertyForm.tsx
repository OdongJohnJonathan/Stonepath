"use client";

import { useState, useRef } from "react";
import { propertiesApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { uploadImage } from "@/lib/uploadImage";

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SubmitPropertyForm({ onSuccess, onCancel }: Props) {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    address: "",
    bedrooms: "",
    bathrooms: "",
    square_footage: "",
    property_type_id: "1",
    transaction_type_id: "1",
    price: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please drop an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB."); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setError("You must be logged in to submit a property."); return; }
    setLoading(true);
    setError("");

    try {
      let imageUrl = "";

      // Upload image to Cloudinary first if one was selected
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadImage(imageFile);
        setUploading(false);
      }

      await propertiesApi.create({
        title: form.title,
        description: form.description,
        location: form.location,
        address: form.address,
        bedrooms: parseInt(form.bedrooms) || 0,
        bathrooms: parseInt(form.bathrooms) || 0,
        square_footage: parseInt(form.square_footage) || 0,
        property_type_id: parseInt(form.property_type_id),
        transaction_type_id: parseInt(form.transaction_type_id),
        images: imageUrl ? [imageUrl] : [],
        amenities: { price: parseInt(form.price) || 0 },
      }, token);

      onSuccess();
    } catch (err: unknown) {
      setUploading(false);
      setError(err instanceof Error ? err.message : "Failed to submit property.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "var(--surface)",
    border: "1px solid var(--border)", padding: "10px 14px",
    color: "var(--text)", fontSize: 14, outline: "none",
    fontFamily: "'DM Sans', sans-serif", borderRadius: 2,
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, letterSpacing: "0.1em",
    textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6,
  };

  const isSubmitting = loading || uploading;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }}>
      <div className="modal-card" style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: "40px 36px", width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>New Listing</p>
            <h2 className="font-serif" style={{ fontSize: 28, fontWeight: 300, color: "var(--text)" }}>Submit a Property</h2>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, padding: 4 }}>✕</button>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "12px 16px", fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Title */}
          <div>
            <label style={labelStyle}>Property Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Modern Villa in Kololo" style={inputStyle} />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} required placeholder="Describe the property..." rows={3}
              style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          {/* Location + Address */}
          <div className="modal-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>City / Area *</label>
              <input name="location" value={form.location} onChange={handleChange} required placeholder="e.g. Kampala" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Full Address</label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="e.g. Plot 12, Kololo Hill" style={inputStyle} />
            </div>
          </div>

          {/* Bedrooms + Bathrooms + Sqft */}
          <div className="modal-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Bedrooms *</label>
              <input name="bedrooms" type="number" min="0" value={form.bedrooms} onChange={handleChange} required placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Bathrooms *</label>
              <input name="bathrooms" type="number" min="0" value={form.bathrooms} onChange={handleChange} required placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Size (sqft)</label>
              <input name="square_footage" type="number" min="0" value={form.square_footage} onChange={handleChange} placeholder="0" style={inputStyle} />
            </div>
          </div>

          {/* Property Type + Transaction Type */}
          <div className="modal-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Property Type *</label>
              <select name="property_type_id" value={form.property_type_id} onChange={handleChange} style={inputStyle}>
                <option value="1">Residential</option>
                <option value="2">Commercial</option>
                <option value="3">Land</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Listing Type *</label>
              <select name="transaction_type_id" value={form.transaction_type_id} onChange={handleChange} style={inputStyle}>
                <option value="1">For Sale</option>
                <option value="2">For Rent</option>
              </select>
            </div>
          </div>

          {/* Price */}
          <div>
            <label style={labelStyle}>Price (USD) *</label>
            <input name="price" type="number" min="0" value={form.price} onChange={handleChange} required placeholder="e.g. 250000" style={inputStyle} />
          </div>

          {/* Image Upload */}
          <div>
            <label style={labelStyle}>Property Image</label>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${imagePreview ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: 2, padding: 24, textAlign: "center",
                cursor: "pointer", transition: "border-color 0.2s ease",
                background: "var(--surface)", position: "relative",
                overflow: "hidden",
              }}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="preview" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 2 }} />
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--gold)" }}>
                    ✓ {imageFile?.name} — click to change
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                  <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 4 }}>
                    Drop an image here or click to browse
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    JPG, PNG, WEBP — max 5MB
                  </div>
                </>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          {/* Upload status */}
          {uploading && (
            <div style={{ textAlign: "center", color: "var(--gold)", fontSize: 13 }}>
              ⏳ Uploading image to Cloudinary...
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button type="button" onClick={onCancel}
              style={{ flex: 1, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "12px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              style={{ flex: 2, background: isSubmitting ? "rgba(201,168,76,0.5)" : "var(--gold)", border: "none", color: "#0a0a0b", padding: "12px", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: isSubmitting ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              {uploading ? "Uploading Image..." : loading ? "Submitting..." : "Submit Property"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}