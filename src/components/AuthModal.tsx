import React, { useState } from 'react';
import { X, GraduationCap, Mail, User, ShieldCheck, HelpCircle, KeyRound, ArrowLeft } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  isSupabaseActive: boolean;
  onSendOtp: (email: string) => Promise<boolean>;
  onVerifyOtp: (email: string, code: string, name?: string) => Promise<UserProfile>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onSuccess,
  isSupabaseActive,
  onSendOtp,
  onVerifyOtp,
}) => {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please input a valid student email address.');
      return;
    }
    if (!email.toLowerCase().endsWith('@tulane.edu') && !email.toLowerCase().endsWith('.edu')) {
      setErrorMsg('Please use a valid university email (e.g. @tulane.edu).');
      return;
    }
    if (isSignUp && !name.trim()) {
      setErrorMsg('Please provide your name.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      await onSendOtp(email);
      setStep('code');
      if (isSupabaseActive) {
        setInfoMsg(`A 6-digit verification code has been sent to ${email}. (Use the code rather than clicking the link!)`);
      } else {
        setInfoMsg(`Sandbox Mode: Verification code generated! Enter any 6-digit code (e.g. 123456) to proceed.`);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while sending the code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length < 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const user = await onVerifyOtp(email, code, isSignUp ? name.trim() : undefined);
      onSuccess(user);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Invalid or expired code. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestBypass = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const randomId = Math.floor(Math.random() * 900) + 100;
      const guestEmail = `student_${randomId}@tulane.edu`;
      const guestName = `Green Wave #${randomId}`;
      // Direct bypass
      const user = await onVerifyOtp(guestEmail, '000000', guestName);
      onSuccess(user);
    } catch (err: any) {
      setErrorMsg('Failed to process guest bypass.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full relative overflow-hidden flex flex-col">
        {/* Decorative Green Top bar */}
        <div className="h-2.5 bg-emerald-800" />

        {/* Modal Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100/80 hover:bg-slate-100 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 md:p-8 flex flex-col gap-5">
          {/* Header */}
          <div className="text-center flex flex-col items-center gap-1.5 pt-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="font-sans font-bold text-xl text-slate-800 tracking-tight mt-2">
              Tulane Student Portal
            </h3>
            <p className="text-xs text-slate-500 font-sans max-w-xs leading-relaxed">
              Sign in to contribute live study metrics, write reviews, and sync your favorite spots.
            </p>
          </div>

          {/* Database Connection Status Block */}
          <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl text-[10px] text-slate-500 font-sans flex items-start gap-2">
            {isSupabaseActive ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-700 block">Connected: Reviews and favorites are saving online.</span>
                  Logged-in student features are synchronizing in real time.
                </div>
              </>
            ) : (
              <>
                <HelpCircle className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-700 block">Demo mode: Your data saves on this browser only.</span>
                  All interactive features are unlocked for local evaluation.
                </div>
              </>
            )}
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-xl font-sans">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl font-sans">
              {infoMsg}
            </div>
          )}

          {step === 'email' ? (
            /* STEP 1: Enter Email and optional Name */
            <form onSubmit={handleSendCode} className="flex flex-col gap-3.5">
              {isSignUp && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Your Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Caroline Creddy"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 font-sans"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  University Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student@tulane.edu"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 font-sans"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-800 border border-emerald-950/20 hover:bg-emerald-900 text-white font-sans text-xs font-semibold py-2.5 rounded-xl transition duration-200 shadow-sm mt-1"
              >
                {loading ? 'Sending request...' : isSignUp ? 'Register & Send Code' : 'Send Verification Code'}
              </button>
            </form>
          ) : (
            /* STEP 2: Verify 6-digit Code */
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-3.5">
              {isSupabaseActive && (
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 leading-relaxed font-sans flex flex-col gap-1.5 shadow-sm">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-sm">⚠️</span>
                    <span>Do NOT click the link in your email!</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Since you are in a preview/development sandbox, the email's "Confirm your email" link will redirect incorrectly.
                  </p>
                  <p className="font-semibold text-[11px] text-emerald-950 bg-amber-100/50 px-2 py-1 rounded-lg border border-amber-200/30">
                    👉 Simply copy the 6-digit numeric code from the email and enter it below.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 123456"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold tracking-widest text-center text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 font-sans"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setErrorMsg('');
                    setInfoMsg('');
                    setCode('');
                  }}
                  className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center"
                  title="Go back to Email"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-grow bg-emerald-800 border border-emerald-950/20 hover:bg-emerald-900 text-white font-sans text-xs font-semibold py-2.5 rounded-xl transition duration-200 shadow-sm"
                >
                  {loading ? 'Verifying code...' : 'Verify & Enter'}
                </button>
              </div>
            </form>
          )}

          {/* Quick guest bypass - extremely helpful for evaluating immediately! */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-mono tracking-widest uppercase">OR QUICK DEMO</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
            onClick={handleGuestBypass}
            disabled={loading}
            className="w-full text-slate-700 border border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <span>Bypass with Random student@tulane.edu</span>
          </button>

          {/* Switch Auth mode link */}
          {step === 'email' && (
            <div className="text-center mt-1">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className="text-[11px] font-sans text-emerald-800 hover:text-emerald-950 underline font-semibold focus:outline-none"
              >
                {isSignUp ? 'Already registered? Log in with email' : 'New student? Register your name first'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
