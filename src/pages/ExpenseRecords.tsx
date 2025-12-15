import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { addExpense, addVendor } from '@/store/slices/expenseSlice';
import { Plus, X, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const ExpenseRecords = () => {
  const dispatch = useAppDispatch();
  const { expenses, vendors, selectedMonth } = useAppSelector((state) => state.expense);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showVendorForm, setShowVendorForm] = useState(false);

  // Form states
  const [selectedVendor, setSelectedVendor] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReason, setExpenseReason] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');

  // Filter expenses by month
  const filteredExpenses = expenses.filter(exp => exp.date.startsWith(selectedMonth));
  const totalPaid = filteredExpenses
    .filter(exp => exp.status === 'paid')
    .reduce((sum, exp) => sum + exp.amount, 0);

  const handleAddExpense = () => {
    if (!selectedVendor || !expenseAmount || !expenseReason) {
      toast.error('Please fill in all fields');
      return;
    }

    const vendor = vendors.find(v => v.id === selectedVendor);
    if (!vendor) return;

    dispatch(addExpense({
      vendorId: selectedVendor,
      vendorName: vendor.name,
      amount: parseFloat(expenseAmount),
      reason: expenseReason,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
    }));

    toast.success('Expense added successfully');
    setShowExpenseModal(false);
    resetExpenseForm();
  };

  const handleAddVendor = () => {
    if (!vendorName || !vendorEmail || !vendorPhone) {
      toast.error('Please fill in all vendor details');
      return;
    }

    dispatch(addVendor({
      name: vendorName,
      email: vendorEmail,
      phone: vendorPhone,
    }));

    toast.success('Vendor created successfully');
    setShowVendorForm(false);
    resetVendorForm();
  };

  const resetExpenseForm = () => {
    setSelectedVendor('');
    setExpenseAmount('');
    setExpenseReason('');
  };

  const resetVendorForm = () => {
    setVendorName('');
    setVendorEmail('');
    setVendorPhone('');
  };

  const handleVendorChange = (value: string) => {
    if (value === 'create') {
      setShowVendorForm(true);
    } else {
      setSelectedVendor(value);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expense Records</h1>
          <p className="text-muted-foreground mt-1">Manage and track all expense transactions</p>
        </div>
        <button
          onClick={() => setShowExpenseModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </button>
      </div>

      {/* Summary Card */}
      <div className="stat-card mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Total Paid This Month</p>
          <p className="text-3xl font-bold text-foreground">${totalPaid.toLocaleString()}</p>
        </div>
        <div className="p-3 bg-success/10 rounded-lg">
          <DollarSign className="w-8 h-8 text-success" />
        </div>
      </div>

      {/* Month Filter */}
      <div className="mb-6">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => dispatch({ type: 'expense/setSelectedMonth', payload: e.target.value })}
          className="input-field w-auto"
        />
      </div>

      {/* Transactions Table */}
      <div className="card-elevated overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Vendor</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Reason</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Amount</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Date</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  No expense records found for this month
                </td>
              </tr>
            ) : (
              filteredExpenses.map((expense) => (
                <tr key={expense.id} className="table-row-hover border-b border-border last:border-0">
                  <td className="py-4 px-6 text-sm font-medium text-foreground">{expense.vendorName}</td>
                  <td className="py-4 px-6 text-sm text-muted-foreground">{expense.reason}</td>
                  <td className="py-4 px-6 text-sm font-semibold text-foreground">${expense.amount.toLocaleString()}</td>
                  <td className="py-4 px-6 text-sm text-muted-foreground">{expense.date}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      expense.status === 'paid' 
                        ? 'bg-success/10 text-success' 
                        : expense.status === 'pending'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showExpenseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay flex items-center justify-center p-6"
            onClick={() => setShowExpenseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card-elevated w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Add New Expense</h2>
                <button
                  onClick={() => setShowExpenseModal(false)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {showVendorForm ? (
                /* Create Vendor Form */
                <div className="space-y-4">
                  <div className="p-4 bg-accent rounded-lg mb-4">
                    <h3 className="text-sm font-medium text-accent-foreground mb-3">Create New Vendor</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Vendor Name"
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                        className="input-field"
                      />
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={vendorEmail}
                        onChange={(e) => setVendorEmail(e.target.value)}
                        className="input-field"
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={vendorPhone}
                        onChange={(e) => setVendorPhone(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={handleAddVendor} className="btn-primary flex-1">
                        Save Vendor
                      </button>
                      <button 
                        onClick={() => { setShowVendorForm(false); resetVendorForm(); }} 
                        className="btn-ghost flex-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Expense Form */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Vendor</label>
                    <select
                      value={selectedVendor}
                      onChange={(e) => handleVendorChange(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select Vendor</option>
                      <option value="create" className="text-primary font-medium">+ Create Vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Expense Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        className="input-field pl-8"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Reason / Message</label>
                    <textarea
                      placeholder="Enter expense reason..."
                      value={expenseReason}
                      onChange={(e) => setExpenseReason(e.target.value)}
                      className="input-field min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={handleAddExpense} className="btn-primary flex-1">
                      Add Expense
                    </button>
                    <button 
                      onClick={() => { setShowExpenseModal(false); resetExpenseForm(); }} 
                      className="btn-ghost flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpenseRecords;
