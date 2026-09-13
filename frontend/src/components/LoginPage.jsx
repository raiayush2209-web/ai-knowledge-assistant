import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api.js';

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/query');
    } catch (loginError) {
      setError(loginError.message);
    }
  };

  return (
    <main className="page-container">
      <section className="box">
        <h1>Sign in</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p role="alert">{error}</p>}
          <button type="submit">Sign in</button>
        </form>
      </section>
    </main>
  );
};

export default LoginPage;