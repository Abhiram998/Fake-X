"use client";

import React, { useState } from 'react';

import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

import LoadingSpinner from './loading-spinner';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { useAuth } from '@/context/AuthContext';
import TwitterLogo from './Twitterlogo';
import Link from 'next/link';



interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  initialEmail?: string;
  startAtOtpStep?: boolean;
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login', initialEmail = '', startAtOtpStep = false }: AuthModalProps) {
  const { login, signup, verifyLoginOtp, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [isOtpStep, setIsOtpStep] = useState(startAtOtpStep);
  const [otpValue, setOtpValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: initialEmail,
    password: '',
    username: '',
    displayName: '',
    mobile: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Flag to prevent reset while modal is already open and busy
  const isMounted = React.useRef(false);

  // Sync with external initialEmail/startAtOtpStep ONLY when modal just opens or props change significantly
  React.useEffect(() => {
    if (isOpen) {
      if (!isMounted.current) {
        setMode(initialMode);
        setIsOtpStep(startAtOtpStep);
        setOtpValue('');
        if (initialEmail) {
          setFormData(prev => ({ ...prev, email: initialEmail }));
        }
        isMounted.current = true;
      } else if (startAtOtpStep && !isOtpStep) {
        // Handle background triggers while modal is already open
        setIsOtpStep(true);
        if (initialEmail) {
          setFormData(prev => ({ ...prev, email: initialEmail }));
        }
      }
    } else {
      isMounted.current = false;
    }
  }, [isOpen, initialMode, startAtOtpStep, initialEmail, isOtpStep]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'signup') {
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, and underscores';
      }

      if (!formData.displayName.trim()) {
        newErrors.displayName = 'Display name is required';
      }

      if (!formData.mobile.trim()) {
        newErrors.mobile = 'Mobile number is required';
      } else if (!/^[0-9]{10,15}$/.test(formData.mobile)) {
        newErrors.mobile = 'Mobile number must be 10-15 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isLoading) return;

    try {
      if (mode === 'login') {
        const res: any = await login(formData.email, formData.password);
        console.log("🔓 Login response in modal:", res);

        if (res?.otpRequired) {
          console.log("🔒 OTP required, switching to OTP step.");
          setIsOtpStep(true);
          setErrors({}); // Clear any previous login errors
          return;
        }

        console.log("✅ Direct login successful.");
      } else {
        await signup(formData.email, formData.password, formData.username, formData.displayName, formData.mobile);
        console.log("✅ Registration successful.");
      }
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Auth Error:", error);
      const backendError = error.response?.data?.error || error.response?.data?.message || error.message;
      setErrors({
        general: backendError
          ? `${mode === 'login' ? 'Login' : 'Registration'} failed: ${backendError}`
          : 'Authentication failed. Please check your connection and try again.'
      });
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpValue || isLoading) return;

    try {
      await verifyLoginOtp(formData.email, otpValue);
      onClose();
      resetForm();
    } catch (err: any) {
      // Errors are handled by toast in verifyLoginOtp
    }
  };

  const resetForm = () => {
    setFormData({ email: '', password: '', username: '', displayName: '', mobile: '' });
    setOtpValue('');
    setIsOtpStep(false);
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setErrors({});
    setFormData({ email: '', password: '', username: '', displayName: '', mobile: '' });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-black border-gray-800 text-white">
        <CardHeader className="relative pb-6">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-white hover:bg-gray-900"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <TwitterLogo size="xl" className="text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isOtpStep ? 'Verify your identity' : mode === 'login' ? 'Sign in to X' : 'Create your account'}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isOtpStep ? (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-4">
                  We've sent a 6-digit verification code to
                  <br />
                  <span className="text-white font-medium">{formData.email}</span>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-white">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otpValue}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 6) setOtpValue(val);
                    }}
                    className="text-center text-2xl tracking-[10px] bg-transparent border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 h-16"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-full text-lg"
                  disabled={isLoading || otpValue.length !== 6}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    'Verify and sign in'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-blue-400 hover:text-blue-300"
                  onClick={() => setIsOtpStep(false)}
                  disabled={isLoading}
                >
                  Back to login
                </Button>
              </form>
            </div>
          ) : (
            <>
              {errors.general && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-400 text-sm">
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="text-white">Display Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input
                          id="displayName"
                          type="text"
                          placeholder="Your display name"
                          value={formData.displayName}
                          onChange={(e) => handleInputChange('displayName', e.target.value)}
                          className="pl-10 bg-transparent border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.displayName && (
                        <p className="text-red-400 text-sm">{errors.displayName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-white">Username</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">@</span>
                        <Input
                          id="username"
                          type="text"
                          placeholder="username"
                          value={formData.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          className="pl-8 bg-transparent border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.username && (
                        <p className="text-red-400 text-sm">{errors.username}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile" className="text-white">Mobile Number</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">+</span>
                        <Input
                          id="mobile"
                          type="text"
                          placeholder="10-15 digits"
                          value={formData.mobile}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 15) handleInputChange('mobile', val);
                          }}
                          className="pl-8 bg-transparent border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.mobile && (
                        <p className="text-red-400 text-sm">{errors.mobile}</p>
                      )}
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10 bg-transparent border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-sm">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 pr-10 bg-transparent border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm">{errors.password}</p>
                  )}
                  {mode === 'login' && (
                    <div className="flex justify-end mt-1">
                      <Link
                        href="/forgot-password"
                        className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                        onClick={onClose}
                      >
                        Forgot password?
                      </Link>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-full text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                    </div>
                  ) : (
                    mode === 'login' ? 'Sign in' : 'Create account'
                  )}
                </Button>
              </form>

              <div className="relative">
                <Separator className="bg-gray-700" />
                <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black px-2 text-gray-400 text-sm">
                  OR
                </span>
              </div>

              <div className="text-center">
                <p className="text-gray-400">
                  {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                  <Button
                    variant="link"
                    className="text-blue-400 hover:text-blue-300 font-semibold pl-1"
                    onClick={switchMode}
                    disabled={isLoading}
                  >
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </Button>
                </p>
              </div>

            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}