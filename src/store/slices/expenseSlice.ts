import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/lib/axiosInstance';

export interface UserInfo {
  id: number;
  username: string;
}

export interface Expense {
  id: number;
  vendor: number | string;
  employee?: number; // Keep for compatibility if backend still uses it
  category: number;
  project?: number;
  amount_requested: string;
  amount_paid: string;
  remaining_amount: string;
  status: 'UNPAID' | 'PAID' | 'PARTIAL' | 'PARTIAL_PAID' | 'PARTIALLY_PAID' | 'PENDING';
  created_by?: UserInfo;
  updated_by?: UserInfo | null;
  created_at?: string;
  updated_at?: string;
  payments?: Payment[]; // Payments included in the expense response
  reason?: string;
}

export interface RecurringExpense {
  id: number;
  vendor: {
    id: number | string;
    name?: string;
    address?: string;
    contact_number?: string;
    is_active?: boolean;
    created_at?: string;
    expenses?: Expense[];
    total_remaining_amount?: number;
    created_by?: { id: number; username: string };
  };
  category: number;
  project?: number;
  reason?: string;
  amount: string;
  start_date: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: number;
  expense: number;
  amount: string;
  created_at: string;
  paid_at: string;
  created_by: number;
}

interface ExpenseState {
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  payments: Payment[]; // Store payments for the currently selected expense
  isLoading: boolean;
  paymentsLoading: boolean;
  error: string | null;
  selectedMonth: string;
  total_remaining_amount: number;
}

const initialState: ExpenseState = {
  expenses: [],
  recurringExpenses: [],
  payments: [],
  isLoading: false,
  paymentsLoading: false,
  error: null,
  selectedMonth: new Date().toISOString().slice(0, 7),
  total_remaining_amount: 0,
};

// Async Thunks
export const fetchExpenses = createAsyncThunk(
  'expense/fetchExpenses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('expenses/');
      const data = response.data;

      // Flatten the grouped data if it's in the vendor-grouped format
      if (Array.isArray(data) && data.length > 0 && 'expenses' in data[0]) {
        const allExpenses: Expense[] = [];
        data.forEach((vendor: any) => {
          if (Array.isArray(vendor.expenses)) {
            vendor.expenses.forEach((expense: any) => {
              // Normalize vendor field
              allExpenses.push({
                ...expense,
                vendor: vendor.id || expense.vendor_id || expense.vendor || expense.employee
              });
            });
          }
        });
        return allExpenses;
      }

      return data;
    } catch (error: any) {
      const data = error.response?.data;
      return rejectWithValue(data?.detail || data?.error || 'Failed to fetch expenses');
    }
  }
);

export const addExpense = createAsyncThunk(
  'expense/addExpense',
  async (expenseData: { vendor_id: number; category: number; project?: number; reason?: string; amount: number }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('expenses/', expenseData);
      return response.data;
    } catch (error: any) {
      const data = error.response?.data;
      return rejectWithValue(
        (Array.isArray(data?.error) ? data.error[0] : data?.error) ||
        data?.message ||
        data?.detail ||
        'Failed to add expense'
      );
    }
  }
);

export const addRecurringExpense = createAsyncThunk(
  'expense/addRecurringExpense',
  async (expenseData: { vendor_id: number; category: number; project?: number; reason?: string; amount: number; start_date: string; frequency: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('recurring-expenses/', expenseData);
      return response.data;
    } catch (error: any) {
      const data = error.response?.data;
      return rejectWithValue(
        (Array.isArray(data?.error) ? data.error[0] : data?.error) ||
        data?.message ||
        data?.detail ||
        'Failed to add recurring expense'
      );
    }
  }
);

export const fetchRecurringExpenses = createAsyncThunk(
  'expense/fetchRecurringExpenses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('recurring-expenses/');
      return response.data;
    } catch (error: any) {
      const data = error.response?.data;
      return rejectWithValue(data?.detail || data?.error || 'Failed to fetch recurring expenses');
    }
  }
);

export const fetchRecurringExpenseById = createAsyncThunk(
  'expense/fetchRecurringExpenseById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`recurring-expenses/${id}/`);
      return response.data;
    } catch (error: any) {
      const data = error.response?.data;
      return rejectWithValue(data?.detail || data?.error || 'Failed to fetch recurring expense details');
    }
  }
);

export const fetchAllExpensesAndRecurring = createAsyncThunk(
  'expense/fetchAllExpensesAndRecurring',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('expenses/all/');
      return response.data;
    } catch (error: any) {
      const data = error.response?.data;
      return rejectWithValue(data?.detail || data?.error || 'Failed to fetch all expenses');
    }
  }
);

export const fetchExpenseById = createAsyncThunk(
  'expense/fetchExpenseById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`expenses/${id}/`);
      return response.data;
    } catch (error: any) {
      const data = error.response?.data;
      return rejectWithValue(data?.detail || data?.error || 'Failed to fetch expense details');
    }
  }
);

