import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { ArrowLeft, Loader2, IndianRupee } from 'lucide-react';

import axiosInstance from '@/lib/axiosInstance';

const VerifyOtp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    const [otp, setOtp] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const [resendCount, setResendCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axiosInstance.post('verify-otp/', { email, otp });
            const resetToken = response.data?.reset_token;

            if (!resetToken) {
                toast.error('Failed to get reset token. Please try again.');
                return;
            }

            toast.success('OTP verified successfully');
            navigate('/reset-password', { state: { email, resetToken } });
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Invalid or expired OTP.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCount >= 3) {
            toast.error('Maximum resend limit reached. Please try again later.');
            return;
        }

        setIsLoading(true);
        try {
            await axiosInstance.post('forgot-password/', { email });
            setTimeLeft(30);
            setCanResend(false);
            setResendCount(prev => prev + 1);
            toast.success('OTP resent successfully');
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to resend OTP.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-elevated p-8"
                >
                    <div className="mb-8">
                        <Button
                            variant="ghost"
                            className="pl-0 hover:bg-transparent hover:text-primary mb-4"
                            onClick={() => navigate('/forgot-password')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>

                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <IndianRupee className="w-6 h-6 text-primary" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-semibold text-center mb-2">
                            Verify OTP
                        </h1>
                        <p className="text-center text-muted-foreground text-sm">
                            Enter the code sent to {email}
                        </p>
                    </div>

                    <form onSubmit={handleOtpSubmit} className="space-y-6">
                        <div className="space-y-4 flex flex-col items-center">
                            <Label>Enter Verification Code</Label>
                            <InputOTP
                                maxLength={6}
                                value={otp}
                                onChange={(value) => setOtp(value)}
                                disabled={isLoading}
                            >
                                <InputOTPGroup className="flex gap-4">
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>

                            <div className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Time remaining: <span className="font-medium text-foreground">{timeLeft}s</span>
                                </p>
                                {canResend && (
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="text-primary p-0 h-auto"
                                        onClick={handleResendOtp}
                                        disabled={isLoading || resendCount >= 3}
                                    >
                                        Resend OTP {resendCount > 0 && `(${3 - resendCount} left)`}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            Verify OTP
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default VerifyOtp;
