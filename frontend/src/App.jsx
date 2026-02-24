import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Dashboard from './components/Dashboard';
import PublicSign from './components/PublicSign';
import Login from './components/Login';
import Register from './components/Register';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Global Toast Notifications */}
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} /> 
        
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 py-4 px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">Document Signature App</h1>
          
          {token && (
            <button 
              onClick={handleLogout}
              className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
            >
              Logout
            </button>
          )}
        </header>
        
        {/* Main Content Routing */}
        <main className="flex-1">
          <Routes>
            <Route 
              path="/" 
              element={token ? <Dashboard token={token} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/login" 
              element={token ? <Navigate to="/" /> : <Login setToken={setToken} />} 
            />
            <Route 
              path="/register" 
              element={token ? <Navigate to="/" /> : <Register />} 
            />
            <Route path="/sign/:token" element={<PublicSign />} />
          </Routes>
        </main>
        
      </div>
    </Router>
  );
}

export default App;