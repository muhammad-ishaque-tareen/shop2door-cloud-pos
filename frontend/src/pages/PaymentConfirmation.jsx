import React, { useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import '../styles/PaymentConfirmation.css';

const BASE = "http://localhost:5000";

const PaymentConfirmation = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Passed from ShopSetup after successful submission
  const { request_id, package_name, price } = location.state || {};

  const [formData, setFormData] = useState({
    paymentMethod: '',
    accountNumber: '',
    transactionId: '',
    amount:        price ? String(price) : '',  // pre-fill with package price
    paymentDate:   ''
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.paymentMethod) {
      setError('Please select a payment method.'); return;
    }
    if (!formData.accountNumber || !formData.transactionId || !formData.amount || !formData.paymentDate) {
      setError('Please fill in all required fields.'); return;
    }
    if (!request_id) {
      setError('Missing shop request. Please go back and submit shop details first.'); return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${BASE}/api/shopsetup/${request_id}/payment`, {
        method:  "PUT",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_method:  formData.paymentMethod,
          sender_account:  formData.accountNumber,
          transaction_ref: formData.transactionId,
          amount:          formData.amount,
          payment_date:    formData.paymentDate,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        navigate("/pending");   // or whatever your "under review" page is
      } else {
        setError(data.message || "Submission failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      <div className="payment-left-section">
        <div className="payment-left-content">
          <h1 className="payment-logo">Shop2Door LOGO</h1>

          <h2 className="payment-main-heading">
            Secure Payment<br />Confirmation
          </h2>

          <p className="payment-description">
            Complete your payment safely.<br />
            All transactions are encrypted and protected.
          </p>

          {/* Package summary — pulled from ShopSetup navigation state */}
          {package_name && (
            <div className="payment-security-card">
              <div className="security-icon">📦</div>
              <div className="security-content">
                <h3 className="security-title">{package_name} Plan</h3>
                <p className="security-text">Rs. {Number(price).toLocaleString()} / month</p>
                <p className="security-subtext">Transfer this exact amount</p>
              </div>
            </div>
          )}

          <div className="payment-security-card" style={{ marginTop: '12px' }}>
            <div className="security-icon">🛡️</div>
            <div className="security-content">
              <h3 className="security-title">Bank-grade Security</h3>
              <p className="security-text">256-bit SSL • PCI DSS Compliant</p>
              <p className="security-subtext">Protected by industry-leading encryption</p>
            </div>
          </div>

          <div className="payment-trust-section">
            <p className="trust-text">Trusted by 50,000+ customers</p>
            <div className="trust-badges">
              <div className="trust-badge trust-badge-green"><span className="badge-icon">✓</span></div>
              <div className="trust-badge trust-badge-blue"><span className="badge-icon">✓</span></div>
              <div className="trust-badge trust-badge-orange"><span className="badge-icon">✓</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="payment-right-section">
        <div className="payment-form-container">
          <div className="payment-form-header">
            <h2 className="payment-title">Payment Details</h2>
            <p className="payment-form-subtitle">Please provide your payment information below</p>
          </div>

          <form onSubmit={handleSubmit} className="payment-form">

            <div className="payment-form-group">
              <label className="payment-label">Payment Method</label>
              <div className="payment-select-wrapper">
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="payment-select"
                  required
                >
                  <option value="">Select payment method</option>
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
                <span className="select-arrow">↓</span>
              </div>
            </div>

            <div className="payment-form-group">
              <label className="payment-label">Sender Account / Wallet Number</label>
              <div className="payment-input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  name="accountNumber"
                  placeholder="03XXXXXXXXX or Bank Account No"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  className="payment-input payment-input-with-icon"
                  required
                />
              </div>
            </div>

            <div className="payment-form-group">
              <label className="payment-label">Transaction ID / Reference Number</label>
              <div className="payment-input-wrapper">
                <span className="input-icon">🔗</span>
                <input
                  type="text"
                  name="transactionId"
                  placeholder="Enter transaction/reference ID"
                  value={formData.transactionId}
                  onChange={handleChange}
                  className="payment-input payment-input-with-icon"
                  required
                />
              </div>
            </div>

            <div className="payment-form-group">
              <label className="payment-label">Amount Paid</label>
              <div className="payment-input-wrapper">
                <span className="input-currency">Rs</span>
                <input
                  type="number"
                  name="amount"
                  placeholder="e.g. 5000"
                  value={formData.amount}
                  onChange={handleChange}
                  className="payment-input payment-input-with-currency"
                  required
                />
              </div>
            </div>

            <div className="payment-form-group">
              <label className="payment-label">Payment Date</label>
              <div className="payment-input-wrapper">
                <span className="input-icon">📅</span>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleChange}
                  className="payment-input payment-input-with-icon"
                  required
                />
              </div>
            </div>

            {error && <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '8px' }}>{error}</p>}

            <button type="submit" className="payment-submit-button" disabled={loading}>
              {loading ? "Submitting…" : "SUBMIT PAYMENT →"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmation;