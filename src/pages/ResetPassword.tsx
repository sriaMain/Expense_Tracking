import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IndianRupee, CheckCircle2 } from 'lucide-react';

import axiosInstance from '@/lib/axiosInstance';
import { useLocation } from 'react-router-dom';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        setIsLoading(true);
        try {
            await axiosInstance.post('reset-password/', {
                email,
                new_password: password,
                confirm_password: confirmPassword
            });
            setIsSuccess(true);
            toast.success('Password updated successfully');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to reset password. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md card-elevated p-8 text-center space-y-4"
                >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold">Password Reset Complete</h3>
                    <p className="text-muted-foreground">
                        Your password has been successfully updated. Redirecting you to login...
                    </p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-elevated p-8"
                >
                    <div className="mb-8">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <IndianRupee className="w-6 h-6 text-primary" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-semibold text-center mb-2">
                            Reset Password
                        </h1>
                        <p className="text-center text-muted-foreground text-sm">
                            Create a new secure password for your account
                        </p>
                    </div>

                    <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            Reset Password
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default ResetPassword;
