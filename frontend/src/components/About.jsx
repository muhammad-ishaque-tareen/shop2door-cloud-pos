import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './componentsStyles/About.css';
import altafImage from '../assets/images/team/altaf.jpg';
import ishaqueImage from '../assets/images/team/ishaque.jpg';

const About = () => {
  const navigate = useNavigate();

  const teamMembers = [
    {
      name: "Altaf Mehmood",
      role: "Group Leader & Developer",
      email: "altaf.deve@gmail.com",
      rollNo: "080131",
      image: altafImage
    },
    {
      name: "Muhammad Ishaque",
      role: "Developer",
      email: "afnanhafeeztareen@gmail.com",
      rollNo: "080142",
      image: ishaqueImage
    }
  ];

  const features = [
    {
      icon: "⚡",
      title: "Fast & Efficient",
      description: "Lightning-fast checkout process that reduces wait times and improves customer satisfaction"
    },
    {
      icon: "☁️",
      title: "Cloud-Based",
      description: "Access your data anytime, anywhere with secure cloud storage and real-time synchronization"
    },
    {
      icon: "📊",
      title: "Smart Analytics",
      description: "Comprehensive reports and insights to help you make informed business decisions"
    },
    {
      icon: "🔒",
      title: "Secure & Reliable",
      description: "Enterprise-grade security to protect your business data and customer information"
    }
  ];

  return (
    <div className="about-container">
      <Navbar />

      {/* Hero Section */}
      <section className="about-hero-section">
        <div className="about-hero-content">
          <h1 className="about-hero-title">About Shop2Door</h1>
          <p className="about-hero-subtitle">
            Revolutionizing retail management with intelligent cloud-based solutions
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="about-content-wrapper">
          <div className="mission-card">
            <div className="icon-circle">🎯</div>
            <h2 className="about-section-title">Our Mission</h2>
            <p className="about-section-text">
              To provide customers with a convenient shopping experience through faster service 
              and accurate billing, while enabling shopkeepers to efficiently manage sales, billing, 
              and inventory through an automated Point of Sale (POS) system.
            </p>
          </div>

          <div className="mission-card">
            <div className="icon-circle">👁️</div>
            <h2 className="about-section-title">Our Vision</h2>
            <p className="about-section-text">
              To transform small to medium-sized retail businesses by eliminating manual errors, 
              speeding up transactions, and providing real-time insights that drive growth and 
              customer satisfaction.
            </p>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="problem-section">
        <div className="about-content-wrapper">
          <h2 className="about-main-title">The Challenge We Solve</h2>
          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon">❌</div>
              <h3 className="problem-title">The Problem</h3>
              <ul className="problem-list">
                <li>Manual billing leads to errors</li>
                <li>Poor inventory tracking</li>
                <li>Delayed receipt generation</li>
                <li>Difficulty tracking sales history</li>
                <li>Stock mismanagement</li>
              </ul>
            </div>

            <div className="solution-card">
              <div className="solution-icon">✓</div>
              <h3 className="solution-title">Our Solution</h3>
              <ul className="solution-list">
                <li>Automated billing system</li>
                <li>Real-time inventory updates</li>
                <li>Instant digital receipts</li>
                <li>Comprehensive sales reports</li>
                <li>Accurate stock management</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="about-features-section">
        <div className="about-content-wrapper">
          <h2 className="about-main-title">Why Choose Shop2Door?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-text">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <div className="about-content-wrapper">
          <h2 className="about-main-title">Meet Our Team</h2>
          <p className="team-subtitle">
            Final Year Project - BS (IT) Session: 2022-2026<br />
            Department of Information Technology, Akhuwat College Kasur<br />
            Affiliated with University of the Punjab, Lahore
          </p>
          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <div key={index} className="team-card">
                <div className="team-avatar">
                      <img src={member.image} alt={member.name} className="team-avatar-img" />
                </div>
                <h3 className="team-name">{member.name}</h3>
                <p className="team-role">{member.role}</p>
                <p className="team-rollno">Roll No: {member.rollNo}</p>
                <p className="team-email">{member.email}</p>
              </div>
            ))}
          </div>
          <div className="supervisor-info">
            <p className="supervisor-text">
              <strong>Project Supervisor:</strong> Mr. Shafiq Ur Rehman
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta-section">
        <div className="about-cta-content">
          <h2 className="about-cta-title">Ready to Transform Your Business?</h2>
          <p className="about-cta-text">
            Join hundreds of shops already using Shop2Door to streamline their operations
          </p>
          <button className="about-cta-button" onClick={() => navigate('/pricing')}>
            Get Started Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <p className="about-footer-text">
          © 2026 Shop2Door. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default About;