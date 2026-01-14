import React from 'react';
import { useNavigate } from "react-router-dom";
import '../styles/Pricing.css';

const Pricing = () => {
    const navigate = useNavigate();
  const plans = [
    {
      id: 1,
      isPopular: false,
      name: 'STARTER',
      description: 'For growing businesses',
      price: '6k',
      features: [
        'Advanced Inventory',
        'Customer Management',
        'Analytics & Reports',
        'Up to 3 Stores',
        'Up to 5 Users'
      ]
    },
    {
      id: 2,
      isPopular: true,
      name: 'PROFESSIONAL',
      description: 'For growing businesses',
      price: '10k',
      features: [
        'Advanced Inventory',
        'Customer Management',
        'Analytics & Reports',
        'Up to 8 Stores',
        'Up to 10 Users'
        
      ]
    },
    {
      id: 3,
      isPopular: false,
      name: 'ENTERPRISE',
      description: 'For growing businesses',
      price: '18k',
      features: [
        'Advanced Inventory',
        'Customer Management',
        'Analytics & Reports',
        'Up to  12 Stores',
        'Up to 16 Users'
      ]
    }
  ];

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

        <div className="pricing-cards">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`pricing-card ${plan.isPopular ? 'popular' : ''}`}
            >
              {plan.isPopular && (
                <div className="popular-badge">MOST POPULAR</div>
              )}
              
              <div className="card-header">
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-description">{plan.description}</p>
              </div>

              <div className="card-price">
                <span className="currency">Rs.</span>
                <span className="amount">{plan.price}</span>
                <span className="period">/mo</span>
              </div>

              <div className="card-divider"></div>

              <ul className="features-list">
                {plan.features.map((feature, index) => (
                  <li key={index} className="feature-item">
                    <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button className="get-started-btn"
              onClick={() => navigate("/signup")}
              >Get Started</button>
            </div>
          ))}
        </div>

        <p className="pricing-footer">All plans include 7-day free trial</p>
      </div>
    </div>
  );
};

export default Pricing;