import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { registerUser } from '../../slices/authSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((s) => s.auth);

  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState('register'); // 'register' | 'otp'
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  const onRegister = async (data) => {
    const result = await dispatch(registerUser(data));
    if (registerUser.fulfilled.match(result)) {
      setUserId(result.payload.userId);
      setStep('otp');
      toast.success('OTP sent to your email!');
    } else {
      toast.error(result.payload || 'Registration failed');
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const verifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter the complete 6-digit OTP'); return; }
    setVerifying(true);
    try {
      const res = await api.post('/auth/verify-otp', { userId, otp: code });
      const { accessToken, refreshToken, user } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      toast.success(`Welcome to rams craftcorner, ${user.name}! 🎉`);
      navigate('/');
      window.location.reload(); // reload to sync redux auth state
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setVerifying(false);
    }
  };

  const resendOTP = async () => {
    try {
      await api.post('/auth/resend-otp', { userId });
      toast.success('OTP resent!');
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-4xl">🎁</span>
            <span className="font-display text-2xl font-bold gradient-text">rams craftcorner</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {step === 'register' ? 'Create your account' : 'Verify your email'}
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {step === 'register' ? 'Join thousands of happy customers' : `Enter the OTP sent to your email`}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-card p-8">
          <AnimatePresence mode="wait">
            {step === 'register' ? (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSubmit(onRegister)}
                className="space-y-4"
              >
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
                      className={`input-field pl-10 ${errors.name ? 'border-red-300' : ''}`}
                      placeholder="Your full name"
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })}
                      className={`input-field pl-10 ${errors.email ? 'border-red-300' : ''}`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone (optional)</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      {...register('phone')}
                      className="input-field pl-10"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Minimum 8 characters' },
                        pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Must contain uppercase, lowercase and number' },
                      })}
                      className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-300' : ''}`}
                      placeholder="Min 8 chars with uppercase and number"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                </div>

                <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-3.5 text-base mt-2">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : 'Create Account'}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center text-6xl mb-2">📧</div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  We've sent a 6-digit code to your email. It expires in 10 minutes.
                </p>

                {/* OTP inputs */}
                <div className="flex justify-center gap-3">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
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
                  onClick={verifyOTP}
                  disabled={verifying || otp.join('').length !== 6}
                  className="btn-primary w-full justify-center py-3.5"
                >
                  {verifying ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : 'Verify Email'}
                </button>

                <div className="text-center">
                  <button onClick={resendOTP} className="text-sm text-gray-500 hover:text-primary-500 transition-colors">
                    Didn't receive it? <span className="text-primary-500 font-medium">Resend OTP</span>
                  </button>
                </div>
                <div className="text-center">
                  <button onClick={() => setStep('register')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                    ← Back to registration
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step === 'register' && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-500 font-semibold hover:text-primary-600">Sign in →</Link>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
