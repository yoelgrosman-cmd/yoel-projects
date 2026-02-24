'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push('/admin/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'שגיאה בכניסה');
      }
    } catch {
      setError('שגיאת שרת, נסה שוב');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-black mx-auto mb-4">
            BB
          </div>
          <h1 className="text-3xl font-black text-white">ממשק ניהול</h1>
          <p className="text-blue-300 mt-2">BILU BIKES Admin</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-2xl p-8 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">שם משתמש</label>
            <input
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
              placeholder="admin"
              style={{ direction: 'ltr' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">סיסמה</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
              placeholder="••••••••"
              style={{ direction: 'ltr' }}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-70"
          >
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            ברירת מחדל: admin / bilubikes2024
          </p>
        </form>
      </div>
    </div>
  );
}
