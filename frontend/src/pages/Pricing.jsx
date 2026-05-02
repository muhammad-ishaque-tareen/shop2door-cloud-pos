import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import '../styles/Pricing.css';

const BASE = 'http://localhost:5000';

const Pricing = () => {
  const navigate = useNavigate();
  const [plans, setPlans]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res  = await fetch(`${BASE}/api/packages`);
        const data = await res.json();
        // Most used (highest shop_count) first, then descending
        const sorted = [...data].sort(
          (a, b) => parseInt(b.shop_count, 10) - parseInt(a.shop_count, 10)
        );
        setPlans(sorted);
      } catch (err) {
        console.error('Failed to load packages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  // Build feature bullet list from DB fields
 // Build feature bullet list from DB fields
  const buildFeatures = (pkg) => [
    `Up to ${pkg.max_stores} Store${pkg.max_stores !== 1 ? 's' : ''}`,
    `Up to ${pkg.max_users_per_store} User${pkg.max_users_per_store !== 1 ? 's' : ''} per Store`,
    `${Number(pkg.max_products).toLocaleString()} Products`,
    `${pkg.max_storage_mb} MB Storage`,
  ];

  // Format price: show as "Xk" if >= 1000, else plain number
  const formatPrice = (price) => {
    const n = Number(price);
    if (n >= 1000) return `${Math.round(n / 1000)}k`;
    return n.toLocaleString();
  };

  return (
    <div className="pricing-page">
      <div className="decorative-circle circle-left"></div>
      <div className="decorative-circle circle-right"></div>
      <div className="decorative-dot dot-top"></div>
      <div className="decorative-dot dot-bottom"></div>

      <div className="pricing-container">
        <div className="pricing-header">
          <h1 className="pricing-title">Simple Pricing</h1>
          <p className="pricing-subtitle">
            Choose the perfect plan for your business size. No hidden fees.
          </p>
        </div>

        {loading ? (
          <div className="pricing-loading">Loading plans…</div>
        ) : (
          <div className="pricing-cards">
            {plans.map((plan, index) => {
              // Most used package (index 0 after sort) gets the popular badge
              const isPopular = index === 0;
              return (
                <div
                  key={plan.package_id}
                  className={`pricing-card ${isPopular ? 'popular' : ''}`}
                >
                  {isPopular && (
                    <div className="popular-badge">MOST POPULAR</div>
                  )}

                  <div className="card-header">
                    <h3 className="plan-name">{plan.name.toUpperCase()}</h3>
                    <p className="plan-description">For growing businesses</p>
                  </div>

                  <div className="card-price">
                    <span className="currency">Rs.</span>
                    <span className="amount">{formatPrice(plan.price)}</span>
                    <span className="period">/mo</span>
                  </div>

                  <div className="card-divider"></div>

                  <ul className="features-list">
                    <li className="feature-item feature-heading">
                      <span>This Package Supports:</span>
                    </li>
                    {buildFeatures(plan).map((feature, i) => (
                      <li key={i} className="feature-item feature-indented">
                        <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                      onClick={() => navigate("/signup", {
                      state: 
                      {
                          package_id: plan.package_id,
                          package_name: plan.name,
                          price: plan.price
                      }
                    })}
                       >
                      Get Started
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p className="pricing-footer">All plans include 7-day free trial</p>
      </div>
    </div>
  );
};

export default Pricing;