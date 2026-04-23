import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const TeamDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    fetchTeamData();
  }, [id]);

  const fetchTeamData = async () => {
    try {
      const [teamRes, analyticsRes, logsRes] = await Promise.all([
        api.getTeamById(id),
        api.getAnalytics(id),
        api.getActivityLogs(20, id)
      ]);

      if (teamRes.success) {
        setTeam(teamRes.data);
      } else {
        setError(teamRes.message || 'Failed to fetch team');
      }

      if (analyticsRes.success) {
        setAnalytics(analyticsRes.data);
      }

      if (logsRes.success) {
        setActivityLogs(logsRes.data);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      const response = await api.inviteMember(id, inviteEmail);
      if (response.success) {
        setInviteEmail('');
        setShowInvite(false);
        fetchTeamData();
      } else {
        setError(response.message || 'Failed to invite member');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await api.removeMember(id, memberId);
      if (response.success) {
        fetchTeamData();
      } else {
        setError(response.message || 'Failed to remove member');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white text-xl flex items-center gap-3">
          <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading team data...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link to="/dashboard" className="text-purple-300 hover:text-purple-200 mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold gradient-text mb-2">{team?.name || 'Team Dashboard'}</h1>
          <p className="text-gray-300">Manage your team and shared secrets</p>
        </div>
        <Link
          to="/create"
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/30 flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Create Secret
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm">
          {error}
        </div>
      )}

      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold gradient-text mb-2">{analytics.totalSecrets}</div>
            <div className="text-gray-300 text-sm">Total Secrets</div>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">{analytics.activeSecrets}</div>
            <div className="text-gray-300 text-sm">Active</div>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">{analytics.viewedSecrets}</div>
            <div className="text-gray-300 text-sm">Viewed</div>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-red-400 mb-2">{analytics.expiredSecrets}</div>
            <div className="text-gray-300 text-sm">Expired</div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass-card rounded-3xl shadow-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold gradient-text">Team Members</h2>
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/30 flex items-center gap-2 text-sm"
            >
              <span className="text-lg">➕</span>
              Invite
            </button>
          </div>

          {showInvite && (
            <form onSubmit={handleInvite} className="mb-4">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-gray-300 transition-all duration-300 mb-3"
                placeholder="Enter email to invite"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-xl font-semibold hover:scale-105 transition-all duration-300 text-sm"
                >
                  Send Invite
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 bg-white/10 text-white py-2 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {team?.members.map((member) => (
              <div key={member._id} className="flex items-center justify-between bg-black/30 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500/30 rounded-full p-2">
                    <span className="text-xl">👤</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{member.user?.name || 'Unknown'}</p>
                    <p className="text-gray-400 text-sm">{member.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    member.role === 'admin' ? 'bg-purple-500/30 text-purple-300' : 'bg-blue-500/30 text-blue-300'
                  }`}>
                    {member.role}
                  </span>
                  {member.role !== 'admin' && team.createdBy !== member.user?._id && (
                    <button
                      onClick={() => handleRemoveMember(member.user._id)}
                      className="text-red-400 hover:text-red-300 transition-colors text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-3xl shadow-2xl p-6">
          <h2 className="text-2xl font-bold gradient-text mb-6">Recent Activity</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activityLogs.map((log) => (
              <div key={log._id} className="bg-black/30 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {log.action === 'created' ? '✨' : log.action === 'viewed' ? '👁️' : log.action === 'expired' ? '⏰' : '🗑️'}
                  </span>
                  <span className="text-white font-semibold capitalize">{log.action}</span>
                </div>
                <p className="text-gray-400 text-sm">
                  {log.userId?.name || 'Unknown'} - {new Date(log.createdAt).toLocaleString()}
                </p>
                {log.metadata && (
                  <p className="text-gray-500 text-xs mt-1">
                    {log.metadata.action === 'member_invited' && `Invited: ${log.metadata.invitedUser}`}
                    {log.metadata.action === 'member_removed' && `Member removed`}
                    {log.metadata.action === 'role_updated' && `Role updated to ${log.metadata.newRole}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDashboard;
