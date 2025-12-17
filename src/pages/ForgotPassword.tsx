import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IndianRupee, ArrowLeft, Loader2 } from 'lucide-react';

import axiosInstance from '@/lib/axiosInstance';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        try {
            await axiosInstance.post('forgot-password/', { email });
            toast.success('OTP sent to your email');
            navigate('/verify-otp', { state: { email } });
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to send OTP. Please try again.';
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
                            onClick={() => navigate('/login')}
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
                            Forgot Password?
                        </h1>
                        <p className="text-center text-muted-foreground text-sm">
                            Enter your email to receive a verification code
                        </p>
                    </div>

                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                            <p className="text-sm text-muted-foreground">
                                We'll send you a 6-digit code to verify your identity.
                            </p>
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Send OTP
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPassword;
