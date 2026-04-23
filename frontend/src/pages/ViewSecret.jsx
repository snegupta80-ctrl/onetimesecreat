import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { decrypt } from '../utils/crypto';

const ViewSecret = () => {
  const [secret, setSecret] = useState('');
  const [fileData, setFileData] = useState(null);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewed, setViewed] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [burning, setBurning] = useState(false);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const secretId = pathParts[pathParts.length - 1];
    fetchSecret(secretId);
  }, []);

  const fetchSecret = async (secretId, pwd = '') => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/secrets/${secretId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: pwd ? JSON.stringify({ password: pwd }) : JSON.stringify({})
      });
      const data = await response.json();

      if (data.success) {
        if (data.data.type === 'file' && data.data.fileData) {
          setFileData(data.data.fileData);
          setLocation(data.data.location);
          setViewed(true);
        } else if (data.data.encryptedData) {
          const decryptedSecret = decrypt(data.data.encryptedData);
          setSecret(decryptedSecret);
          setLocation(data.data.location);
          setViewed(true);
        }
      } else if (data.requiresPassword) {
        setRequiresPassword(true);
        setError('');
      } else {
        setError(data.message || 'Failed to retrieve secret');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');
    const pathParts = window.location.pathname.split('/');
    const secretId = pathParts[pathParts.length - 1];
    fetchSecret(secretId, password);
  };

  const handleDownload = () => {
    const pathParts = window.location.pathname.split('/');
    const secretId = pathParts[pathParts.length - 1];
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/secrets/${secretId}/download`, '_blank');
    setBurning(true);
    setTimeout(() => {
      setSecret('');
      setFileData(null);
    }, 3000);
  };

  useEffect(() => {
    if (viewed && !burning) {
      setBurning(true);
      setTimeout(() => {
        setSecret('');
        setFileData(null);
      }, 5000);
    }
  }, [viewed]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <span className="text-5xl text-purple-400 animate-float">🔒</span>
            </div>
            <div className="text-white text-xl flex items-center justify-center gap-3">
              <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Decrypting secret...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <span className="text-5xl text-purple-400">🔐</span>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Password Required</h1>
            <p className="text-gray-300 mb-6">This secret is password protected</p>
            
            {passwordError && (
              <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-xl mb-4 backdrop-blur-sm">
                {passwordError}
              </div>
            )}
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-gray-300 transition-all duration-300"
                placeholder="Enter password"
                required
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/30 flex items-center justify-center gap-2"
              >
                <span className="text-xl">🔓</span>
                Unlock Secret
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className={`glass-card rounded-3xl shadow-2xl p-8 w-full max-w-2xl animate-fade-in transition-all duration-1000 ${burning ? 'opacity-0 scale-95' : ''}`}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <span className="text-5xl text-purple-400">🔒</span>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Secret Message</h1>
          <p className="text-gray-300">One-time access - viewed once, then gone forever</p>
        </div>

        {error ? (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-red-500/30 rounded-full p-4 animate-pulse-glow">
                <span className="text-6xl text-red-400">⚠️</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Unable to Retrieve Secret</h2>
            <p className="text-gray-300 text-lg mb-8">{error}</p>
            <Link
              to="/login"
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/30 inline-flex items-center gap-2"
            >
              <span className="text-xl">✨</span>
              Create Your Own Secret
            </Link>
          </div>
        ) : burning ? (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-red-500/30 rounded-full p-4 animate-pulse-glow">
                <span className="text-6xl text-red-400">💣</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Secret Destroyed</h2>
            <p className="text-gray-300 text-lg mb-8">This secret has been permanently deleted from our servers.</p>
            {location && (
              <div className="bg-black/30 rounded-xl p-4 mb-8 backdrop-blur-sm border border-white/10">
                <p className="text-gray-300 flex items-center justify-center gap-2">
                  <span className="text-xl">🌍</span>
                  Accessed from {location.city}, {location.country}
                </p>
              </div>
            )}
            <Link
              to="/login"
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/30 inline-flex items-center gap-2"
            >
              <span className="text-xl">✨</span>
              Create Your Own Secret
              <span className="text-xl">→</span>
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-500/30 rounded-full p-4 animate-pulse-glow">
                <span className="text-6xl text-green-400">✓</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold gradient-text mb-4">Secret Revealed</h2>
            
            {fileData ? (
              <div className="mb-8">
                <div className="bg-black/30 rounded-2xl p-8 mb-6 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <span className="text-4xl">📎</span>
                    <p className="text-white text-xl font-semibold">{fileData.originalName}</p>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">Size: {(fileData.size / 1024).toFixed(1)} KB</p>
                  <button
                    onClick={handleDownload}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-green-500/30 inline-flex items-center gap-2"
                  >
                    <span className="text-xl">📥</span>
                    Download File
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-black/30 rounded-2xl p-8 mb-8 backdrop-blur-sm border border-white/10">
                <p className="text-white text-xl whitespace-pre-wrap break-words leading-relaxed">
                  {secret}
                </p>
              </div>
            )}

            {location && (
              <div className="bg-black/30 rounded-xl p-4 mb-8 backdrop-blur-sm border border-white/10">
                <p className="text-gray-300 flex items-center justify-center gap-2">
                  <span className="text-xl">🌍</span>
                  Accessed from {location.city}, {location.country}
                </p>
              </div>
            )}

            <p className="text-gray-300 mb-8">
              This secret will be permanently deleted from our servers after this viewing.
            </p>

            <Link
              to="/login"
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/30 inline-flex items-center gap-2"
            >
              <span className="text-xl">✨</span>
              Create Your Own Secret
              <span className="text-xl">→</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewSecret;
