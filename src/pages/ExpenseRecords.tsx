import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { fetchExpenses, addExpense, makePayment, fetchPayments, clearPayments } from '@/store/slices/expenseSlice';
import { fetchEmployees, addEmployee } from '@/store/slices/employeeSlice';
import { fetchCategories, addCategory } from '@/store/slices/categorySlice';
import { Plus, X, IndianRupee, Loader2, Receipt, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const ExpenseRecords = () => {
  const dispatch = useAppDispatch();
  const { expenses, payments, isLoading: expensesLoading, paymentsLoading, selectedMonth } = useAppSelector((state) => state.expense);
  const { employees, isLoading: employeesLoading } = useAppSelector((state) => state.employee);
  const { categories, isLoading: categoriesLoading } = useAppSelector((state) => state.category);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // Expense Form states
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amountRequested, setAmountRequested] = useState('');
  const [amountPaid, setAmountPaid] = useState('');

  // Employee Form states
  const [empFullName, setEmpFullName] = useState('');
  const [empDepartment, setEmpDepartment] = useState('');
  const [empDesignation, setEmpDesignation] = useState('');

  // Category Form states
  const [categoryName, setCategoryName] = useState('');

  // Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  // Details Modal state
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    dispatch(fetchExpenses());
    dispatch(fetchEmployees());
    dispatch(fetchCategories());
  }, [dispatch]);

  // Helper to get names from IDs
  const getEmployeeName = (id: number) => {
    const emp = employees.find(e => e.employee_id === id || e.id === id);
    return emp ? (emp.employee_name || emp.full_name || emp.full_nmae) : 'Unknown Employee';
  };
  const getCategoryName = (id: number) => categories.find(c => c.id === id)?.name || 'Unknown Category';



  const handleRowClick = (expenseId: number) => {
    setSelectedExpenseId(expenseId);
    dispatch(clearPayments());
    dispatch(fetchPayments(expenseId));
    setShowDetailsModal(true);
  };

  const handleAddExpense = async () => {
    if (!selectedEmployee || !selectedCategory || !amountRequested) {
      toast.error('Please fill in all fields');
      return;
    }

    console.log(selectedEmployee, selectedCategory, amountRequested, amountPaid);

    try {
      const result = await dispatch(addExpense({

        employee: parseInt(selectedEmployee),
        category: parseInt(selectedCategory),
        amount_requested: parseFloat(amountRequested),
      })).unwrap();

      // If there's an initial amount paid, record it immediately
      if (amountPaid && parseFloat(amountPaid) > 0) {
        await dispatch(makePayment({
          expense: result.id,
          amount: parseFloat(amountPaid),
        })).unwrap();
      }

      toast.success('Expense added successfully');
      setShowExpenseModal(false);
      resetExpenseForm();
    } catch (error) {
      toast.error((error as string) || 'Failed to add expense');
    }
  };

  const handleAddEmployee = async () => {
    if (!empFullName || !empDepartment || !empDesignation) {
      toast.error('Please fill in all employee details');
      return;
    }

    try {
      const result = await dispatch(addEmployee({
        full_name: empFullName,
        department: empDepartment,
        designation: empDesignation,
      })).unwrap();

      toast.success('Employee/Vendor created successfully');
      setShowEmployeeForm(false);
      // Auto-select the new employee
      const newEmployeeId = result.employee_id || result.id;
      if (newEmployeeId) {
        setSelectedEmployee(newEmployeeId.toString());
      }
      resetEmployeeForm();
    } catch (error) {
      toast.error((error as string) || 'Failed to add employee');
    }
  };

  const handleAddCategory = async () => {
    if (!categoryName) {
      toast.error('Please enter category name');
      return;
    }

    try {
      const result = await dispatch(addCategory({
        name: categoryName,
      })).unwrap();

      toast.success('Category created successfully');
      setShowCategoryForm(false);
      // Auto-select the new category
      setSelectedCategory(result.id.toString());
      setCategoryName('');
    } catch (error) {
      toast.error((error as string) || 'Failed to add category');
    }
  };

  const handleMakePayment = async () => {
    if (!selectedExpenseId || !paymentAmount) return;

    try {
      await dispatch(makePayment({
        expense: selectedExpenseId,
        amount: parseFloat(paymentAmount),
      })).unwrap();

      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentAmount('');
      // Refresh payments list in details modal
      if (selectedExpenseId) {
        dispatch(fetchPayments(selectedExpenseId));
        dispatch(fetchExpenses());
      }
    } catch (error) {
      toast.error((error as string) || 'Failed to record payment');
    }
  };

  const resetExpenseForm = () => {
    setSelectedEmployee('');
    setSelectedCategory('');
    setAmountRequested('');
    setAmountPaid('');
  };

  const resetEmployeeForm = () => {
    setEmpFullName('');
    setEmpDepartment('');
    setEmpDesignation('');
  };

  const handleEmployeeChange = (value: string) => {
    if (value === 'create') {
      setShowEmployeeForm(true);
    } else {
      setSelectedEmployee(value);
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'create') {
      setShowCategoryForm(true);
    } else {
      setSelectedCategory(value);
    }
  };

  // Filter expenses by month (assuming date is created_at or updated_at)
  const filteredExpenses = expenses.filter(exp => {
    const date = exp.created_at || exp.updated_at || '';
    return date.startsWith(selectedMonth);
  });

  const totalPaid = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount_paid), 0);
  const selectedExpense = expenses.find(e => e.id === selectedExpenseId);



  return (
    <div className="animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Expense Records</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage and track all expense transactions</p>
        </div>
        <button
          onClick={() => setShowExpenseModal(true)}
          className="btn-primary w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </button>
      </div>

      {/* Summary Card */}
      <div className="stat-card mb-6 sm:mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Total Paid This Month</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">₹{totalPaid.toLocaleString()}</p>
        </div>
        <div className="p-3 bg-success/10 rounded-lg">
          <IndianRupee className="w-6 h-6 sm:w-8 sm:h-8 text-success" />
        </div>
      </div>

      {/* Month Filter */}
      <div className="mb-4 sm:mb-6">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => dispatch({ type: 'expense/setSelectedMonth', payload: e.target.value })}
          className="input-field w-full sm:w-auto"
        />
      </div>

      {/* Transactions Table - Desktop */}
      <div className="card-elevated overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Employee/Vendor</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Category</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Requested</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Paid</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Created By</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {expensesLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    No expense records found for this month
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    onClick={() => handleRowClick(expense.id)}
                    className="table-row-hover border-b border-border last:border-0 cursor-pointer"
                  >
                    <td className="py-4 px-6 text-sm font-medium text-foreground">{getEmployeeName(expense.employee)}</td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">{getCategoryName(expense.category)}</td>
                    <td className="py-4 px-6 text-sm font-semibold text-foreground">₹{parseFloat(expense.amount_requested).toLocaleString()}</td>
                    <td className="py-4 px-6 text-sm font-semibold text-foreground">₹{parseFloat(expense.amount_paid).toLocaleString()}</td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">{expense.created_by?.username || '-'}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${expense.status === 'PAID'
                        ? 'bg-success/10 text-success'
                        : expense.status === 'PARTIAL'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-destructive/10 text-destructive'
                        }`}>
                        {expense.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transactions Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {expensesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="card-elevated p-8 text-center text-muted-foreground">
            No expense records found for this month
          </div>
        ) : (
          filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              onClick={() => handleRowClick(expense.id)}
              className="card-elevated p-4 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-foreground">{getEmployeeName(expense.employee)}</p>
                  <p className="text-sm text-muted-foreground">{getCategoryName(expense.category)}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${expense.status === 'PAID'
                  ? 'bg-success/10 text-success'
                  : expense.status === 'PARTIAL'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-destructive/10 text-destructive'
                  }`}>
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
                <div>
                  <p className="text-muted-foreground">Created By</p>
                  <p className="font-semibold text-foreground">{expense.created_by.username}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Expense Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedExpense && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card-elevated w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Expense Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Employee/Vendor</p>
                    <p className="font-medium text-foreground">{getEmployeeName(selectedExpense.employee)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium text-foreground">{getCategoryName(selectedExpense.category)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Requested Amount</p>
                    <p className="font-semibold text-xl text-foreground">₹{parseFloat(selectedExpense.amount_requested).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Paid Amount</p>
                    <p className="font-semibold text-xl text-success">₹{parseFloat(selectedExpense.amount_paid).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created By</p>
                    <p className="font-medium text-foreground">{selectedExpense.created_by?.username || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created At</p>
                    <p className="font-medium text-foreground">{selectedExpense.created_at}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Updated At</p>
                    <p className="font-medium text-foreground">{selectedExpense.updated_at}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${selectedExpense.status === 'PAID'
                      ? 'bg-success/10 text-success'
                      : selectedExpense.status === 'PARTIAL'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-destructive/10 text-destructive'
                      }`}>
                      {selectedExpense.status}
                    </span>
                  </div>
                </div>


                {/* Payment History Section */}
                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Receipt className="w-4 h-4" />
                      Payment History
                    </h3>
                    {selectedExpense.status !== 'PAID' && (
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="btn-primary text-xs py-1.5 px-3 h-auto"
                      >
                        + Add Payment
                      </button>
                    )}
                  </div>

                  {paymentsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border">
                      <p className="text-sm text-muted-foreground">No payments made yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                              <IndianRupee className="w-4 h-4 text-success" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">Payment #{payment.id}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(payment.paid_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold text-foreground">₹{parseFloat(payment.amount).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showExpenseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowExpenseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card-elevated w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  {showEmployeeForm ? 'Create New Employee' : showCategoryForm ? 'Create New Category' : 'Add New Expense'}
                </h2>
                <button
                  onClick={() => {
                    setShowExpenseModal(false);
                    setShowEmployeeForm(false);
                    setShowCategoryForm(false);
                  }}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {showEmployeeForm ? (
                /* Create Employee Form */
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={empFullName}
                    onChange={(e) => setEmpFullName(e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Department"
                    value={empDepartment}
                    onChange={(e) => setEmpDepartment(e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Designation"
                    value={empDesignation}
                    onChange={(e) => setEmpDesignation(e.target.value)}
                    className="input-field"
                  />
                  <div className="flex gap-3 mt-4">
                    <button onClick={handleAddEmployee} className="btn-primary flex-1">
                      Save Employee
                    </button>
                    <button
                      onClick={() => setShowEmployeeForm(false)}
                      className="btn-ghost flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : showCategoryForm ? (
                /* Create Category Form */
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Category Name"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="input-field"
                  />
                  <div className="flex gap-3 mt-4">
                    <button onClick={handleAddCategory} className="btn-primary flex-1">
                      Save Category
                    </button>
                    <button
                      onClick={() => setShowCategoryForm(false)}
                      className="btn-ghost flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Expense Form */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Employee / Vendor</label>
                    <select
                      value={selectedEmployee}
                      onChange={(e) => handleEmployeeChange(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select Employee</option>
                      <option value="create" className="text-primary font-medium">+ Create New Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.employee_id || emp.id} value={emp.employee_id || emp.id}>
                          {emp.employee_name || emp.full_name || emp.full_nmae || 'Unknown'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select Category</option>
                      <option value="create" className="text-primary font-medium">+ Create New Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Amount Requested</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amountRequested}
                        onChange={(e) => setAmountRequested(e.target.value)}
                        className="input-field pl-8"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Amount Paid</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        className="input-field pl-8"
                      />
                    </div>
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

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay flex items-center justify-center p-4 sm:p-6 z-[60]" // Higher z-index to sit above details modal
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card-elevated w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-foreground mb-4">Make Payment</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Amount to Pay</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="input-field pl-8"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleMakePayment} className="btn-primary flex-1">
                    Confirm Payment
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpenseRecords;
