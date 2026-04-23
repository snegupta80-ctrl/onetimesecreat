import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

const Dashboard = () => {
  const [secrets, setSecrets] = useState([]);
  const [analytics, setAnalytics] = useState({ total: 0, viewed: 0, expired: 0, active: 0, recentActivity: 0 });
  const [activityLogs, setActivityLogs] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [accessLogs, setAccessLogs] = useState({});
  const [, setTick] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTag]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const tagParam = selectedTag ? `?tag=${selectedTag}` : '';
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/secrets/user${tagParam}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setSecrets(data.data);
        setAnalytics(data.analytics || { total: 0, viewed: 0, expired: 0, active: 0, recentActivity: 0 });
      } else {
        setError(data.message || 'Failed to fetch secrets');
      }

      // Fetch activity logs
      const logsResponse = await api.getActivityLogs(10);
      if (logsResponse.success) {
        setActivityLogs(logsResponse.data);
      }

      // Fetch teams
      const teamsResponse = await api.getTeams();
      if (teamsResponse.success) {
        setTeams(teamsResponse.data);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (id) => {
    const link = `${window.location.origin}/view/${id}`;
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  const shareWhatsApp = (id) => {
    const link = `${window.location.origin}/view/${id}`;
    const text = encodeURIComponent('Check out this secure secret I shared with you!');
    window.open(`https://wa.me/?text=${text}%20${encodeURIComponent(link)}`, '_blank');
  };

  const shareEmail = (id) => {
    const link = `${window.location.origin}/view/${id}`;
    const subject = encodeURIComponent('Secure Secret Shared With You');
    const body = encodeURIComponent(`I've shared a secure secret with you. Access it here: ${link}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const isExpired = (expiresAt) => new Date(expiresAt) < new Date();

  const getTimeRemaining = (expiresAt) => {
    const total = Date.parse(expiresAt) - Date.parse(new Date());
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    
    if (total <= 0) return { expired: true };
    return { days, hours, minutes, seconds, expired: false };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white text-xl flex items-center gap-3">
          <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading your secrets...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Your Secrets</h1>
          <p className="text-gray-300">Manage and share your secure messages</p>
        </div>
        <Link
          to="/create"
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/30 flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Create Secret
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-4xl font-bold gradient-text mb-2">{analytics.total}</div>
          <div className="text-gray-300 text-sm">Total Secrets</div>
        </div>
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-4xl font-bold text-green-400 mb-2">{analytics.active}</div>
          <div className="text-gray-300 text-sm">Active</div>
        </div>
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-4xl font-bold text-blue-400 mb-2">{analytics.viewed}</div>
          <div className="text-gray-300 text-sm">Viewed</div>
        </div>
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-4xl font-bold text-red-400 mb-2">{analytics.expired}</div>
          <div className="text-gray-300 text-sm">Expired</div>
        </div>
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-4xl font-bold text-purple-400 mb-2">{analytics.recentActivity || 0}</div>
          <div className="text-gray-300 text-sm">Activity</div>
        </div>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <Link
          to="/create-team"
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/30 flex items-center gap-2"
        >
          <span className="text-xl">➕</span>
          Create Team
        </Link>
        {teams.length > 0 && (
          <div className="flex gap-3">
            {teams.slice(0, 3).map(team => (
              <Link
                key={team._id}
                to={`/team-dashboard/${team._id}`}
                className="bg-white/10 text-white px-4 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center gap-2"
              >
                <span className="text-xl">👥</span>
                {team.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedTag('')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
            selectedTag === ''
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedTag('Work')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
            selectedTag === 'Work'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
          }`}
        >
          Work
        </button>
        <button
          onClick={() => setSelectedTag('Personal')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
            selectedTag === 'Personal'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
          }`}
        >
          Personal
        </button>
        <button
          onClick={() => setSelectedTag('Urgent')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
            selectedTag === 'Urgent'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
          }`}
        >
          Urgent
        </button>
      </div>
      
      {error && (
        <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm">
          {error}
        </div>
      )}

      {secrets.length === 0 ? (
        <div className="glass-card rounded-3xl shadow-2xl p-12 text-center animate-fade-in">
          <div className="flex justify-center mb-6">
            <span className="text-6xl text-pink-400 animate-float">✨</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">No secrets yet</h2>
          <p className="text-gray-300 mb-8">You haven't created any secrets. Start by creating your first secure message.</p>
          <Link
            to="/create"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/30 inline-flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Create Your First Secret
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {secrets.map((secret) => {
            const timeRemaining = getTimeRemaining(secret.expiresAt);
            const logs = accessLogs[secret._id] || [];
            
            return (
              <div
                key={secret._id}
                className="glass-card rounded-2xl shadow-xl p-6 hover:scale-105 hover:shadow-2xl transition-all duration-300 animate-fade-in border-l-4 border-purple-500"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-xl">
                        {secret.type === 'file' ? '📎' : secret.type === 'password' ? '🔐' : '📝'}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          secret.isViewed
                            ? 'bg-red-500/30 text-red-300 border border-red-400/50'
                            : isExpired(secret.expiresAt)
                            ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-400/50'
                            : 'bg-green-500/30 text-green-300 border border-green-400/50'
                        }`}
                      >
                        {secret.isViewed ? 'Viewed' : isExpired(secret.expiresAt) ? 'Expired' : 'Active'}
                      </span>
                      {secret.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-purple-500/30 text-purple-300 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {!timeRemaining.expired && !secret.isViewed && (
                      <div className="bg-black/30 rounded-lg p-2 mb-3 backdrop-blur-sm border border-white/10">
                        <div className="text-xs text-gray-400 mb-1">Time Remaining</div>
                        <div className="text-sm font-semibold text-white">
                          {timeRemaining.days > 0 && `${timeRemaining.days}d `}
                          {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👁️</span>
                        <span>Views: {secret.viewCount}/{secret.accessLimit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📅</span>
                        <span>Created: {new Date(secret.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⏰</span>
                        <span>Expires: {new Date(secret.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {logs.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="text-xs text-gray-400 mb-1">Last Accessed</div>
                        <div className="text-sm text-white">
                          {new Date(logs[0].accessedAt).toLocaleString()}
                          {logs[0].location && ` • ${logs[0].location.city}, ${logs[0].location.country}`}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => copyLink(secret._id)}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/30 flex items-center justify-center gap-2 text-sm"
                  >
                    <span className="text-lg">📋</span>
                    Copy
                  </button>
                  <button
                    onClick={() => shareWhatsApp(secret._id)}
                    className="flex-1 bg-green-500 text-white py-2 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-green-500/30 flex items-center justify-center gap-2 text-sm"
                  >
                    <span className="text-lg">💬</span>
                    WhatsApp
                  </button>
                  <button
                    onClick={() => shareEmail(secret._id)}
                    className="flex-1 bg-blue-500 text-white py-2 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 text-sm"
                  >
                    <span className="text-lg">📧</span>
                    Email
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activityLogs.length > 0 && (
        <div className="mt-8 glass-card rounded-3xl shadow-2xl p-6">
          <h2 className="text-2xl font-bold gradient-text mb-6">Recent Activity</h2>
          <div className="space-y-3">
            {activityLogs.map((log) => (
              <div key={log._id} className="bg-black/30 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {log.action === 'created' ? '✨' : log.action === 'viewed' ? '👁️' : log.action === 'expired' ? '⏰' : '🗑️'}
                  </span>
                  <span className="text-white font-semibold capitalize">{log.action}</span>
                  {log.teamId && (
                    <span className="px-2 py-1 bg-purple-500/30 text-purple-300 rounded-full text-xs">
                      Team
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm">
                  {log.userId?.name || 'Unknown'} - {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
