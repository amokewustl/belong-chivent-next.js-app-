'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const ADMIN_PASSWORD = 'admin123';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams: any = useSearchParams();

  useEffect(() => {
    // Check if user is already authenticated 
    const authStatus = sessionStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

    // Check URL parameter for password
    const urlPassword = searchParams.get('password');
    
    if (urlPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      // Store authentication in session
      sessionStorage.setItem('adminAuthenticated', 'true');
      
    } else if (urlPassword && urlPassword !== ADMIN_PASSWORD) {
      // Wrong password provided
      setIsAuthenticated(false);
    } else {
      // No password provided
      setIsAuthenticated(false);
    }
    
    setLoading(false);
  }, [searchParams]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuthenticated');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Chivent Admin</h1>
            <h2 className="text-xl font-semibold text-gray-800">Access Denied</h2>
          </div>
          
          <div className="space-y-4 text-gray-600">
            <p>Invalid or missing password in URL</p>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Required URL format:</p>
              <code className="text-sm bg-gray-200 px-2 py-1 rounded">
                /admin?password=yourpassword
              </code>
            </div>
            <p className="text-sm text-gray-500">
              Please contact an admin for the correct access URL.
            </p>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => router.push('/')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
            >
              Return to Main Site
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-red-600">Chivent Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                View Site
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Admin Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}