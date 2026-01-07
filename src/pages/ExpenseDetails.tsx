import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { fetchExpenseById, makePayment } from '@/store/slices/expenseSlice';
import { fetchVendors } from '@/store/slices/vendorSlice';
import { fetchCategories } from '@/store/slices/categorySlice';
import { fetchProjects } from '@/store/slices/projectSlice';
import {
    ArrowLeft,
    Calendar,
    IndianRupee,
    Loader2,
    Receipt,
    TrendingUp,
    Clock,
    CheckCircle2,
    User,
    Building2,
    Tag,
    Briefcase,
    History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const ExpenseDetails = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { expenses, isLoading } = useAppSelector((state) => state.expense);
    const { vendors } = useAppSelector((state) => state.vendor);
    const { categories } = useAppSelector((state) => state.category);
    const { projects } = useAppSelector((state) => state.project);

    const [paymentAmount, setPaymentAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    const expense = expenses.find(e => e.id === parseInt(id || '0'));

    useEffect(() => {
        if (id) {
            dispatch(fetchExpenseById(parseInt(id)));
            dispatch(fetchVendors());
            dispatch(fetchCategories());
            dispatch(fetchProjects());
        }
    }, [dispatch, id]);

    const getVendorName = (id: number | string) => {
        if (typeof id === 'string') return id;
        return vendors.find(v => v.id === id)?.name || 'Unknown Vendor';
    };
    const getCategoryName = (id: number) => categories.find(c => c.id === id)?.name || 'Unknown Category';
    const getProjectName = (id?: number) => {
        if (!id) return 'No Project';
        return projects.find(p => p.id === id)?.name || 'Unknown Project';
    };

    const formatDateIST = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const handleMakePayment = async () => {
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            toast.error('Please enter a valid payment amount');
            return;
        }

        setIsSubmitting(true);
        try {
            await dispatch(makePayment({
                expense: parseInt(id || '0'),
                amount: parseFloat(paymentAmount),
            })).unwrap();

            toast.success('Payment recorded successfully');
            setPaymentAmount('');
            setShowPaymentForm(false);
            // Refresh details
            if (id) dispatch(fetchExpenseById(parseInt(id)));
        } catch (error) {
            toast.error((error as string) || 'Failed to record payment');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading && !expense) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!expense) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-foreground">Expense not found</h2>
                <button onClick={() => navigate('/expenses')} className="btn-ghost mt-4">
                    Back to Expenses
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Expense Details</h1>
                    <p className="text-muted-foreground mt-1">View details and manage payments for this expense</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Summary & Status */}
                <div className="space-y-6">
                    <div className="card-elevated p-6 border-l-4 border-primary">
                        <div className="flex items-center justify-between mb-6">
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${expense.status === 'PAID' ? 'bg-success/10 text-success' :
                                    (expense.status === 'PARTIAL' || expense.status === 'PARTIAL_PAID' || expense.status === 'PARTIALLY_PAID') ? 'bg-warning/10 text-warning' :
                                        'bg-destructive/10 text-destructive'
                                }`}>
                                {expense.status === 'PARTIAL_PAID' || expense.status === 'PARTIALLY_PAID' ? 'PARTIAL' : expense.status === 'UNPAID' ? 'PENDING' : expense.status}
                            </span>
                            <p className="text-xs text-muted-foreground">ID: #{expense.id}</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Requested Amount</p>
                                <p className="text-3xl font-bold text-foreground">₹{parseFloat(expense.amount_requested).toLocaleString()}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Paid Amount</p>
                                    <p className="text-lg font-bold text-success">₹{parseFloat(expense.amount_paid).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                                    <p className="text-lg font-bold text-warning">₹{parseFloat(expense.remaining_amount).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Vendor:</span>
                                    <span className="font-medium text-foreground">{getVendorName(expense.vendor)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Tag className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Category:</span>
                                    <span className="font-medium text-foreground">{getCategoryName(expense.category)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Project:</span>
                                    <span className="font-medium text-foreground">{getProjectName(expense.project)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Date:</span>
                                    <span className="font-medium text-foreground">{formatDateIST(expense.created_at)}</span>
                                </div>
                                {expense.created_by && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Created by:</span>
                                        <span className="font-medium text-foreground">{expense.created_by.username}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {expense.reason && (
                        <div className="card-elevated p-6">
                            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                Reason / Description
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {expense.reason}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Column: Payments & Actions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Payment Action Card */}
                    {expense.status !== 'PAID' && (
                        <div className="card-elevated p-6 bg-primary/5 border border-primary/10">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">Record Payment</h3>
                                    <p className="text-sm text-muted-foreground">Add a new payment for this expense</p>
                                </div>
                                {!showPaymentForm && (
                                    <button
                                        onClick={() => setShowPaymentForm(true)}
                                        className="btn-primary"
                                    >
                                        Add Payment
                                    </button>
                                )}
                            </div>

                            <AnimatePresence>
                                {showPaymentForm && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4"
                                    >
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                            <input
                                                type="number"
                                                placeholder="Enter payment amount"
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                className="input-field pl-8 h-12"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleMakePayment}
                                                disabled={isSubmitting}
                                                className="btn-primary flex-1 h-12"
                                            >
                                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm Payment'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowPaymentForm(false);
                                                    setPaymentAmount('');
                                                }}
                                                className="btn-ghost flex-1 h-12"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Payment History Card */}
                    <div className="card-elevated p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <History className="w-5 h-5 text-primary" />
                                Payment History
                            </h3>
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                                {expense.payments?.length || 0} Payments
                            </span>
                        </div>

                        {!expense.payments || expense.payments.length === 0 ? (
                            <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
                                <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                <p className="text-muted-foreground">No payments recorded for this expense yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {expense.payments.map((payment: any) => (
                                    <div key={payment.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                                                <CheckCircle2 className="w-5 h-5 text-success" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground text-lg">₹{parseFloat(payment.amount).toLocaleString()}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDateIST(payment.paid_at)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Recorded by</p>
                                            <p className="text-sm font-medium text-foreground">{payment.created_by.username}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpenseDetails;
