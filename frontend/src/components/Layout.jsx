import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500' : 'bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100'}`}>
      <nav className={`glass-card border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className={`bg-purple-500/30 rounded-full p-2 ${darkMode ? '' : 'bg-purple-500/50'}`}>
                <span className="text-2xl">🔐</span>
              </div>
              <Link to="/dashboard" className={`text-2xl font-bold gradient-text flex items-center gap-2 ${darkMode ? '' : 'text-gray-800'}`}>
                <span className="text-2xl">✨</span>
                SecretShare
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <div className={`hidden md:flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Welcome,</span>
                <span className="font-semibold">{user?.name}</span>
              </div>
              <button
                onClick={toggleTheme}
                className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${darkMode ? 'text-white hover:text-yellow-300' : 'text-gray-800 hover:text-purple-600'}`}
              >
                <span className="text-xl">{darkMode ? '🌙' : '☀️'}</span>
                <span className="hidden md:inline">{darkMode ? 'Dark' : 'Light'}</span>
              </button>
              <Link
                to="/create-team"
                className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${darkMode ? 'text-white hover:text-green-300' : 'text-gray-800 hover:text-green-600'}`}
              >
                <span className="text-xl">👥</span>
                <span className="hidden md:inline">Teams</span>
              </Link>
              <Link
                to="/dashboard"
                className={`${darkMode ? 'text-white hover:text-pink-300' : 'text-gray-800 hover:text-purple-600'} px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2`}
              >
                Dashboard
              </Link>
              <Link
                to="/create"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/30 flex items-center gap-2"
              >
                <span className="text-xl">+</span>
                Create Secret
              </Link>
              <button
                onClick={handleLogout}
                className={`${darkMode ? 'text-white hover:text-red-300' : 'text-gray-800 hover:text-red-600'} px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2`}
              >
                <span className="text-xl">🚪</span>
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
