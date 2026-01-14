import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import '../styles/PaymentConfirmation.css';

const PaymentConfirmation = () => {
  const [formData, setFormData] = useState({
    paymentMethod: '',
    accountNumber: '',
    transactionId: '',
    amount: '',
    paymentDate: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.paymentMethod) {
      alert('Please select a payment method!');
      return;
    }
    
    if (!formData.accountNumber || !formData.transactionId || !formData.amount || !formData.paymentDate) {
      alert('Please fill all required fields!');
      return;
    }
    
    console.log('Payment submitted:', formData);
  };

  return (
    <div className="payment-container">
      <div className="payment-left-section">
        <div className="payment-left-content">
          <h1 className="payment-logo">
            Shop2Door LOGO
          </h1>
          
          <h2 className="payment-main-heading">
            Secure Payment<br />
            Confirmation
          </h2>

          <p className="payment-description">
            Complete your payment safely.<br />
            All transactions are encrypted and protected.
          </p>

          <div className="payment-security-card">
            <div className="security-icon">
              🛡️
            </div>
            <div className="security-content">
              <h3 className="security-title">Bank-grade Security</h3>
              <p className="security-text">256-bit SSL • PCI DSS Compliant</p>
              <p className="security-subtext">Protected by industry-leading encryption</p>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="payment-trust-section">
            <p className="trust-text">Trusted by 50,000+ customers</p>
            <div className="trust-badges">
              <div className="trust-badge trust-badge-green">
                <span className="badge-icon">✓</span>
              </div>
              <div className="trust-badge trust-badge-blue">
                <span className="badge-icon">✓</span>
              </div>
              <div className="trust-badge trust-badge-orange">
                <span className="badge-icon">✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - White Section */}
      <div className="payment-right-section">
        <div className="payment-form-container">
          <div className="payment-form-header">
            <h2 className="payment-title">Payment Details</h2>
            <p className="payment-form-subtitle">
              Please provide your payment information below
            </p>
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
              <p className="payment-options-hint">Options: EasyPaisa • JazzCash • Bank Transfer • Other</p>
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
                  type="text"
                  name="paymentDate"
                  placeholder="YYYY-MM-DD (e.g. 2025-12-24)"
                  value={formData.paymentDate}
                  onChange={handleChange}
                  className="payment-input payment-input-with-icon"
                  required
                />
              </div>
            </div>

            <button type="submit" className="payment-submit-button">
              SUBMIT
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmation;