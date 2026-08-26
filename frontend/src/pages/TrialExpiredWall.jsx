// pages/TrialExpiredWall.jsx
// Shown to shop_admin when their free trial has expired.
// Includes a full inline upgrade modal — no dependency on Subscription.css.
// On successful upgrade the user is sent to /login to get a fresh JWT.

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CheckCircle,
  AlertCircle,
  Crown,
  CreditCard,
  Loader,
  X,
  Zap,
  Star,
} from "lucide-react";
import "../styles/TrialExpiredWall.css";
import { API_BASE_URL } from '../config';

/* ── helper: pick an icon per plan tier ── */
const getPlanIcon = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("enterprise"))
    return <Crown size={24} color="#9c27b0" />;
  if (
    n.includes("professional") ||
    n.includes("pro") ||
    n.includes("business")
  )
    return <Star size={24} color="#9c27b0" />;
  return <Zap size={24} color="#9c27b0" />;
};

/* ─────────────────────────────────────────────────────── */
const TrialExpiredWall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  /* trialData is available for future use (e.g. showing exact expiry date) */
  const trialData = location.state?.trialData || {};

  const token = localStorage.getItem("token");

  /* ── upgrade-modal state ── */
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");

  /* ── handlers ── */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  /** Open modal and load plans priced above the shop's current package */
  const handleUpgradeClick = async () => {
    setShowUpgradeModal(true);
    setPurchaseSuccess(false);
    setPurchaseError("");
    setSelectedPlan(null);
    setPlansLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/shop/available-plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailablePlans(Array.isArray(data) ? data : []);
      } else {
        setAvailablePlans([]);
      }
    } catch {
      setAvailablePlans([]);
    } finally {
      setPlansLoading(false);
    }
  };

  /** POST upgrade-plan — runs full DB transaction on the backend */
  const handlePurchase = async () => {
    if (!selectedPlan) return;
    setPurchasing(true);
    setPurchaseError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/shop/upgrade-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ package_id: selectedPlan.package_id }),
      });
      const data = await res.json();
      if (res.ok) {
        setPurchaseSuccess(true);
      } else {
        setPurchaseError(data.message || "Purchase failed. Please try again.");
      }
    } catch {
      setPurchaseError("Network error. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  /**
   * After a successful upgrade the old JWT still carries trial/disabled status.
   * Clear storage and send the user to /login so a fresh token is issued.
   */
  const handleGoToLogin = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleCloseModal = () => {
    if (purchasing) return; // block close while a request is in-flight
    setShowUpgradeModal(false);
    setSelectedPlan(null);
    setPurchaseSuccess(false);
    setPurchaseError("");
  };

  /* ── render ── */
  return (
    <div className="trial-container">
      {/* ════════════════ Left Panel ════════════════ */}
      <div className="trial-left-section">
        <div className="trial-dots-pattern" />
        <div className="trial-left-content">
          <div className="trial-logo">🏪 Shop2Door</div>

          <h1 className="trial-main-heading">
            Your Trial
            <br />
            Has Ended
          </h1>

          <p className="trial-description">
            Your 7-day free trial has expired. Upgrade to a paid plan to keep
            your shop active and your data safe.
          </p>

          <div className="trial-warning-card">
            <div className="trial-warning-icon">⏰</div>
            <div className="trial-warning-content">
              <p className="trial-warning-title">Grace Period Active</p>
              <p className="trial-warning-text">
                You have a <strong>3-day grace period</strong> to upgrade before
                your account and all shop data are permanently deleted.
              </p>
            </div>
          </div>

          <div className="trial-grace-badges">
            <div className="trial-grace-badge">
              <span className="trial-grace-badge-dot" />
              Trial Expired
            </div>
            <div className="trial-grace-badge">
              <span className="trial-grace-badge-dot" />
              3 Days Remaining
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════ Right Panel ════════════════ */}
      <div className="trial-right-section">
        <div className="trial-card">
          <div className="trial-icon-wrapper">
            <div className="trial-icon-circle">⏰</div>
          </div>

          <h2 className="trial-card-title">Free Trial Expired</h2>

          <p className="trial-card-subtitle">
            Thank you for trying <strong>Shop2Door</strong>. To continue
            accessing your dashboard and keep your shop data safe, please select
            a paid plan below.
          </p>

          <div className="trial-info-box">
            <div className="trial-info-row">
              <span className="trial-info-icon">📅</span>
              <div>
                <p className="trial-info-title">Trial Status</p>
                <p className="trial-info-text">
                  Your <strong>7-day free trial</strong> has ended. Your shop is
                  currently suspended.
                </p>
              </div>
            </div>
            <div className="trial-divider" />
            <div className="trial-info-row">
              <span className="trial-info-icon">🔒</span>
              <div>
                <p className="trial-info-title">Data Safety</p>
                <p className="trial-info-text">
                  Your shop data is preserved for <strong>3 more days</strong>.
                  Upgrade to restore access immediately.
                </p>
              </div>
            </div>
            <div className="trial-divider" />
            <div className="trial-info-row">
              <span className="trial-info-icon">⚡</span>
              <div>
                <p className="trial-info-title">Instant Activation</p>
                <p className="trial-info-text">
                  Once you upgrade, your shop goes live again within minutes.
                </p>
              </div>
            </div>
          </div>

          <div className="trial-deletion-banner">
            <span className="trial-deletion-icon">⚠️</span>
            <p className="trial-deletion-text">
              <strong>Account Deletion Warning:</strong> If no plan is selected
              within 3 days of your trial ending, your account, shop profile,
              and all associated data will be{" "}
              <strong>permanently deleted</strong>.
            </p>
          </div>

          <button className="trial-upgrade-btn" onClick={handleUpgradeClick}>
            🚀 Upgrade Now — View Plans
          </button>

          <button className="trial-logout-btn" onClick={handleLogout}>
            Logout
          </button>

          <p className="trial-support-note">
            Need help? Contact us at{" "}
            <a href="mailto:info.shop2door@gmail.com">
              info.shop2door@gmail.com
            </a>
          </p>
        </div>
      </div>

      {/* ════════════════ Upgrade Modal ════════════════ */}
      {showUpgradeModal && (
        <div className="tew-modal-overlay" onClick={handleCloseModal}>
          <div className="tew-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="tew-modal-header">
              <div>
                <h2 className="tew-modal-title">Upgrade Your Plan</h2>
                <p className="tew-modal-subtitle">
                  Choose a plan that fits your business
                </p>
              </div>
              {!purchasing && (
                <button className="tew-modal-close" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              )}
            </div>

            {/* ── Success state ── */}
            {purchaseSuccess ? (
              <div className="tew-purchase-success">
                <div className="tew-success-icon">
                  <CheckCircle size={52} color="#16a34a" />
                </div>
                <h3>Plan Upgraded Successfully!</h3>
                <p>
                  Your new <strong>{selectedPlan?.name}</strong> plan is now
                  active. Please log in again to access your dashboard.
                </p>
                <button className="tew-login-btn" onClick={handleGoToLogin}>
                  Go to Login
                </button>
              </div>
            ) : (
              <>
                {/* ── Loading ── */}
                {plansLoading ? (
                  <div className="tew-loading">
                    <div className="tew-spinner" />
                    <p>Loading available plans…</p>
                  </div>
                ) : availablePlans.length === 0 ? (
                  <div className="tew-empty">
                    <Crown size={40} color="#9c27b0" />
                    <p>No upgrade plans are available at the moment.</p>
                  </div>
                ) : (
                  /* ── Plans grid ── */
                  <div className="tew-plans-grid">
                    {availablePlans.map((plan) => (
                      <div
                        key={plan.package_id}
                        className={`tew-plan-card ${
                          selectedPlan?.package_id === plan.package_id
                            ? "tew-plan-card--selected"
                            : ""
                        }`}
                        onClick={() => setSelectedPlan(plan)}
                      >
                        <div className="tew-plan-card-header">
                          <div className="tew-plan-icon">
                            {getPlanIcon(plan.name)}
                          </div>
                          {selectedPlan?.package_id === plan.package_id && (
                            <div className="tew-selected-badge">
                              <CheckCircle size={13} /> Selected
                            </div>
                          )}
                        </div>

                        <h3 className="tew-plan-name">{plan.name}</h3>

                        <p className="tew-plan-price">
                          Rs: {parseFloat(plan.price).toLocaleString()}
                          <span>/month</span>
                        </p>

                        <ul className="tew-plan-features">
                          <li>🏪 {plan.max_stores} Stores</li>
                          <li>👥 {plan.max_users_per_store} Users</li>
                          <li>
                            📦 {plan.max_products.toLocaleString()} Products
                          </li>
                          <li>
                            💾{" "}
                            {plan.max_storage_mb >= 1000
                              ? `${plan.max_storage_mb / 1000} GB`
                              : `${plan.max_storage_mb} MB`}{" "}
                            Storage
                          </li>
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Error ── */}
                {purchaseError && (
                  <div className="tew-error">
                    <AlertCircle size={18} />
                    <span>{purchaseError}</span>
                  </div>
                )}

                {/* ── Footer ── */}
                {availablePlans.length > 0 && (
                  <div className="tew-modal-footer">
                    <button
                      className="tew-cancel-btn"
                      onClick={handleCloseModal}
                      disabled={purchasing}
                    >
                      Cancel
                    </button>
                    <button
                      className="tew-purchase-btn"
                      onClick={handlePurchase}
                      disabled={!selectedPlan || purchasing}
                    >
                      {purchasing ? (
                        <>
                          <Loader size={16} className="tew-spin" />
                          Processing…
                        </>
                      ) : (
                        <>
                          <CreditCard size={16} />
                          {selectedPlan
                            ? `Purchase ${
                                selectedPlan.name
                              }  Rs: ${parseFloat(
                                selectedPlan.price
                              ).toLocaleString()}`
                            : "Select a Plan"}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrialExpiredWall;