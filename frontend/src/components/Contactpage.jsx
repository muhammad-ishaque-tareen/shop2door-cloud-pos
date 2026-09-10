import React, { useState } from 'react';
import Navbar from './Navbar';
import './componentsStyles/ContactPage.css';

const CONTACT_EMAIL = 'info.shop2door@gmail.com';
const CONTACT_PHONE = '03337114618';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const response = await fetch(
        `https://formsubmit.co/ajax/${CONTACT_EMAIL}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            _subject: formData.subject
              ? `Shop2Door Contact: ${formData.subject}`
              : 'New message from Shop2Door contact form',
            message: formData.message
          })
        }
      );

      if (!response.ok) {
        throw new Error('Request failed');
      }

      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setStatus('error');
    }
  };

  const contactCards = [
    {
      icon: '✉️',
      title: 'Email Us',
      value: CONTACT_EMAIL,
      href: `mailto:${CONTACT_EMAIL}`,
      note: "We'll get back to you within 24 hours"
    },
    {
      icon: '📞',
      title: 'Call Us',
      value: CONTACT_PHONE,
      href: `tel:${CONTACT_PHONE.replace(/\s+/g, '')}`,
      note: 'Available during business hours'
    }
  ];

  return (
    <div className="contact-container">
      <Navbar />

      {/* Hero Section */}
      <section className="contact-hero-section">
        <div className="contact-hero-content">
          <h1 className="contact-hero-title">Get in Touch</h1>
          <p className="contact-hero-subtitle">
            Have a question about Shop2Door? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="contact-main-section">
        <div className="contact-content-wrapper">
          <div className="contact-grid">
            {/* Contact Info */}
            <div className="contact-info-column">
              <h2 className="contact-info-title">Contact Information</h2>
              <p className="contact-info-text">
                Reach out to us directly, or send a message using the form
                and our team will respond as soon as possible.
              </p>

              <div className="contact-cards">
                {contactCards.map((card, index) => (
                  <a
                    key={index}
                    href={card.href}
                    className="contact-info-card"
                  >
                    <div className="contact-info-icon">{card.icon}</div>
                    <div className="contact-info-details">
                      <h3 className="contact-info-card-title">
                        {card.title}
                      </h3>
                      <p className="contact-info-value">{card.value}</p>
                      <p className="contact-info-note">{card.note}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-column">
              <div className="contact-form-card">
                <h2 className="contact-form-title">Send Us a Message</h2>

                {status === 'success' ? (
                  <div className="contact-success-message">
                    <div className="contact-success-icon">✓</div>
                    <h3>Message Sent!</h3>
                    <p>
                      Thanks for reaching out. We'll get back to you soon.
                    </p>
                    <button
                      type="button"
                      className="contact-submit-button"
                      onClick={() => setStatus('idle')}
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="contact-form-row">
                      <div className="contact-form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your name"
                          required
                        />
                      </div>
                      <div className="contact-form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="contact-form-group">
                      <label htmlFor="subject">Subject</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="What is this about?"
                        required
                      />
                    </div>

                    <div className="contact-form-group">
                      <label htmlFor="message">Message</label>
                      <textarea
                        id="message"
                        name="message"
                        rows="6"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us how we can help..."
                        required
                      />
                    </div>

                    {status === 'error' && (
                      <p className="contact-error-message">
                        Something went wrong. Please try again, or email us
                        directly at {CONTACT_EMAIL}.
                      </p>
                    )}

                    <button
                      type="submit"
                      className="contact-submit-button"
                      disabled={status === 'sending'}
                    >
                      {status === 'sending' ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="contact-footer">
        <p className="contact-footer-text">
          © 2026 Shop2Door. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default ContactPage;