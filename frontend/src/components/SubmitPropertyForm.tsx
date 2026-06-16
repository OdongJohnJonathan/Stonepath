"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { propertiesApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { uploadImage } from "@/lib/uploadImage";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 280, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
      Loading map...
    </div>
  ),
});

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

const getCurrency = (location: string) => {
  const loc = location.toLowerCase();
  if (loc.includes('kenya') || loc.includes('nairobi') || loc.includes('mombasa')) return 'KES';
  if (loc.includes('tanzania') || loc.includes('dar es salaam') || loc.includes('arusha')) return 'TZS';
  return 'UGX';
};

const RESIDENTIAL = 1;
const COMMERCIAL = 2;
const LAND = 3;

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
    mortgage_available: false,
    mortgage_rate: "",
    mortgage_term: "20",
    zoning: "",
    floors: "",
    office_units: "",
  });

  const [amenities, setAmenities] = useState({
    parking: false,
    garage: false,
    gated: false,
    generator: false,
    solar: false,
    borehole: false,
    security: false,
    furnished: false,
    swimming_pool: false,
    internet: false,
    cctv: false,
    elevator: false,
  });

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const propertyType = parseInt(form.property_type_id);
  const isResidential = propertyType === RESIDENTIAL;
  const isCommercial = propertyType === COMMERCIAL;
  const isLand = propertyType === LAND;
  const currency = getCurrency(form.location);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    if (type === 'checkbox') {
      setForm(f => ({ ...f, [name]: target.checked }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
    setError("");
  };

  const toggleAmenity = (key: string) => {
    setAmenities(a => ({ ...a, [key]: !a[key as keyof typeof a] }));
  };

  const addFiles = (files: File[]) => {
    const valid = files.filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    if (valid.length !== files.length) setError("Some files skipped — must be images under 5MB");
    const combined = [...imageFiles, ...valid].slice(0, 10);
    setImageFiles(combined);
    setImagePreviews(combined.map(f => URL.createObjectURL(f)));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newFiles.map(f => URL.createObjectURL(f)));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setError("You must be logged in."); return; }
    setLoading(true);
    setError("");

    try {
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        setUploading(true);
        imageUrls = await Promise.all(imageFiles.map(f => uploadImage(f)));
        setUploading(false);
      }

      const amenitiesData: Record<string, unknown> = {
        price: parseInt(form.price) || 0,
        ...amenities,
      };

      if (isCommercial) {
        amenitiesData.floors = parseInt(form.floors) || 0;
        amenitiesData.office_units = parseInt(form.office_units) || 0;
      }

      if (isLand) {
        amenitiesData.zoning = form.zoning;
      }

      await propertiesApi.create({
        title: form.title,
        description: form.description,
        location: form.location,
        address: form.address,
        bedrooms: isResidential ? parseInt(form.bedrooms) || 0 : undefined,
        bathrooms: isResidential || isCommercial ? parseInt(form.bathrooms) || 0 : undefined,
        square_footage: parseInt(form.square_footage) || 0,
        property_type_id: propertyType,
        transaction_type_id: parseInt(form.transaction_type_id),
        images: imageUrls,
        amenities: amenitiesData,
        currency,
        mortgage_available: form.mortgage_available,
        mortgage_rate: form.mortgage_available ? parseFloat(form.mortgage_rate) || 0 : undefined,
        mortgage_term: form.mortgage_available ? parseInt(form.mortgage_term) || 20 : undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
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

  const sectionTitle = (title: string) => (
    <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12, marginTop: 4, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
      {title}
    </div>
  );

  const amenityList = [
    { key: 'parking', label: '🚗 Parking' },
    { key: 'garage', label: '🏠 Garage' },
    { key: 'gated', label: '🔒 Gated Community' },
    { key: 'generator', label: '⚡ Generator' },
    { key: 'solar', label: '☀️ Solar Power' },
    { key: 'borehole', label: '💧 Borehole' },
    { key: 'security', label: '👮 Security Guard' },
    { key: 'swimming_pool', label: '🏊 Swimming Pool' },
    { key: 'furnished', label: '🛋️ Furnished' },
    { key: 'internet', label: '📶 Internet/Fibre' },
    { key: 'cctv', label: '📹 CCTV' },
    { key: 'elevator', label: '🛗 Elevator' },
  ];

  const relevantAmenities = isLand
    ? amenityList.filter(a => ['borehole', 'gated', 'security'].includes(a.key))
    : isCommercial
    ? amenityList.filter(a => !['furnished', 'swimming_pool'].includes(a.key))
    : amenityList;

  const isSubmitting = loading || uploading;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }}>
      <div className="modal-card" style={{ background: "var(--card-bg)", border: "1px solid var(--border)", padding: "40px 36px", width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto" }}>

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

          {/* ── BASIC INFO ── */}
          {sectionTitle('Basic Information')}

          <div>
            <label style={labelStyle}>Property Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Modern Villa in Kololo" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} required placeholder="Describe the property..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>

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

          {/* ── LOCATION ── */}
          {sectionTitle('Location')}

          <div className="modal-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>City / Area *</label>
              <input name="location" value={form.location} onChange={handleChange} required placeholder="e.g. Kampala, Uganda" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Full Address</label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="e.g. Plot 12, Kololo Hill" style={inputStyle} />
            </div>
          </div>

          {form.location && (
            <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: -8 }}>
              💰 Currency auto-detected: <strong>{currency}</strong>
            </div>
          )}

          {/* ── MAP PICKER ── */}
          {sectionTitle('Pin Location on Map')}
          <MapPicker
            latitude={latitude}
            longitude={longitude}
            onChange={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
            }}
          />

          {/* ── PROPERTY DETAILS ── */}
          {sectionTitle('Property Details')}

          {isResidential && (
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
          )}

          {isCommercial && (
            <div className="modal-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Total Area (sqft) *</label>
                <input name="square_footage" type="number" min="0" value={form.square_footage} onChange={handleChange} required placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Number of Floors</label>
                <input name="floors" type="number" min="1" value={form.floors} onChange={handleChange} placeholder="1" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Office / Shop Units</label>
                <input name="office_units" type="number" min="0" value={form.office_units} onChange={handleChange} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Bathrooms</label>
                <input name="bathrooms" type="number" min="0" value={form.bathrooms} onChange={handleChange} placeholder="0" style={inputStyle} />
              </div>
            </div>
          )}

          {isLand && (
            <div className="modal-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Size (sqft or acres) *</label>
                <input name="square_footage" type="number" min="0" value={form.square_footage} onChange={handleChange} required placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Zoning / Land Use</label>
                <select name="zoning" value={form.zoning} onChange={handleChange} style={inputStyle}>
                  <option value="">Select zoning</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="agricultural">Agricultural</option>
                  <option value="industrial">Industrial</option>
                  <option value="mixed">Mixed Use</option>
                </select>
              </div>
            </div>
          )}

          {/* ── PRICING ── */}
          {sectionTitle('Pricing')}

          <div>
            <label style={labelStyle}>Price ({currency}) *</label>
            <input name="price" type="number" min="0" value={form.price} onChange={handleChange} required
              placeholder={currency === 'UGX' ? 'e.g. 450,000,000' : currency === 'KES' ? 'e.g. 15,000,000' : 'e.g. 250,000,000'}
              style={inputStyle} />
          </div>

          {isResidential && form.transaction_type_id === '1' && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
                <input type="checkbox" name="mortgage_available" checked={form.mortgage_available} onChange={handleChange}
                  style={{ width: 16, height: 16, accentColor: 'var(--gold)' }} />
                Enable mortgage calculator for this property
              </label>

              {form.mortgage_available && (
                <div className="modal-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
                  <div>
                    <label style={labelStyle}>Interest Rate (%)</label>
                    <input name="mortgage_rate" type="number" min="1" max="30" step="0.5" value={form.mortgage_rate} onChange={handleChange} placeholder="e.g. 18" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Loan Term (years)</label>
                    <select name="mortgage_term" value={form.mortgage_term} onChange={handleChange} style={inputStyle}>
                      <option value="5">5 years</option>
                      <option value="10">10 years</option>
                      <option value="15">15 years</option>
                      <option value="20">20 years</option>
                      <option value="25">25 years</option>
                      <option value="30">30 years</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── AMENITIES ── */}
          {sectionTitle('Amenities & Features')}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
            {relevantAmenities.map(({ key, label }) => (
              <label key={key} style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                padding: '8px 10px',
                border: `1px solid ${amenities[key as keyof typeof amenities] ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: 2,
                background: amenities[key as keyof typeof amenities] ? 'rgba(201,168,76,0.08)' : 'transparent',
                transition: 'all 0.15s ease', fontSize: 13, color: 'var(--text)'
              }}>
                <input type="checkbox" checked={amenities[key as keyof typeof amenities]} onChange={() => toggleAmenity(key)}
                  style={{ width: 14, height: 14, accentColor: 'var(--gold)' }} />
                {label}
              </label>
            ))}
          </div>

          {/* ── IMAGES ── */}
          {sectionTitle(`Images (${imageFiles.length}/10)`)}

          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            style={{ border: '2px dashed var(--border)', borderRadius: 2, padding: 20, textAlign: "center", cursor: "pointer", background: "var(--surface)" }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
            <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 4 }}>Drop images here or click to browse</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>JPG, PNG, WEBP — max 5MB each, up to 10 images</div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: "none" }} />

          {imagePreviews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
              {imagePreviews.map((src, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={src} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 2 }} />
                  {i === 0 && (
                    <div style={{ position: 'absolute', top: 4, left: 4, background: 'var(--gold)', color: '#000', fontSize: 9, padding: '2px 5px', borderRadius: 2, fontWeight: 600 }}>
                      COVER
                    </div>
                  )}
                  <button type="button" onClick={() => removeImage(i)}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', width: 20, height: 20, borderRadius: '50%', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploading && (
            <div style={{ textAlign: "center", color: "var(--gold)", fontSize: 13 }}>
              ⏳ Uploading {imageFiles.length} image{imageFiles.length > 1 ? 's' : ''} to Cloudinary...
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
              {uploading ? `Uploading ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}...` : loading ? "Submitting..." : "Submit Property"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}