import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { encrypt } from '../utils/crypto';
import QRCode from 'qrcode.react';

const CreateSecret = () => {
  const [secret, setSecret] = useState('');
  const [expiryMinutes, setExpiryMinutes] = useState(60);
  const [password, setPassword] = useState('');
  const [type, setType] = useState('text');
  const [accessLimit, setAccessLimit] = useState(1);
  const [tags, setTags] = useState([]);
  const [file, setFile] = useState(null);
  const [teamId, setTeamId] = useState('');
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await api.getTeams();
      if (response.success) {
        setTeams(response.data);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  const checkPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 0, label: '' };
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.match(/[a-z]/) && pwd.match(/[A-Z]/)) strength++;
    if (pwd.match(/\d/)) strength++;
    if (pwd.match(/[^a-zA-Z\d]/)) strength++;
    
    if (strength <= 1) return { strength, label: 'Weak', color: 'text-red-400' };
    if (strength <= 2) return { strength, label: 'Medium', color: 'text-yellow-400' };
    return { strength, label: 'Strong', color: 'text-green-400' };
  };

  const passwordStrength = checkPasswordStrength(password);

  const handleTagToggle = (tag) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    setFile(selectedFile);
    setType('file');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    if (!secret.trim() && !file) {
      setError('Please enter a secret or upload a file');
      setLoading(false);
      return;
    }

    if (type === 'file' && !file) {
      setError('Please upload a file');
      setLoading(false);
      return;
    }

    try {
      let encryptedData = '';
      if (secret.trim()) {
        encryptedData = encrypt(secret);
      }

      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      const formData = new FormData();
      if (encryptedData) formData.append('encryptedData', encryptedData);
      formData.append('expiresAt', expiresAt.toISOString());
      if (password) formData.append('password', password);
      formData.append('type', type);
      formData.append('accessLimit', accessLimit);
      if (tags.length > 0) {
        tags.forEach(tag => formData.append('tags', tag));
      }
      formData.append('isAnonymous', isAnonymous);
      if (file) formData.append('file', file);
      if (teamId) formData.append('teamId', teamId);

      const endpoint = isAnonymous ? '/api/secrets/anonymous' : '/api/secrets';
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${endpoint}`, {
        method: 'POST',
        headers: isAnonymous ? {} : {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Use backend URL if it's not localhost, otherwise use network URL from env
        const backendUrl = data.data.shareableLink;
        const networkUrl = `${import.meta.env.VITE_BASE_URL || 'http://localhost:5175'}/view/${backendUrl.split('/').pop()}`;
        
        // Use backend URL if it's already a network IP, otherwise use env var
        const finalUrl = backendUrl.includes('localhost') ? networkUrl : backendUrl;
        
        setShareableLink(finalUrl);
        console.log('QR Share URL from backend:', backendUrl);
        console.log('QR Share URL (final):', finalUrl);
        setSecret('');
        setPassword('');
        setFile(null);
        setTags([]);
        setType('text');
      } else {
        setError(data.message || 'Failed to create secret');
      }
    } catch (err) {
      console.error('Error creating secret:', err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent('Check out this secure secret I shared with you!');
    window.open(`https://wa.me/?text=${text}%20${encodeURIComponent(shareableLink)}`, '_blank');
  };

  const shareEmail = () => {
    const subject = encodeURIComponent('Secure Secret Shared With You');
    const body = encodeURIComponent(`I've shared a secure secret with you. Access it here: ${shareableLink}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">Create a Secret</h1>
        <p className="text-gray-300">Share secure messages that self-destruct after viewing</p>
      </div>
      
      {error && (
        <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm">
          {error}
        </div>
      )}

      {success ? (
        <div className="glass-card rounded-3xl shadow-2xl p-8 animate-fade-in">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-500/30 rounded-full p-4 animate-pulse-glow">
                <span className="text-6xl text-green-400">✓</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold gradient-text mb-4">Secret Created!</h2>
            <p className="text-gray-300 mb-8">
              This secret can be viewed {accessLimit} time(s) and will expire in {expiryMinutes} minutes.
            </p>
            
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-2xl animate-float">
                <QRCode
                  value={shareableLink}
                  size={220}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  className="rounded-lg"
                />
              </div>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-gray-300 flex items-center justify-center gap-2 mb-2">
                <span className="text-xl">📱</span>
                <span>Scan QR code to open secret</span>
              </p>
              <p className="text-sm text-gray-400">Works on mobile devices</p>
            </div>
            
            <div className="bg-black/30 rounded-xl p-4 mb-8 backdrop-blur-sm border border-white/10">
              <code className="text-purple-300 break-all text-sm">{shareableLink}</code>
            </div>
            
            <div className="flex gap-4 justify-center flex-wrap mb-6">
              <button
                onClick={copyLink}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/30 flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <span className="text-xl">✓</span>
                    Copied!
                  </>
                ) : (
                  <>
                    <span className="text-xl">📋</span>
                    Copy Link
                  </>
                )}
              </button>
              <button
                onClick={shareWhatsApp}
                className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-green-500/30 flex items-center gap-2"
              >
                <span className="text-xl">💬</span>
                WhatsApp
              </button>
              <button
                onClick={shareEmail}
                className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
              >
                <span className="text-xl">📧</span>
                Email
              </button>
            </div>

            <Link
              to="/dashboard"
              className="bg-white/10 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20 inline-flex items-center gap-2"
            >
              <span className="text-xl">✕</span>
              Close
            </Link>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-3xl shadow-2xl p-8 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-400"
              />
              <label htmlFor="anonymous" className="text-white flex items-center gap-2">
                <span className="text-xl">👤</span>
                Create anonymously (no login required)
              </label>
            </div>

            <div>
              <label className="block text-white text-sm font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">�</span>
                Team (Optional)
              </label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white transition-all duration-300"
              >
                <option value="">Personal (No Team)</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id} className="bg-gray-800">
                    {team.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-400 mt-2 flex items-center gap-2">
                <span className="text-lg">🔒</span>
                Only team members can access team secrets
              </p>
            </div>

            <div>
              <label className="block text-white text-sm font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">�📁</span>
                Secret Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['text', 'password', 'file'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      type === t
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    <span className="text-xl">
                      {t === 'text' ? '📝' : t === 'password' ? '🔐' : '📎'}
                    </span>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {type !== 'file' && (
              <div>
                <label className="block text-white text-sm font-semibold mb-2 flex items-center gap-2">
                  <span className="text-xl">🔒</span>
                  Secret Message
                </label>
                <textarea
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-gray-300 transition-all duration-300 resize-none"
                  rows={6}
                  placeholder="Enter your secret message..."
                  required={type !== 'file'}
                />
                <p className="text-sm text-gray-400 mt-2 flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  Your secret will be encrypted before sending to the server
                </p>
              </div>
            )}

            {type === 'file' && (
              <div>
                <label className="block text-white text-sm font-semibold mb-2 flex items-center gap-2">
                  <span className="text-xl">📎</span>
                  Upload File
                </label>
                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.txt,.doc,.docx"
                  />
                  {file && (
                    <p className="text-green-400 mt-3 flex items-center justify-center gap-2">
                      <span className="text-xl">✓</span>
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              </div>
            )}

            {type === 'password' && (
              <div>
                <label className="block text-white text-sm font-semibold mb-2 flex items-center gap-2">
                  <span className="text-xl">🔑</span>
                  Secret Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-gray-300 transition-all duration-300"
                  placeholder="Enter a password to protect this secret"
                  required={type === 'password'}
                />
                {password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.strength === 1
                            ? 'bg-red-500 w-1/3'
                            : passwordStrength.strength === 2
                            ? 'bg-yellow-500 w-2/3'
                            : 'bg-green-500 w-full'
                        }`}
                      />
                    </div>
                    <span className={`text-sm font-semibold ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-white text-sm font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">🏷️</span>
                Tags
              </label>
              <div className="flex gap-3 flex-wrap">
                {['Work', 'Personal', 'Urgent'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                      tags.includes(tag)
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white text-sm font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">🔢</span>
                Access Limit
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[1, 3, 5].map((limit) => (
                  <button
                    key={limit}
                    type="button"
                    onClick={() => setAccessLimit(limit)}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      accessLimit === limit
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    {limit} view{limit > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white text-sm font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">⏰</span>
                Expiry Time
              </label>
              <select
                value={expiryMinutes}
                onChange={(e) => setExpiryMinutes(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white transition-all duration-300"
              >
                <option value={15} className="bg-gray-800">15 minutes</option>
                <option value={30} className="bg-gray-800">30 minutes</option>
                <option value={60} className="bg-gray-800">1 hour</option>
                <option value={1440} className="bg-gray-800">24 hours</option>
                <option value={4320} className="bg-gray-800">3 days</option>
                <option value={10080} className="bg-gray-800">7 days</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <span className="text-xl">✨</span>
                    Create Secret
                  </>
                )}
              </button>
              <Link
                to="/dashboard"
                className="flex-1 bg-white/10 text-white py-4 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center justify-center gap-2"
              >
                <span className="text-xl">✕</span>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CreateSecret;
