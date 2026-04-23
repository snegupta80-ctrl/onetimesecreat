import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const CreateTeam = () => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teamId, setTeamId] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    if (!name.trim()) {
      setError('Please enter a team name');
      setLoading(false);
      return;
    }

    try {
      const response = await api.createTeam(name);
      if (response.success) {
        setSuccess(true);
        setTeamId(response.data._id);
        setName('');
      } else {
        setError(response.message || 'Failed to create team');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goToDashboard = () => {
    navigate(`/team-dashboard/${teamId}`);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">Create Team</h1>
        <p className="text-gray-300">Create a team to share secrets with your colleagues</p>
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
            <h2 className="text-3xl font-bold gradient-text mb-4">Team Created!</h2>
            <p className="text-gray-300 mb-8">
              Your team has been created successfully. You can now invite members and start sharing secrets.
            </p>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={goToDashboard}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/30 flex items-center gap-2"
              >
                <span className="text-xl">📊</span>
                Go to Team Dashboard
              </button>
              <Link
                to="/dashboard"
                className="bg-white/10 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center gap-2"
              >
                <span className="text-xl">🏠</span>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-3xl shadow-2xl p-8 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white text-sm font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">👥</span>
                Team Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-gray-300 transition-all duration-300"
                placeholder="Enter team name (e.g., Engineering Team)"
                required
              />
              <p className="text-sm text-gray-400 mt-2 flex items-center gap-2">
                <span className="text-lg">💡</span>
                Choose a descriptive name for your team
              </p>
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
                    Create Team
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

export default CreateTeam;
