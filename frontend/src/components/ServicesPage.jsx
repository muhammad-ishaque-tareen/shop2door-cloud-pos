import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './componentsStyles/ServicesPage.css';

const ServicesPage = () => {
  const navigate = useNavigate();

  const coreModules = [
    {
      icon: "🔐",
      title: "User Authentication Module",
      description: "Secure login system with role-based access control for administrators, managers, and staff"
    },
    {
      icon: "🏪",
      title: "Store Management Module",
      description: "Complete store profile management including business details, operating hours, and settings"
    },
    {
      icon: "🏢",
      title: "Multi-Store Management",
      description: "Manage multiple store locations from a single dashboard with centralized control"
    },
    {
      icon: "📦",
      title: "Product/Inventory Management",
      description: "Real-time inventory tracking with automatic stock updates, low stock alerts, and batch management"
    },
    {
      icon: "🤝",
      title: "Supplier Management",
      description: "Maintain supplier records, track orders, and manage vendor relationships efficiently"
    },
    {
      icon: "💰",
      title: "Sales and Billing Module",
      description: "Fast checkout with barcode scanning, multiple payment methods, and instant receipt generation"
    },
    {
      icon: "📊",
      title: "Reporting and Analytics",
      description: "Comprehensive sales reports, profit analysis, and business insights to drive decision-making"
    },
    {
      icon: "↩️",
      title: "Returns Module",
      description: "Streamlined product return processing with automatic inventory adjustments"
    },
    {
      icon: "📴",
      title: "Offline Mode",
      description: "Continue operations during internet outages with automatic sync when connection is restored"
    },
    {
      icon: "💾",
      title: "Backup & Restore Module",
      description: "Automated data backup and easy restoration to protect your business information"
    }
  ];

  const optionalModules = [
    {
      icon: "🌐",
      title: "Customer Web Interface",
      description: "Allow customers to browse products and check availability online before visiting your store"
    },
    {
      icon: "📱",
      title: "Customer Mobile App",
      description: "Mobile application for customers to view products, check prices, and track their purchase history"
    },
    {
      icon: "💳",
      title: "Payment Processing",
      description: "Integrated payment gateway supporting credit cards, digital wallets, and online payments"
    },
    {
      icon: "🔔",
      title: "Notification Module (SMS/Email)",
      description: "Automated notifications for order confirmations, promotions, and important updates"
    },
    {
      icon: "⭐",
      title: "Feedback & Review Module",
      description: "Collect customer feedback and reviews to improve service quality"
    },
    {
      icon: "👥",
      title: "Employee Management",
      description: "Track employee hours, performance, commissions, and manage staff schedules"
    },
    {
      icon: "🤝",
      title: "Trusted Customer & Loan Purchase",
      description: "Manage credit sales and track outstanding payments for trusted customers"
    },
    {
      icon: "🤖",
      title: "AI Chatbot Module",
      description: "Intelligent chatbot to assist customers with queries and product recommendations"
    }
  ];

  const benefits = [
    {
      icon: "✅",
      title: "Reduce Errors",
      description: "Eliminate manual billing mistakes with automated calculations"
    },
    {
      icon: "⚡",
      title: "Speed Up Checkout",
      description: "Process transactions faster with barcode scanning and quick billing"
    },
    {
      icon: "📈",
      title: "Track Everything",
      description: "Monitor sales, inventory, and business performance in real-time"
    },
    {
      icon: "💡",
      title: "Make Smart Decisions",
      description: "Use detailed reports and analytics to optimize your business"
    },
    {
      icon: "😊",
      title: "Improve Customer Experience",
      description: "Provide faster service and accurate receipts to satisfy customers"
    },
    {
      icon: "🌍",
      title: "Access Anywhere",
      description: "Cloud-based system allows you to manage your business from anywhere"
    }
  ];

  return (
    <div className="services-container">
      <Navbar />

      {/* Hero Section */}
      <section className="services-hero-section">
        <div className="services-hero-content">
          <h1 className="services-hero-title">Our Services</h1>
          <p className="services-hero-subtitle">
            Comprehensive POS solutions designed to streamline your retail operations
            and boost business efficiency
          </p>
        </div>
      </section>

      {/* Core Modules Section */}
      <section className="core-modules-section">
        <div className="services-content-wrapper">
          <div className="services-section-header">
            <h2 className="services-main-title">Core Modules</h2>
            <p className="services-main-subtitle">
              Essential features included in every Shop2Door POS system
            </p>
          </div>
          <div className="modules-grid">
            {coreModules.map((module, index) => (
              <div key={index} className="module-card">
                <div className="module-icon">{module.icon}</div>
                <h3 className="module-title">{module.title}</h3>
                <p className="module-description">{module.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Optional Modules Section */}
      <section className="optional-modules-section">
        <div className="services-content-wrapper">
          <div className="services-section-header">
            <h2 className="services-main-title">Optional Modules</h2>
            <p className="services-main-subtitle">
              Additional features to enhance your POS system based on your business needs
            </p>
          </div>
          <div className="modules-grid">
            {optionalModules.map((module, index) => (
              <div key={index} className="module-card optional">
                <div className="module-icon">{module.icon}</div>
                <h3 className="module-title">{module.title}</h3>
                <p className="module-description">{module.description}</p>
                <span className="optional-badge">Optional</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="services-content-wrapper">
          <div className="services-section-header">
            <h2 className="services-main-title">Key Benefits</h2>
            <p className="services-main-subtitle">
              Why businesses choose Shop2Door POS system
            </p>
          </div>
          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <div key={index} className="benefit-card">
                <div className="benefit-icon">{benefit.icon}</div>
                <h3 className="benefit-title">{benefit.title}</h3>
                <p className="benefit-description">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="tech-stack-section">
        <div className="services-content-wrapper">
          <div className="services-section-header">
            <h2 className="services-main-title">Our Technology Stack</h2>
            <p className="services-main-subtitle">
              Built with modern, reliable, and scalable technologies
            </p>
          </div>
          <div className="tech-stack-grid">
            <div className="tech-card">
              <h3 className="tech-title">Frontend</h3>
              <p className="tech-item">⚛️ React - Modern UI Library</p>
              <p className="tech-item">🎨 Responsive Design</p>
              <p className="tech-item">⚡ Fast & Interactive</p>
            </div>
            <div className="tech-card">
              <h3 className="tech-title">Backend</h3>
              <p className="tech-item">🟢 Node.js - Server Runtime</p>
              <p className="tech-item">🚀 Express.js - Web Framework</p>
              <p className="tech-item">🔒 Secure API Design</p>
            </div>
            <div className="tech-card">
              <h3 className="tech-title">Database</h3>
              <p className="tech-item">🐘 PostgreSQL - Reliable Database</p>
              <p className="tech-item">☁️ NeonDB - Cloud Hosting</p>
              <p className="tech-item">💾 Automatic Backups</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="services-cta-section">
        <div className="services-cta-content">
          <h2 className="services-cta-title">Ready to Get Started?</h2>
          <p className="services-cta-text">
            Transform your retail business with Shop2Door's powerful POS system
          </p>
          <button className="services-cta-button" onClick={() => navigate('/pricing')}>
            View Pricing Plans
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="services-footer">
        <p className="services-footer-text">
          © 2026 Shop2Door. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default ServicesPage;