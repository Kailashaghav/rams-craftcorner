import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep]         = useState('email'); // 'email' | 'otp' | 'reset' | 'done'
  const [email, setEmail]       = useState('');
  const [userId, setUserId]     = useState(null);
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState(null);
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass]         = useState(false);
  const [loading, setLoading]           = useState(false);

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.userId) {
        setUserId(res.data.userId);
        setStep('otp');
        toast.success('OTP sent to your email!');
        if (res.data.devOtp) {
          toast(`Dev mode OTP: ${res.data.devOtp}`, { icon: '🔑', duration: 8000 });
        }
      } else {
        // No account found — still show generic message for security
        toast.success('If an account exists, an OTP has been sent.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handlers ──────────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`fp-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`fp-otp-${index - 1}`)?.focus();
    }
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 6) return toast.error('Enter the complete 6-digit OTP');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-reset-otp', { userId, otp: code });
      setResetToken(res.data.resetToken);
      setStep('reset');
      toast.success('OTP verified! Set your new password.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const res = await api.post('/auth/resend-reset-otp', { userId });
      toast.success('OTP resent!');
      setOtp(['', '', '', '', '', '']);
      if (res.data.devOtp) {
        toast(`Dev mode OTP: ${res.data.devOtp}`, { icon: '🔑', duration: 8000 });
      }
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  // ── Step 3: Reset Password ──────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return toast.error('Password must include uppercase, lowercase and a number');
    }
    if (password !== confirmPassword) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: resetToken, password });
      setStep('done');
      toast.success('Password reset successfully! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-4xl">🎁</span>
            <span className="font-display text-2xl font-bold gradient-text">Craft Corner</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {step === 'email' && 'Forgot Password?'}
            {step === 'otp'   && 'Verify OTP'}
            {step === 'reset' && 'Set New Password'}
            {step === 'done'  && 'All Done! 🎉'}
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">
            {step === 'email' && "No worries, we'll send you a reset code"}
            {step === 'otp'   && `Enter the 6-digit code sent to ${email}`}
            {step === 'reset' && 'Choose a strong new password'}
            {step === 'done'  && 'Your password has been changed'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-card p-8">
          <AnimatePresence mode="wait">

            {/* ── Step 1: Email ── */}
            {step === 'email' && (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOTP} className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-10"
                      placeholder="you@example.com"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 text-base">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending OTP...
                    </span>
                  ) : 'Send Reset Code'}
                </button>
              </motion.form>
            )}

            {/* ── Step 2: OTP ── */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center text-6xl mb-2">🔐</div>

                <div className="flex justify-center gap-2.5">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`fp-otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-11 h-12 text-center text-xl font-bold rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                    />
                  ))}
                </div>

                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.join('').length !== 6}
                  className="btn-primary w-full justify-center py-3.5"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : 'Verify OTP'}
                </button>

                <div className="text-center">
                  <button onClick={handleResendOTP} className="text-sm text-gray-500 hover:text-primary-500 transition-colors">
                    Didn't receive it? <span className="text-primary-500 font-medium">Resend OTP</span>
                  </button>
                </div>
                <div className="text-center">
                  <button onClick={() => setStep('email')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 justify-center">
                    <ArrowLeft size={13} /> Use a different email
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Reset Password ── */}
            {step === 'reset' && (
              <motion.form
                key="reset"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleResetPassword} className="space-y-5"
              >
                <div className="text-center text-5xl mb-2">
                  <KeyRound className="mx-auto text-primary-500" size={48} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-10 pr-10"
                      placeholder="Min 8 chars, uppercase + number"
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 text-base">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Resetting...
                    </span>
                  ) : 'Reset Password'}
                </button>
              </motion.form>
            )}

            {/* ── Step 4: Done ── */}
            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-5"
              >
                <div className="text-6xl">✅</div>
                <p className="text-gray-600 dark:text-gray-400">
                  Your password has been changed successfully. You can now log in with your new password.
                </p>
                <button onClick={() => navigate('/login')} className="btn-primary w-full justify-center py-3.5">
                  Go to Login
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {step !== 'done' && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
              <Link to="/login" className="text-sm text-gray-500 hover:text-primary-500 transition-colors flex items-center gap-1 justify-center">
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}