import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PendingApproval.css";

const PendingApproval = () => {
  const navigate = useNavigate();

  return (
    <div className="pending-container">

      {/* Left Panel */}
      <div className="pending-left-section">
        <div className="pending-dots-pattern" />
        <div className="pending-left-content">

          <div className="pending-logo">🏪 Shop2Door</div>

          <h1 className="pending-main-heading">
            You're Almost<br />There!
          </h1>

          <p className="pending-description">
            Your shop request has been received. Our team personally
            reviews every application to ensure the best experience
            for all merchants on Shop2Door.
          </p>

          <div className="pending-timeline">
            <div className="pending-timeline-item done">
              <div className="pending-timeline-dot">✓</div>
              <div className="pending-timeline-text">
                <span className="pending-timeline-label">Account Created</span>
                <span className="pending-timeline-sub">Completed</span>
              </div>
            </div>
            <div className="pending-timeline-line" />
            <div className="pending-timeline-item done">
              <div className="pending-timeline-dot">✓</div>
              <div className="pending-timeline-text">
                <span className="pending-timeline-label">Shop Details Submitted</span>
                <span className="pending-timeline-sub">Completed</span>
              </div>
            </div>
            <div className="pending-timeline-line" />
            <div className="pending-timeline-item done">
              <div className="pending-timeline-dot">✓</div>
              <div className="pending-timeline-text">
                <span className="pending-timeline-label">Payment Confirmed</span>
                <span className="pending-timeline-sub">Completed</span>
              </div>
            </div>
            <div className="pending-timeline-line" />
            <div className="pending-timeline-item active">
              <div className="pending-timeline-dot pending">⏳</div>
              <div className="pending-timeline-text">
                <span className="pending-timeline-label">Admin Review</span>
                <span className="pending-timeline-sub">In progress — up to 24 hrs</span>
              </div>
            </div>
            <div className="pending-timeline-line pending-line-faded" />
            <div className="pending-timeline-item inactive">
              <div className="pending-timeline-dot empty">5</div>
              <div className="pending-timeline-text">
                <span className="pending-timeline-label">Shop Goes Live</span>
                <span className="pending-timeline-sub">Pending approval</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Right Panel */}
      <div className="pending-right-section">
        <div className="pending-card">

          <div className="pending-icon-wrapper">
            <div className="pending-icon">📬</div>
          </div>

          <h2 className="pending-card-title">Request Submitted Successfully</h2>

          <p className="pending-card-subtitle">
            Thank you for choosing <strong>Shop2Door</strong>. We've received your shop
            setup request and payment confirmation.
          </p>

          <div className="pending-info-box">
            <div className="pending-info-row">
              <span className="pending-info-icon">🕐</span>
              <div>
                <p className="pending-info-title">Review Timeline</p>
                <p className="pending-info-text">Your request will be reviewed within <strong>24–48 hours</strong>.</p>
              </div>
            </div>
            <div className="pending-divider" />
            <div className="pending-info-row">
              <span className="pending-info-icon">📧</span>
              <div>
                <p className="pending-info-title">Email Notification</p>
                <p className="pending-info-text">You'll receive your shop credentials and login details via email once approved.</p>
              </div>
            </div>
            <div className="pending-divider" />
            <div className="pending-info-row">
              <span className="pending-info-icon">📞</span>
              <div>
                <p className="pending-info-title">Need Help?</p>
                <p className="pending-info-text">Contact our support team at <strong>support@shop2door.com</strong></p>
              </div>
            </div>
          </div>

          <button
            className="pending-home-btn"
            onClick={() => navigate("/")}
          >
            ← Back to Home
          </button>

          <p className="pending-footer-note">
            Please do not submit another request. Duplicate requests may delay your approval.
          </p>

        </div>
      </div>

    </div>
  );
};

export default PendingApproval;