export const makePayment = createAsyncThunk(
  'expense/makePayment',
  async (paymentData: { expense: number; amount: number }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('payments/', paymentData);
      return response.data;
    } catch (error: any) {
      const data = error.response?.data;
      return rejectWithValue(
        (Array.isArray(data?.amount) ? data.amount[0] : data?.amount) ||
        data?.error ||
        data?.detail ||
        'Failed to make payment'
      );
    }
  }
);

export const fetchPayments = createAsyncThunk(
  'expense/fetchPayments',
  async (expenseId: number, { rejectWithValue }) => {
    try {
      // Assuming the API supports filtering by expense ID, e.g., /payments/?expense=ID
      // If not, we might need to fetch all payments and filter client-side, or use a nested endpoint if available.
      // Based on typical DRF patterns, filtering is common.
      const response = await axiosInstance.get(`vendors/${expenseId}/payments/`);
      return response.data;
    } catch (error: any) {
      const data = error.response?.data;
      return rejectWithValue(data?.detail || data?.error || 'Failed to fetch payments');
    }
  }
);

export const fetchCarryForward = createAsyncThunk(
  'expense/fetchCarryForward',
  async (monthStr: string, { rejectWithValue }) => {
    try {
      if (!monthStr || !monthStr.includes('-')) {
        return rejectWithValue('Invalid month format');
      }

      const [year, month] = monthStr.split('-').map(Number);
      const date = new Date(year, month - 1); // month is 0-indexed in Date constructor
      date.setMonth(date.getMonth() - 1);

      const prevYear = date.getFullYear();
      const prevMonth = date.getMonth() + 1;

      const response = await axiosInstance.post('expenses/carry-forward/', {
        period: 'monthly',
        year: prevYear,
        month: prevMonth
      });
      return response.data;
    } catch (error: any) {
      const data = error.response?.data;
      return rejectWithValue(data?.detail || data?.error || 'Failed to fetch carry forward amount');
    }
  }
);

const expenseSlice = createSlice({
  name: 'expense',
  initialState,
  reducers: {
    setSelectedMonth: (state, action: PayloadAction<string>) => {
      state.selectedMonth = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearPayments: (state) => {
      state.payments = [];
    }
  },
  extraReducers: (builder) => {
    // Fetch Expenses
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.expenses = action.payload;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add Expense
    builder
      .addCase(addExpense.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        state.expenses.unshift(action.payload);
      })
      .addCase(addExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add Recurring Expense
    builder
      .addCase(addRecurringExpense.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addRecurringExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recurringExpenses.unshift(action.payload);
      })
      .addCase(addRecurringExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Recurring Expenses
    builder
      .addCase(fetchRecurringExpenses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecurringExpenses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recurringExpenses = action.payload;
      })
      .addCase(fetchRecurringExpenses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Recurring Expense By ID
    builder
      .addCase(fetchRecurringExpenseById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecurringExpenseById.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.recurringExpenses.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.recurringExpenses[index] = action.payload;
        } else {
          state.recurringExpenses.push(action.payload);
        }
      })
      .addCase(fetchRecurringExpenseById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Expense By ID
    builder
      .addCase(fetchExpenseById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchExpenseById.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.expenses.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        } else {
          state.expenses.push(action.payload);
        }
      })
      .addCase(fetchExpenseById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch All Expenses and Recurring
    builder
      .addCase(fetchAllExpensesAndRecurring.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllExpensesAndRecurring.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle both combined list or structured object
        if (Array.isArray(action.payload)) {
          state.expenses = action.payload;
        } else if (action.payload && typeof action.payload === 'object') {
          if (action.payload.expenses) state.expenses = action.payload.expenses;
          if (action.payload.recurring_expenses) state.recurringExpenses = action.payload.recurring_expenses;
        }
      })
      .addCase(fetchAllExpensesAndRecurring.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Make Payment
    builder
      .addCase(makePayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(makePayment.fulfilled, (state, action) => {
        state.isLoading = false;
        const payment = action.payload;
        // We will rely on re-fetching expenses to get the updated status and amount_paid
        // so we don't calculate it here manually.
        // Also add to current payments list if viewing this expense
        if (state.payments.length > 0 && state.payments[0].expense === payment.expense) {
          state.payments.unshift(payment);
        }
      })
      .addCase(makePayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Payments
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.paymentsLoading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.paymentsLoading = false;
        state.payments = action.payload;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.paymentsLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCarryForward.fulfilled, (state, action) => {
        // Handle both simple number and object response
        if (typeof action.payload === 'number') {
          state.total_remaining_amount = action.payload;
        } else if (action.payload && typeof action.payload === 'object') {
          state.total_remaining_amount = parseFloat(action.payload.total_remaining_amount || action.payload.amount || '0');
        }
      });
  },
});

export const { setSelectedMonth, clearError, clearPayments } = expenseSlice.actions;
export default expenseSlice.reducer;
