'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';

type Step = 'credentials' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError('Invalid email or password.');
        return;
      }
      setStep('otp');
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        setError('Incorrect or expired code.');
        return;
      }
      router.replace('/');
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError(null);
    await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Cradlen Admin</h1>
          <p className="mt-1 text-sm text-slate-500">
            {step === 'credentials'
              ? 'Sign in to the platform console'
              : `Enter the code sent to ${email}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 'credentials' ? (
          <form onSubmit={submitCredentials} className="space-y-4">
            <Input
              type="email"
              placeholder="admin@cradlen.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" loading={busy} className="w-full">
              Continue
            </Button>
          </form>
        ) : (
          <form onSubmit={submitOtp} className="space-y-4">
            <Input
              inputMode="numeric"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
            />
            <Button type="submit" loading={busy} className="w-full">
              Verify & sign in
            </Button>
            <button
              type="button"
              onClick={resend}
              className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
            >
              Resend code
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}
