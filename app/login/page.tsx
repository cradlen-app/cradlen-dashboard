'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Step = 'credentials' | 'otp';

const inputClass = cn(
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-black',
  'placeholder:text-gray-400 outline-none transition-colors',
  'focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20',
);

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="px-6 py-5 sm:px-8">
        <Image
          src="/Logo.png"
          alt="CRADLEN"
          width={150}
          height={30}
          priority
          className="h-auto w-32 sm:w-36"
        />
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-md flex-col items-center gap-5">
          <Image
            src="/Logo-icon.png"
            alt="Cradlen"
            width={100}
            height={100}
            priority
          />

          <h1 className="text-2xl font-semibold text-brand-black">
            {step === 'credentials' ? 'Sign in' : 'Verify your email'}
          </h1>

          {step === 'otp' && (
            <p className="-mt-2 text-center text-sm text-gray-500">
              Enter the code sent to {email}
            </p>
          )}

          {error && (
            <div className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 'credentials' ? (
            <form
              onSubmit={submitCredentials}
              className="flex w-full flex-col gap-5"
            >
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm text-brand-black">
                  Email or User Name
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm text-brand-black">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-600"
                  >
                    {showPassword ? (
                      <Eye className="size-4" />
                    ) : (
                      <EyeOff className="size-4" />
                    )}
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-primary/90 active:scale-[0.99] disabled:opacity-50"
              >
                {busy && <Loader2 className="size-4 animate-spin" />}
                Sign in
              </button>
            </form>
          ) : (
            <form onSubmit={submitOtp} className="flex w-full flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="code" className="text-sm text-brand-black">
                  Verification code
                </label>
                <input
                  id="code"
                  inputMode="numeric"
                  placeholder="6-digit code"
                  className={inputClass}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-primary/90 active:scale-[0.99] disabled:opacity-50"
              >
                {busy && <Loader2 className="size-4 animate-spin" />}
                Verify &amp; sign in
              </button>

              <button
                type="button"
                onClick={resend}
                className="text-center text-sm text-brand-secondary underline underline-offset-2 transition-opacity hover:opacity-80"
              >
                Resend code
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-4 sm:px-8">
        <p className="text-center text-xs text-gray-500">
          © 2026 CRADLEN. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
