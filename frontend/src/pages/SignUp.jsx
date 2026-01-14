import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import '../styles/Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async(e)=>
  {
    e.preventDefault();
    setError('');
    if(formData.password !== formData.confirmPassword)
    {
      setError('Passwords do not Match!');
      return;
    }
    setLoading(true);

    try {

        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type':'application/json',
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password
          })
        });

        const data = await response.json();
        if(response.ok){
          alert('Registration Successful! ');
          navigate('/login');
        }
        else
        {
          setError(data.error || 'Registration Failed.');
        }
    }
    catch(error)
    {
      console.error('Error: ', error);
      setError('Network error. Please try again');
    }
    finally{
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <div className="signup-container">
      <div className="signup-left-section">
        <div className="signup-left-content">
          <h1 className="signup-logo">
            Shop2Door LOGO
          </h1>
          <h2 className="signup-main-heading">
            Start your<br />
            journey with us
          </h2>
          <p className="signup-description">
            Discover the best way to manage your<br />
            projects and collaborate with your team.
          </p>
          <div className="signup-testimonial-card">
            <div className="testimonial-quote-icon">❝</div>
            <p className="testimonial-text">
              This platform transformed how our team collaborates. Absolutely game-changing!
            </p>
            <div className="testimonial-author">
              <div className="author-info">
                <span className="author-name">Mr. IT & Altaf Mehmood</span>
                <span className="author-title">Shop2Door Dev Team</span>
              </div>
            </div>
          </div>
        </div>
        <div className="signup-dots-pattern"></div>
      </div>
      <div className="signup-right-section">

        <div className="signup-form-container">
          <div className="signup-form-header">
            <h2 className="signup-title">SIGNUP</h2>
            <p className="signup-form-subtitle">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="signup-form">
            {error && (
              <div
                className="error-message"
                 style={{ color: "red", marginBottom: "10px" }}
              >
                {error}
              </div>
              )}

          <div className="signup-form-group">
           <label className="signup-label">Full Name</label>
            <input
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              className="signup-input"
              required
           />
          </div>
            <div className="signup-form-group">
              <label className="signup-label">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="signup-input"
                required
              />
            </div>

            <div className="signup-form-group">
              <label className="signup-label">Phone</label>
              <input
                type="tel"
                name="phone"
                placeholder="Enter your phone"
                value={formData.phone}
                onChange={handleChange}
                className="signup-input"
                required
              />
            </div>

            <div className="signup-form-group">
              <label className="signup-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="signup-input"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="signup-form-group">
              <label className="signup-label">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="signup-input"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="signup-forgot-password">
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>

           <button type="submit" className="signup-submit-button" disabled={loading}>
              <span>{loading ? 'SIGNING UP...' : 'SIGNUP'}</span>
              <span className="button-arrow">→</span>
          </button>
         </form>
          <div className="signup-bottom-login">
            <span className="bottom-login-text">Already have an account?</span>
            <button className="bottom-login-button" onClick={handleLoginClick}>
              LOGIN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;