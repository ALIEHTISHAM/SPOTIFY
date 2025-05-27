import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        // The user object will be set in the AuthContext after successful login
        const user = JSON.parse(localStorage.getItem('user'));
        // Redirect based on role
        if (user?.role === 'artist') {
          navigate('/artist/dashboard');
        } else if (user?.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/browse');
        }
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    }
  };

  return (
    <div className="auth-form">
      <h2>Login</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input
            type="email"
            id="email"
            name="email"
            className="form-control"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            className="form-control"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Login
        </button>
      </form>

      <div className="auth-links">
        <p>
          Don't have an account?{' '}
          <a href="/register">Register</a>
        </p>
        <p>
          Are you an artist?{' '}
          <a href="/artist/register">Register as Artist</a>
        </p>
      </div>
    </div>
  );
};

export default Login; 