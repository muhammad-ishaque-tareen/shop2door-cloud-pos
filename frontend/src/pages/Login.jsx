
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    shopCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    formData.email,
          password: formData.password,
          shopCode: formData.shopCode.trim() || undefined,
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Role-based redirection
        const role = data.user.role;
        if (role === 'system_admin') {
          navigate('/systemadmindashboard');
   } else if (role === 'shop_admin') {
  // Check free trial status before redirecting
  try {
    const trialRes = await fetch('http://localhost:5000/api/freetrail/check-status', {
      headers: { Authorization: `Bearer ${data.token}` }
    });
    const trialData = await trialRes.json();

    if (trialData.status === 'trial_expired' || trialData.isDisabled) {
      navigate('/trial-expired', { state: { trialData } });
    } else {
      navigate('/shopadmindashboard');
    }
  } catch {
    navigate('/shopadmindashboard'); // fallback if trial check fails
  }
} else if (role === 'store_manager' || role === 'cashier') {
          navigate('/posterminal');
        } 
        
        
        else {
          setError('Unauthorized role. Please contact your administrator.');
        }
        
      }
        
      
      else 
      {
        setError(data.message || 'Login Failed!');
      }
    } catch (err) {
      console.error('Error: ', err);
      setError('Network Error. Please Try Again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupClick = () => navigate('/signup');

  return (
    <div className="login-container">
      {/*  Left Panel  */}
      <div className="login-left-section">
        <div className="login-left-content">
          <h1 className="login-logo">Shop2Door LOGO</h1>

          <h2 className="login-main-heading">
            Start your<br />
            journey with us
          </h2>

          <p className="login-description">
            Discover the best way to manage your<br />
            projects and collaborate with your team.
          </p>

          <div className="login-testimonial-card">
            <div className="login-quote-icon">❝</div>
            <p className="login-testimonial-text">
              This platform transformed how our team collaborates. Absolutely game-changing!
            </p>
            <div className="login-testimonial-author">
              <div className="login-author-info">
                <span className="login-author-name">Mr. IT &amp; Altaf Mehmood</span>
                <span className="login-author-title">A Team to Transform ideas into Solutions.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-dots-pattern"></div>
      </div>

      {/*  Right Panel  */}
      <div className="login-right-section">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2 className="login-title">LOGIN</h2>
            <p className="login-form-subtitle">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message" style={{
                color: '#e74c3c',
                backgroundColor: '#fadbd8',
                padding: '10px',
                borderRadius: '5px',
                marginBottom: '15px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {/* Email */}
            <div className="login-form-group">
              <label className="login-label">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="login-input"
                required
              />
            </div>

            {/* Password */}
            <div className="login-form-group">
              <label className="login-label">Password</label>
              <div className="login-password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="login-input"
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/*  Shop Code (staff only)  */}
            <div className="login-form-group">
              <label className="login-label">
                Shop Code
                <span className="login-label-hint"> — leave blank if you are an Admin</span>
              </label>
              <input
                type="text"
                name="shopCode"
                placeholder="Enter Your Shop's Secret Code."
                value={formData.shopCode}
                onChange={handleChange}
                className="login-input login-input--code"
                autoComplete="off"
                autoCapitalize="characters"
              />
            </div>

            <div className="login-forgot-password">
              <a href="forgot-password" className="login-forgot-link">Forgot password?</a>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              <span>{loading ? 'LOGGING IN...' : 'LOGIN'}</span>
            </button>
          </form>

          <div className="login-bottom-signup">
            <span className="bottom-signup-text">Don't have an account?</span>
            <button className="bottom-signup-button" onClick={handleSignupClick}>
              SIGNUP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;