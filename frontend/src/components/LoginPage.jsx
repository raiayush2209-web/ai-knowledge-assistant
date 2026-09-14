import { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaRobot, FaArrowRight } from 'react-icons/fa';
import { login, registerUser } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, isAuthenticated, loading } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  if (!loading && isAuthenticated) {
    return <Navigate to="/query" replace />;
  }
  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setForm({ username: '', email: '', password: '', confirmPassword: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (isRegister && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const data = isRegister
        ? await registerUser({ username: form.username, email: form.email, password: form.password })
        : await login(form.username, form.password);
      setUser(data.user);
      navigate(location.state?.from?.pathname || '/query', { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Unable to complete authentication.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand"><div className="auth-logo"><FaRobot /></div><div><p className="auth-eyebrow">Private knowledge workspace</p><h1>AI Knowledge Assistant</h1></div></div>
        <div className="auth-heading"><p className="auth-kicker">{isRegister ? 'Start exploring' : 'Welcome back'}</p><h2>{isRegister ? 'Create your account' : 'Sign in to your workspace'}</h2><p>{isRegister ? 'Bring your documents into one focused, searchable space.' : 'Your documents and answers are waiting for you.'}</p></div>
        <div className="auth-tabs"><button type="button" className={!isRegister ? 'active' : ''} onClick={() => switchMode('login')}>Sign in</button><button type="button" className={isRegister ? 'active' : ''} onClick={() => switchMode('register')}>Create account</button></div>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>{isRegister ? 'Username' : 'Username or email'}<input name="username" value={form.username} onChange={updateField} placeholder={isRegister ? 'Choose a username' : 'you@example.com'} required /></label>
          {isRegister && <label>Email address<input name="email" type="email" value={form.email} onChange={updateField} placeholder="you@example.com" required /></label>}
          <label>Password<span className="password-input"><input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField} placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'} required /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label="Toggle password visibility">{showPassword ? <FaEyeSlash /> : <FaEye />}</button></span></label>
          {isRegister && <label>Confirm password<span className="password-input"><input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={updateField} placeholder="Repeat your password" required /><button type="button" className="password-toggle" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label="Toggle confirmation password visibility">{showConfirmPassword ? <FaEyeSlash /> : <FaEye />}</button></span></label>}
          {error && <p className="auth-message auth-error" role="alert">{error}</p>}
          <button type="submit" className="auth-submit" disabled={submitting}>{submitting ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'} {!submitting && <FaArrowRight />}</button>
        </form>
        <p className="auth-switch">{isRegister ? 'Already have an account?' : "Don't have an account?"} <button type="button" onClick={() => switchMode(isRegister ? 'login' : 'register')}>{isRegister ? 'Sign in' : 'Create one'}</button></p>
      </section>
    </main>
  );
};

export default LoginPage;