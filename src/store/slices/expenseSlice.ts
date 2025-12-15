import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Expense {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  reason: string;
  date: string;
  status: 'pending' | 'paid' | 'cancelled';
}

interface ExpenseState {
  expenses: Expense[];
  vendors: Vendor[];
  isLoading: boolean;
  error: string | null;
  selectedMonth: string;
}

const initialState: ExpenseState = {
  expenses: [
    { id: '1', vendorId: '1', vendorName: 'Tech Solutions Inc', amount: 5400, reason: 'Software License Renewal', date: '2024-01-15', status: 'paid' },
    { id: '2', vendorId: '2', vendorName: 'Office Supplies Co', amount: 1250, reason: 'Monthly Office Supplies', date: '2024-01-12', status: 'paid' },
    { id: '3', vendorId: '3', vendorName: 'Cloud Services Ltd', amount: 3200, reason: 'Cloud Infrastructure', date: '2024-01-10', status: 'pending' },
    { id: '4', vendorId: '1', vendorName: 'Tech Solutions Inc', amount: 2800, reason: 'Hardware Maintenance', date: '2024-01-08', status: 'paid' },
    { id: '5', vendorId: '4', vendorName: 'Marketing Agency', amount: 8500, reason: 'Q1 Marketing Campaign', date: '2024-01-05', status: 'paid' },
    { id: '6', vendorId: '2', vendorName: 'Office Supplies Co', amount: 890, reason: 'Printer Cartridges', date: '2024-01-03', status: 'paid' },
  ],
  vendors: [
    { id: '1', name: 'Tech Solutions Inc', email: 'billing@techsolutions.com', phone: '+1 555-0101' },
    { id: '2', name: 'Office Supplies Co', email: 'orders@officesupplies.com', phone: '+1 555-0102' },
    { id: '3', name: 'Cloud Services Ltd', email: 'finance@cloudservices.com', phone: '+1 555-0103' },
    { id: '4', name: 'Marketing Agency', email: 'accounts@marketingagency.com', phone: '+1 555-0104' },
  ],
  isLoading: false,
  error: null,
  selectedMonth: new Date().toISOString().slice(0, 7),
};

const expenseSlice = createSlice({
  name: 'expense',
  initialState,
  reducers: {
    addExpense: (state, action: PayloadAction<Omit<Expense, 'id'>>) => {
      const newExpense = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.expenses.unshift(newExpense);
    },
    updateExpense: (state, action: PayloadAction<Expense>) => {
      const index = state.expenses.findIndex((e) => e.id === action.payload.id);
      if (index !== -1) {
        state.expenses[index] = action.payload;
      }
    },
    deleteExpense: (state, action: PayloadAction<string>) => {
      state.expenses = state.expenses.filter((e) => e.id !== action.payload);
    },
    addVendor: (state, action: PayloadAction<Omit<Vendor, 'id'>>) => {
      const newVendor = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.vendors.push(newVendor);
    },
    setSelectedMonth: (state, action: PayloadAction<string>) => {
      state.selectedMonth = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addExpense,
  updateExpense,
  deleteExpense,
  addVendor,
  setSelectedMonth,
  setLoading,
  setError,
} = expenseSlice.actions;

export default expenseSlice.reducer;
