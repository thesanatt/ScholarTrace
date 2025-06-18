import React, { useState } from 'react';
import axios from 'axios';
import LogViewer from './components/LogViewer';

type LogEntry = {
  timestamp: string;
  filename: string;
  content: string;
};

// Determine API base URL
const API_BASE_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://scholartrace.onrender.com'; // <- your backend render URL

export default function App() {
  const [email, setEmail] = useState(localStorage.getItem('lastEmail') || '');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      const res = await axios.post<{ token: string; username: string }>(
        `${API_BASE_URL}/api/auth/login`,
        { username, password }
      );
      localStorage.setItem('authToken', res.data.token);
      localStorage.setItem('authUser', res.data.username);
      setToken(res.data.token);
      setError('');
    } catch {
      setError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setLogs([]);
    setUsername('');
    setPassword('');
  };

  const fetchLogs = async () => {
    if (!email) return;
    setLoading(true);
    setLogs([]);
    localStorage.setItem('lastEmail', email);

    try {
      const response = await axios.get<LogEntry[]>(
        `${API_BASE_URL}/api/logs/${encodeURIComponent(email)}`
      );
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
      alert('Failed to fetch logs. Please check the email and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportLogs = () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ScholarTrace Log Export</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .log { border: 1px solid #ccc; padding: 10px; margin-bottom: 20px; border-radius: 6px; }
          pre { background: #f4f4f4; padding: 10px; border-radius: 6px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>Logs for ${email}</h1>
        ${logs.map(log => `
          <div class="log">
            <b>Timestamp:</b> ${new Date(log.timestamp).toLocaleString()}<br/>
            <b>Filename:</b> ${log.filename}<br/>
            <pre>${log.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scholartrace_${email}_logs.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.content.toLowerCase().includes(filter.toLowerCase()) ||
      log.filename.toLowerCase().includes(filter.toLowerCase())
  );

  const buttonStyle = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    backgroundColor: '#4a90e2',
    color: 'white',
    fontWeight: 'bold',
    transition: '0.2s',
  };

  const inputStyle = {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    marginBottom: '10px',
  };

  if (!token) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>🔐 Professor Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ ...inputStyle, marginTop: 10 }}
        />
        <button onClick={handleLogin} style={{ ...buttonStyle, marginTop: 10 }}>
          Login
        </button>
        {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📘 ScholarTrace Log Viewer</h1>
        <button onClick={handleLogout} style={{ ...buttonStyle, backgroundColor: '#e74c3c' }}>
          Logout
        </button>
      </div>

      <div style={styles.inputRow}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter student email"
          style={{ ...inputStyle, width: '300px' }}
        />
        <button onClick={fetchLogs} style={{ ...buttonStyle, marginLeft: 10 }}>
          Fetch Logs
        </button>
        {logs.length > 0 && (
          <button onClick={handleExportLogs} style={{ ...buttonStyle, marginLeft: 10, backgroundColor: '#27ae60' }}>
            Export Logs
          </button>
        )}
      </div>

      {logs.length > 0 && (
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by keyword or filename"
          style={{ ...inputStyle, width: '300px', marginTop: 20 }}
        />
      )}

      {loading && <p style={{ marginTop: 20 }}>🔄 Loading logs...</p>}
      {!loading && logs.length === 0 && (
        <p style={{ marginTop: 20 }}>⚠️ No logs found for this email.</p>
      )}

      <div style={{ marginTop: 20 }}>
        <LogViewer logs={filteredLogs} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: 40,
    fontFamily: 'Segoe UI, sans-serif',
    backgroundColor: '#f4f6f9',
    minHeight: '100vh',
    color: '#333',
  },
  title: {
    marginBottom: 10,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
};
