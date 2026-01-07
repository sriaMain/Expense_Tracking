import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { fetchRecurringExpenseById, makePayment } from '@/store/slices/expenseSlice';
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
    AlertCircle,
    User,
    MapPin,
    Phone,
    Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const RecurringExpenseDetails = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { recurringExpenses, isLoading } = useAppSelector((state) => state.expense);
    const { categories } = useAppSelector((state) => state.category);
    const { projects } = useAppSelector((state) => state.project);

    const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const recurringExpense = recurringExpenses.find(e => e.id === parseInt(id || '0'));

    useEffect(() => {
        if (id) {
            dispatch(fetchRecurringExpenseById(parseInt(id)));
            dispatch(fetchCategories());
            dispatch(fetchProjects());
        }
    }, [dispatch, id]);

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

    const handleMakePayment = async (expenseId: number) => {
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            toast.error('Please enter a valid payment amount');
            return;
        }

        setIsSubmitting(true);
        try {
            await dispatch(makePayment({
                expense: expenseId,
                amount: parseFloat(paymentAmount),
            })).unwrap();

            toast.success('Payment recorded successfully');
            setPaymentAmount('');
            setSelectedExpenseId(null);
            // Refresh details
            if (id) dispatch(fetchRecurringExpenseById(parseInt(id)));
        } catch (error) {
            toast.error((error as string) || 'Failed to record payment');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading && !recurringExpense) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!recurringExpense) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-foreground">Recurring Expense not found</h2>
                <button onClick={() => navigate('/expenses')} className="btn-ghost mt-4">
                    Back to Expenses
                </button>
            </div>
        );
    }

    const generatedExpenses = recurringExpense.vendor.expenses || [];

    return (
        <div className="animate-fade-in pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/expenses')}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Recurring Expense Details</h1>
                    <p className="text-muted-foreground mt-1">Manage recurring payments and generated expenses</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Summary & Vendor Info */}
                <div className="space-y-6">
                    {/* Recurring Summary Card */}
                    <div className="card-elevated p-6 border-l-4 border-primary">
                        <div className="flex items-center justify-between mb-4">
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${recurringExpense.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                                {recurringExpense.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                                {recurringExpense.frequency}
                            </span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Recurring Amount</p>
                                <p className="text-3xl font-bold text-foreground">₹{parseFloat(recurringExpense.amount).toLocaleString()}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Category</p>
                                    <p className="text-sm font-medium">{getCategoryName(recurringExpense.category)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Project</p>
                                    <p className="text-sm font-medium">{getProjectName(recurringExpense.project)}</p>
                                </div>
                            </div>
                            <div className="pt-2">
                                <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    {recurringExpense.start_date}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vendor Info Card */}
                    <div className="card-elevated p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            Vendor Information
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-bold text-foreground">{recurringExpense.vendor.name}</p>
                                <p className="text-xs text-muted-foreground">ID: {recurringExpense.vendor.id}</p>
                            </div>
                            {recurringExpense.vendor.contact_number && (
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Phone className="w-4 h-4" />
                                    {recurringExpense.vendor.contact_number}
                                </div>
                            )}
                            {recurringExpense.vendor.address && (
                                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                    <MapPin className="w-4 h-4 mt-0.5" />
                                    {recurringExpense.vendor.address}
                                </div>
                            )}
                            {recurringExpense.vendor.created_by && (
                                <div className="flex items-center gap-3 text-sm text-muted-foreground pt-2 border-t border-border">
                                    <User className="w-4 h-4" />
                                    Created by {recurringExpense.vendor.created_by.username}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Generated Expenses */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <Receipt className="w-6 h-6 text-primary" />
                            Generated Expenses
                        </h2>
                        <span className="text-sm text-muted-foreground">{generatedExpenses.length} total</span>
                    </div>

                    {generatedExpenses.length === 0 ? (
                        <div className="card-elevated p-12 text-center bg-muted/20 border-dashed">
                            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <h3 className="text-lg font-medium text-foreground">No expenses generated yet</h3>
                            <p className="text-muted-foreground mt-1">Expenses will appear here as they are created based on the frequency.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {generatedExpenses.map((expense) => (
                                <div key={expense.id} className="card-elevated overflow-hidden">
                                    <div className="p-5">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${expense.status === 'PAID' ? 'bg-success/10 text-success' :
                                                        expense.status === 'PENDING' ? 'bg-warning/10 text-warning' :
                                                            'bg-primary/10 text-primary'
                                                    }`}>
                                                    <Receipt className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">Expense #{expense.id}</p>
                                                    <p className="text-xs text-muted-foreground">{formatDateIST(expense.created_at)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${expense.status === 'PAID' ? 'bg-success/10 text-success' :
                                                        expense.status === 'PENDING' ? 'bg-warning/10 text-warning' :
                                                            'bg-primary/10 text-primary'
                                                    }`}>
                                                    {expense.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-4 border-y border-border">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Requested Amount</p>
                                                <p className="text-lg font-bold text-foreground">₹{parseFloat(expense.amount_requested).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Paid Amount</p>
                                                <p className="text-lg font-bold text-success">₹{parseFloat(expense.amount_paid).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                                                <p className="text-lg font-bold text-warning">₹{parseFloat(expense.remaining_amount.toString()).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {expense.reason && (
                                            <div className="mt-4 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                                                <p className="font-medium text-foreground mb-1">Reason:</p>
                                                {expense.reason}
                                            </div>
                                        )}

                                        {/* Payment History & Action */}
                                        <div className="mt-6 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                    <TrendingUp className="w-4 h-4 text-primary" />
                                                    Payment History
                                                </h4>
                                                {expense.status !== 'PAID' && selectedExpenseId !== expense.id && (
                                                    <button
                                                        onClick={() => setSelectedExpenseId(expense.id)}
                                                        className="btn-primary text-xs py-1.5 px-3 h-auto"
                                                    >
                                                        Make Payment
                                                    </button>
                                                )}
                                            </div>

                                            {selectedExpenseId === expense.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-4"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-medium text-foreground">Recording Payment for #{expense.id}</p>
                                                        <button
                                                            onClick={() => setSelectedExpenseId(null)}
                                                            className="text-muted-foreground hover:text-foreground"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <div className="relative flex-1">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                                            <input
                                                                type="number"
                                                                placeholder="Enter amount"
                                                                value={paymentAmount}
                                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                                className="input-field pl-8 h-10 text-sm"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => handleMakePayment(expense.id)}
                                                            disabled={isSubmitting}
                                                            className="btn-primary h-10 px-6 text-sm"
                                                        >
                                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {expense.payments && expense.payments.length > 0 ? (
                                                <div className="space-y-2">
                                                    {expense.payments.map((payment: any) => (
                                                        <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                                                            <div className="flex items-center gap-3">
                                                                <CheckCircle2 className="w-4 h-4 text-success" />
                                                                <div>
                                                                    <p className="font-medium text-foreground">₹{parseFloat(payment.amount).toLocaleString()}</p>
                                                                    <p className="text-[10px] text-muted-foreground">{formatDateIST(payment.paid_at)}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] text-muted-foreground">Paid by</p>
                                                                <p className="text-xs font-medium text-foreground">{payment.created_by.username}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted-foreground italic">No payments recorded yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecurringExpenseDetails;
