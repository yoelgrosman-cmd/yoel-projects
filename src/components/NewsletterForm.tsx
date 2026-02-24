'use client';
import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setEmail('');
    setTimeout(() => setSent(false), 4000);
  };

  if (sent) {
    return (
      <div className="text-green-300 font-medium py-3 text-lg">
        ✓ נרשמת בהצלחה! תודה.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="כתובת האימייל שלך"
        className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:border-orange-400"
      />
      <button
        type="submit"
        className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors whitespace-nowrap"
      >
        הרשמה
      </button>
    </form>
  );
}
