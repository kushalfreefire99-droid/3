import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../config/api';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Completing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Authentication cancelled or failed');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      try {
        // Exchange code for token
        const response = await axios.post(getApiUrl('/api/auth/discord/callback'), {
          code
        });

        if (response.data.success) {
          // Store token and user info
          localStorage.setItem('auth_token', response.data.token);
          localStorage.setItem('discord_user', JSON.stringify(response.data.user));

          setStatus('success');
          setMessage(
            response.data.isMember
              ? 'Successfully authenticated! Welcome to CodersLab!'
              : 'Successfully authenticated! You\'ve been added to our Discord server!'
          );

          // Redirect to home after 2 seconds
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else {
          throw new Error(response.data.error || 'Authentication failed');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage(err.response?.data?.error || 'Authentication failed. Please try again.');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl border-2 border-gray-700 shadow-2xl max-w-md w-full p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-[#5865F2] to-[#7289DA] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#5865F2]/30">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">Authenticating...</h2>
              <p className="text-gray-400">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">Success!</h2>
              <p className="text-gray-400">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">Authentication Failed</h2>
              <p className="text-gray-400">{message}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
