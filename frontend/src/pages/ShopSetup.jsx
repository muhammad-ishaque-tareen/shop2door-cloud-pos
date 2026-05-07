import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// import "../styles/ShopSetup.css";
import '../styles/ShopSetup.css'

const BASE = "http://localhost:5000";

const STEPS = ["Shop Info", "Location & Hours", "Logo & Review"];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const defaultHours = DAYS.reduce((acc, day) => {
  acc[day] = { open: "09:00", close: "21:00", closed: false };
  return acc;
}, {});

const CATEGORIES = [
  { value: "grocery",     label: "🛒 Grocery"    },
  { value: "electronics", label: "📱 Electronics" },
  { value: "clothing",    label: "👗 Clothing"    },
  { value: "pharmacy",    label: "💊 Pharmacy"    },
  { value: "restaurant",  label: "🍽️ Restaurant" },
  { value: "bakery",      label: "🥐 Bakery"      },
  { value: "cosmetics",   label: "💄 Cosmetics"   },
  { value: "other",       label: "📦 Other"       },
];

const ShopSetup = () => {
  const navigate        = useNavigate();
  const location        = useLocation();
  const selectedPackage = location.state;

  // Detect free trial: package passed from Pricing page with price = 0
  // or package_name contains "Free Trial"
  const isTrial =
    selectedPackage?.price === 0 ||
    selectedPackage?.price === "0" ||
    selectedPackage?.package_name?.toLowerCase().includes("free");

  const [step, setStep]               = useState(0);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Alert modal state (used to tell user they already used trial)
  const [alertModal, setAlertModal] = useState({ open: false, message: "" });

  // Step 0
  const [shopName,  setShopName]  = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopEmail, setShopEmail] = useState("");
  const [shopType,  setShopType]  = useState("");

  // Step 1
  const [address, setAddress] = useState("");
  const [city,    setCity]    = useState("");
  const [hours,   setHours]   = useState(defaultHours);

  // Step 2
  const [logo,        setLogo]        = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileRef = useRef();

  // On mount: if free trial, check whether this email has already used it
  useEffect(() => {
    if (!isTrial) return;
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.email) return;

    fetch(`${BASE}/api/freetrail/check-email?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.alreadyUsed) {
          setAlertModal({
            open: true,
            message:
              "You have already used your free trial. Please go back and select a paid package to continue.",
          });
        }
      })
      .catch(() => {});
  }, [isTrial]);

  //  Validators
  const validateStep = () => {
    const errs = {};
    if (step === 0) {
      if (!shopName.trim())  errs.shopName  = "Shop name is required.";
      if (!shopPhone.trim()) errs.shopPhone = "Shop phone is required.";
      if (!shopType)         errs.shopType  = "Please select a category.";
    }
    if (step === 1) {
      if (!address.trim()) errs.address = "Address is required.";
      if (!city.trim())    errs.city    = "City is required.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const clearFieldError = (key) =>
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));

  const handleNext = () => {
    if (!validateStep()) return;
    setError("");
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setError("");
    setFieldErrors({});
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, logo: "Logo must be under 2MB." }));
      return;
    }
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
    clearFieldError("logo");
  };

  const handleHourChange = (day, field, value) =>
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));

  const toggleClosed = (day) =>
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], closed: !prev[day].closed } }));

  //  Submit
  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const token    = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("shop_name",     shopName.trim());
      formData.append("phone",         shopPhone.trim());
      formData.append("email",         shopEmail.trim());
      formData.append("shop_type",     shopType);
      formData.append("address",       address.trim());
      formData.append("city",          city.trim());
      formData.append("opening_hours", JSON.stringify(hours));
      formData.append("package_id",    selectedPackage?.package_id ?? "");
      formData.append("is_free_trial", isTrial ? "true" : "false");
      if (logo) formData.append("logo", logo);

      const res  = await fetch(`${BASE}/api/shopsetup`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });
      const data = await res.json();

      if (!res.ok) {
        // Backend returns message: "free_trial_already_used" on 403
        // Show the alert modal instead of inline error banner
        if (data.message === "free_trial_already_used") {
          setAlertModal({
            open:    true,
            message: data.friendly_message ||
              "You have already used your free trial. Please select a paid plan to continue.",
          });
          return;
        }
        setError(data.message || "Failed to submit. Please try again.");
        return;
      }

      // FREE TRIAL → request submitted, admin will approve, go to pending
      // (shop & DB are not created until admin approves)
      if (data.is_free_trial) {
        navigate("/pending");
        return;
      }

      // PAID PLAN → go to payment confirmation
      navigate("/paymentconfirmation", {
        state: {
          request_id:   data.request_id,
          package_id:   selectedPackage?.package_id,
          package_name: selectedPackage?.package_name,
          price:        selectedPackage?.price,
        },
      });

    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  //  Render
  return (
    <div className="shopsetup-container">

      {/* Alert Modal — shown when trial already used */}
      {alertModal.open && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
        }}>
          <div style={{
            background: "#fff", borderRadius: 14, padding: 36,
            maxWidth: 440, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ color: "#1f2937", fontSize: "1.1rem", margin: "0 0 12px" }}>
              Free Trial Already Used
            </h3>
            <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: "0 0 24px", lineHeight: 1.6 }}>
              {alertModal.message}
            </p>
            <button
              onClick={() => navigate("/pricing")}
              style={{
                background: "#7e22ce", color: "#fff", border: "none",
                borderRadius: 8, padding: "12px 28px", fontWeight: 700,
                fontSize: "0.9rem", cursor: "pointer", width: "100%",
              }}
            >
              View Paid Plans →
            </button>
          </div>
        </div>
      )}

      {/*  Left Panel  */}
      <div className="shopsetup-left-section">
        <div className="shopsetup-dots-pattern" />
        <div className="shopsetup-left-content">

          <div className="shopsetup-logo">🏪 Shop2Door</div>

          <h1 className="shopsetup-main-heading">
            {isTrial ? "Start Your\nFree Trial" : "Launch Your\nShop Online"}
          </h1>
          <p className="shopsetup-description">
            {isTrial
              ? "Fill in your shop details to activate your 7-day free trial. No payment required."
              : "Fill in your shop details and we'll review your request within 24–48 hours."}
          </p>

          {selectedPackage && (
            <div
              className="shopsetup-package-card"
              style={isTrial ? { borderColor: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.18)" } : {}}
            >
              {/* Keep h3 white on purple panel — no colour override for trial */}
              <h3>{isTrial ? "🎁 Free Trial Selected" : "Selected Plan"}</h3>
              <p className="shopsetup-package-name">{selectedPackage.package_name}</p>
              <p className="shopsetup-package-price">
                {isTrial
                  ? "7 days FREE — No credit card needed"
                  : `Rs. ${Number(selectedPackage.price).toLocaleString()} / month`}
              </p>
            </div>
          )}

          <div className="shopsetup-steps-list">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`shopsetup-step-item ${i === step ? "active" : i < step ? "done" : ""}`}
              >
                <div className="shopsetup-step-dot">
                  {i < step ? "✓" : i + 1}
                </div>
                <span className="shopsetup-step-label">{label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/*  Right Panel  */}
      <div className="shopsetup-right-section">
        <div className="shopsetup-form-container">

          {/* Header */}
          <div className="shopsetup-form-header">
            <p className="shopsetup-step-title">Step {step + 1} of {STEPS.length}</p>
            <h2 className="shopsetup-form-title">{STEPS[step]}</h2>
            <p className="shopsetup-form-subtitle">
              {step === 0 && "Tell us the basics about your shop."}
              {step === 1 && "Where is your shop and when is it open?"}
              {step === 2 && "Upload your logo and confirm your details."}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="shopsetup-progress-bar">
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div className={`shopsetup-progress-step ${i === step ? "active" : i < step ? "done" : ""}`}>
                  <div className="shopsetup-progress-circle">
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className="shopsetup-progress-step-label">{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`shopsetup-progress-line ${i < step ? "done" : ""}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Form Steps */}
          <div className="shopsetup-form shopsetup-fade-in" key={step}>

            {/*  STEP 0  */}
            {step === 0 && (
              <>
                <div className="shopsetup-form-group">
                  <label className="shopsetup-label">
                    Shop Name <span className="shopsetup-req">*</span>
                  </label>
                  <input
                    className={`shopsetup-input ${fieldErrors.shopName ? "error" : ""}`}
                    type="text"
                    placeholder="Tareen's Electronics"
                    value={shopName}
                    onChange={(e) => { setShopName(e.target.value); clearFieldError("shopName"); }}
                  />
                  {fieldErrors.shopName && <span className="shopsetup-field-error">{fieldErrors.shopName}</span>}
                </div>

                <div className="shopsetup-row">
                  <div className="shopsetup-form-group">
                    <label className="shopsetup-label">
                      Shop Phone <span className="shopsetup-req">*</span>
                    </label>
                    <input
                      className={`shopsetup-input ${fieldErrors.shopPhone ? "error" : ""}`}
                      type="tel"
                      placeholder="0300-0000000"
                      value={shopPhone}
                      onChange={(e) => { setShopPhone(e.target.value); clearFieldError("shopPhone"); }}
                    />
                    {fieldErrors.shopPhone && <span className="shopsetup-field-error">{fieldErrors.shopPhone}</span>}
                  </div>

                  <div className="shopsetup-form-group">
                    <label className="shopsetup-label">
                      Shop Email <span className="shopsetup-optional">(optional)</span>
                    </label>
                    <input
                      className="shopsetup-input"
                      type="email"
                      placeholder="shop@example.com"
                      value={shopEmail}
                      onChange={(e) => setShopEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="shopsetup-form-group">
                  <label className="shopsetup-label">
                    Shop Category <span className="shopsetup-req">*</span>
                  </label>
                  <div className="shopsetup-category-grid">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        className={`shopsetup-category-chip ${shopType === cat.value ? "active" : ""}`}
                        onClick={() => { setShopType(cat.value); clearFieldError("shopType"); }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  {fieldErrors.shopType && <span className="shopsetup-field-error">{fieldErrors.shopType}</span>}
                </div>
              </>
            )}

            {/*  STEP 1  */}
            {step === 1 && (
              <>
                <div className="shopsetup-form-group">
                  <label className="shopsetup-label">
                    Street Address <span className="shopsetup-req">*</span>
                  </label>
                  <textarea
                    className={`shopsetup-textarea ${fieldErrors.address ? "error" : ""}`}
                    placeholder="Near Akhuwat College University, Kasur"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); clearFieldError("address"); }}
                  />
                  {fieldErrors.address && <span className="shopsetup-field-error">{fieldErrors.address}</span>}
                </div>

                <div className="shopsetup-form-group">
                  <label className="shopsetup-label">
                    City <span className="shopsetup-req">*</span>
                  </label>
                  <input
                    className={`shopsetup-input ${fieldErrors.city ? "error" : ""}`}
                    type="text"
                    placeholder="e.g. Lahore"
                    value={city}
                    onChange={(e) => { setCity(e.target.value); clearFieldError("city"); }}
                  />
                  {fieldErrors.city && <span className="shopsetup-field-error">{fieldErrors.city}</span>}
                </div>

                <div className="shopsetup-form-group">
                  <label className="shopsetup-label">Opening Hours</label>
                  <div className="shopsetup-hours-grid">
                    {DAYS.map((day) => (
                      <div
                        key={day}
                        className={`shopsetup-hours-row ${hours[day].closed ? "closed" : ""}`}
                      >
                        <div className="shopsetup-hours-day">
                          <button
                            type="button"
                            className={`shopsetup-closed-toggle ${hours[day].closed ? "" : "off"}`}
                            onClick={() => toggleClosed(day)}
                            title={hours[day].closed ? "Mark as Open" : "Mark as Closed"}
                          >
                            {hours[day].closed ? "✕" : "✓"}
                          </button>
                          <span className="shopsetup-day-name">{day.slice(0, 3)}</span>
                        </div>

                        {hours[day].closed ? (
                          <span className="shopsetup-closed-label">Closed</span>
                        ) : (
                          <div className="shopsetup-time-inputs">
                            <input
                              type="time"
                              className="shopsetup-time-input"
                              value={hours[day].open}
                              onChange={(e) => handleHourChange(day, "open", e.target.value)}
                            />
                            <span className="shopsetup-time-sep">→</span>
                            <input
                              type="time"
                              className="shopsetup-time-input"
                              value={hours[day].close}
                              onChange={(e) => handleHourChange(day, "close", e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/*  STEP 2  */}
            {step === 2 && (
              <>
                <div className="shopsetup-form-group">
                  <label className="shopsetup-label">
                    Shop Logo <span className="shopsetup-optional">(optional, max 2MB)</span>
                  </label>
                  <div className="shopsetup-logo-drop" onClick={() => fileRef.current.click()}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="shopsetup-logo-preview" />
                    ) : (
                      <div className="shopsetup-logo-placeholder">
                        <span className="shopsetup-upload-icon">📷</span>
                        <span className="shopsetup-upload-text">Click to upload your shop logo</span>
                        <span className="shopsetup-upload-hint">PNG, JPG — max 2MB</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleLogoChange}
                  />
                  {logoPreview && (
                    <button
                      type="button"
                      className="shopsetup-remove-logo"
                      onClick={() => { setLogo(null); setLogoPreview(null); }}
                    >
                      Remove logo
                    </button>
                  )}
                  {fieldErrors.logo && <span className="shopsetup-field-error">{fieldErrors.logo}</span>}
                </div>

                {/* Review */}
                <div className="shopsetup-review">
                  <p className="shopsetup-review-title">Review Your Details</p>
                  <div className="shopsetup-review-grid">
                    {[
                      { key: "Shop Name", val: shopName },
                      { key: "Category",  val: shopType,  cap: true },
                      { key: "Phone",     val: shopPhone },
                      { key: "Email",     val: shopEmail || "—" },
                      { key: "Address",   val: address ? `${address}, ${city}` : "—" },
                      {
                        key: "Plan",
                        val: isTrial
                          ? "Free Trial — 7 days"
                          : selectedPackage
                          ? `${selectedPackage.package_name} — Rs. ${Number(selectedPackage.price).toLocaleString()}/mo`
                          : "—",
                      },
                    ].map(({ key, val, cap }) => (
                      <div key={key} className="shopsetup-review-item">
                        <span className="shopsetup-review-key">{key}</span>
                        <span className={`shopsetup-review-val${cap ? " cap" : ""}`}>{val || "—"}</span>
                      </div>
                    ))}
                  </div>

                  {/* Accurate note: request goes to pending, not instant activation */}
                  {isTrial && (
                    <div className="shopsetup-trial-note">
                      <p>
                        ✅ No payment required. Your request will be reviewed and approved shortly.
                        Your 7-day trial starts from the day of approval.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>

          {/* Error Banner */}
          {error && <div className="shopsetup-error-banner">{error}</div>}

          {/* Navigation */}
          <div className="shopsetup-nav">
            {step > 0 && (
              <button type="button" className="shopsetup-btn-back" onClick={handleBack}>
                ← Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" className="shopsetup-btn-next" onClick={handleNext}>
                Continue →
              </button>
            ) : (
              <button
                type="button"
                className="shopsetup-btn-submit"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <><span className="shopsetup-spinner" /> Submitting…</>
                  : isTrial
                  ? "Activate Free Trial →"
                  : "Submit Shop Request →"}
              </button>
            )}
          </div>

          {/* Footer note reflects actual flow */}
          <p className="shopsetup-footer-note">
            {isTrial
              ? "Reviewed quickly — you'll receive login credentials by email once approved."
              : "Reviewed within 24–48 hours after payment confirmation."}
          </p>

        </div>
      </div>
    </div>
  );
};

export default ShopSetup;