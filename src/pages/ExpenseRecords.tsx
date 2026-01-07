import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { fetchExpenses, fetchRecurringExpenses, makePayment, fetchCarryForward, setSelectedMonth } from '@/store/slices/expenseSlice';
import { fetchVendors } from '@/store/slices/vendorSlice';
import { fetchCategories } from '@/store/slices/categorySlice';
import { fetchProjects } from '@/store/slices/projectSlice';
import { Plus, X, IndianRupee, Loader2, Receipt, Calendar, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const ExpenseRecords = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { expenses, recurringExpenses, isLoading: expensesLoading, selectedMonth, total_remaining_amount } = useAppSelector((state) => state.expense);
  const { vendors } = useAppSelector((state) => state.vendor);
  const { categories } = useAppSelector((state) => state.category);
  const { projects } = useAppSelector((state) => state.project);

  const [activeTab, setActiveTab] = useState<'expenses' | 'recurring'>('expenses');

  useEffect(() => {
    dispatch(fetchExpenses());
    dispatch(fetchRecurringExpenses());
    dispatch(fetchVendors());
    dispatch(fetchCategories());
    dispatch(fetchProjects());
  }, [dispatch]);

  const getVendorName = (id: number | string) => {
    if (typeof id === 'string') return id;
    const vendor = vendors.find(v => v.id === id);
    return vendor ? vendor.name : 'Unknown Vendor';
  };

  const getCategoryName = (id: number) => categories.find(c => c.id === id)?.name || 'Unknown Category';

  const getProjectName = (id?: number) => {
    if (!id) return '-';
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

  const handleRowClick = (expenseId: number) => {
    navigate(`/expenses/${expenseId}`);
  };

  const filteredExpenses = expenses
    .filter(exp => {
      const date = exp.created_at || exp.updated_at || '';
      return date.startsWith(selectedMonth);
    })
    .sort((a, b) => b.id - a.id);

  const totalPaid = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount_paid), 0);

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Expense Records</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage and track all expense transactions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/expenses/add')}
            className="btn-primary w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="text-sm sm:text-base font-medium text-muted-foreground mb-1">Total Paid This Month</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">₹{totalPaid.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-success/10 rounded-lg">
            <IndianRupee className="w-6 h-6 text-success" />
          </div>
        </div>

        <div className="stat-card flex items-center justify-between">
          <div>
            <p className="text-sm sm:text-base font-medium text-muted-foreground mb-1">Carry Forward Amount</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">₹{total_remaining_amount.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => dispatch(setSelectedMonth(e.target.value))}
          className="input-field w-full sm:w-auto"
        />

        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'expenses'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'recurring'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Recurring
          </button>
        </div>
      </div>

      {activeTab === 'expenses' ? (
        <div className="card-elevated overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Vendor</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Category</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Project</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Requested</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Paid</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Remaining</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Created By</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {expensesLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No expense records found
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      onClick={() => handleRowClick(expense.id)}
                      className="table-row-hover border-b border-border last:border-0 cursor-pointer"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-foreground">{getVendorName(expense.vendor)}</td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">{getCategoryName(expense.category)}</td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">{getProjectName(expense.project)}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-foreground">₹{parseFloat(expense.amount_requested).toLocaleString()}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-foreground">₹{parseFloat(expense.amount_paid).toLocaleString()}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-foreground">₹{parseFloat(expense.remaining_amount).toLocaleString()}</td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">{expense.created_by?.username || '-'}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${expense.status === 'PAID'
                          ? 'bg-success/10 text-success'
                          : (expense.status === 'PARTIAL' || expense.status === 'PARTIAL_PAID' || expense.status === 'PARTIALLY_PAID')
                            ? 'bg-warning/10 text-warning'
                            : 'bg-destructive/10 text-destructive'
                          }`}>
                          {expense.status === 'PARTIAL_PAID' || expense.status === 'PARTIALLY_PAID' ? 'PARTIAL' : expense.status === 'UNPAID' ? 'PENDING' : expense.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card-elevated overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Vendor</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Category</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Frequency</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Start Date</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {expensesLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : recurringExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No recurring expenses found
                    </td>
                  </tr>
                ) : (
                  recurringExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      onClick={() => navigate(`/recurring-expenses/${expense.id}`)}
                      className="table-row-hover border-b border-border last:border-0 cursor-pointer"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-foreground">{getVendorName(expense.vendor.id)}</td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">{getCategoryName(expense.category)}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-foreground">₹{parseFloat(expense.amount).toLocaleString()}</td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md">
                          {expense.frequency}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">{expense.start_date}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${expense.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {expense.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {activeTab === 'expenses' ? (
          expensesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filteredExpenses.map((expense) => (
            <div key={expense.id} onClick={() => handleRowClick(expense.id)} className="card-elevated p-4 cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-foreground">{getVendorName(expense.vendor)}</p>
                  <p className="text-sm text-muted-foreground">{getCategoryName(expense.category)}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${expense.status === 'PAID' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                  {expense.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Requested</p>
                  <p className="font-semibold text-foreground">₹{parseFloat(expense.amount_requested).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Paid</p>
                  <p className="font-semibold text-foreground">₹{parseFloat(expense.amount_paid).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          expensesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : recurringExpenses.map((expense) => (
            <div
              key={expense.id}
              onClick={() => navigate(`/recurring-expenses/${expense.id}`)}
              className="card-elevated p-4 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-foreground">{getVendorName(expense.vendor.id)}</p>
                  <p className="text-sm text-muted-foreground">{getCategoryName(expense.category)}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${expense.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                  {expense.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground text-lg">₹{parseFloat(expense.amount).toLocaleString()}</p>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                  {expense.frequency}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Starts: {expense.start_date}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExpenseRecords;
