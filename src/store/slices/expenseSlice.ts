import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/lib/axiosInstance';

export interface UserInfo {
  id: number;
  username: string;
}

export interface Expense {
  id: number;
  employee: number;
  category: number;
  amount_requested: string;
  amount_paid: string;
  status: 'UNPAID' | 'PAID' | 'PARTIAL';
  created_by?: UserInfo;
  updated_by?: UserInfo | null;
  created_at?: string;
  updated_at?: string;
  payments?: Payment[]; // Payments included in the expense response
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
  payments: Payment[]; // Store payments for the currently selected expense
  isLoading: boolean;
  paymentsLoading: boolean;
  error: string | null;
  selectedMonth: string;
}

const initialState: ExpenseState = {
  expenses: [],
  payments: [],
  isLoading: false,
  paymentsLoading: false,
  error: null,
  selectedMonth: new Date().toISOString().slice(0, 7),
};

// Async Thunks
export const fetchExpenses = createAsyncThunk(
  'expense/fetchExpenses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('expenses/');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch expenses');
    }
  }
);

export const addExpense = createAsyncThunk(
  'expense/addExpense',
  async (expenseData: { employee: number; category: number; amount_requested: number }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('expenses/', expenseData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to add expense');
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
      return rejectWithValue(error.response?.data?.detail || 'Failed to make payment');
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
      const response = await axiosInstance.get(`employees/${expenseId}/payments/`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch payments');
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
      });
  },
});

export const { setSelectedMonth, clearError, clearPayments } = expenseSlice.actions;
export default expenseSlice.reducer;
