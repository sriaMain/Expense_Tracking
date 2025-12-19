import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/lib/axiosInstance';
import { Expense } from './expenseSlice';

export interface Employee {
    id?: number;  // May be present in list responses
    employee_id?: number;  // May be present in some responses
    employee_name: string;  // API uses employee_name, not full_name
    full_name?: string; // Some responses might use this
    full_nmae?: string; // Backend typo
    department: string;
    designation: string;
    joined_at?: string;  // Optional since it's not in create response
    is_active: boolean;
    created_by?: {
        id: number;
        username: string;
    };
    total_expenses?: number;
    expenses?: Expense[]; // Raw expenses array for each employee
}

interface EmployeeState {
    employees: Employee[];
    isLoading: boolean;
    error: string | null;
}

const initialState: EmployeeState = {
    employees: [],
    isLoading: false,
    error: null,
};

export const fetchEmployees = createAsyncThunk(
    'employees/fetchEmployees',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('employees/');
            console.log('Fetched employees:', response.data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch employees');
        }
    }
);

export const addEmployee = createAsyncThunk(
    'employees/addEmployee',
    async (employeeData: { full_name: string; department: string; designation: string }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('employees/', employeeData);

            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to add employee');
        }
    }
);

export const fetchEmployeeExpenses = createAsyncThunk(
    'employees/fetchEmployeeExpenses',
    async (employeeId: number, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`employees/${employeeId}/expenses/`);
            return { employeeId, expenses: response.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch employee expenses');
        }
    }
);

const employeeSlice = createSlice({
    name: 'employee',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchEmployees.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchEmployees.fulfilled, (state, action) => {
                state.isLoading = false;
                state.employees = action.payload;
            })
            .addCase(fetchEmployees.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(addEmployee.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(addEmployee.fulfilled, (state, action) => {
                state.isLoading = false;
                if (action.payload && typeof action.payload === 'object') {
                    if (action.payload.id || action.payload.employee_id) {
                        state.employees.push(action.payload);
                    }
                }
            })
            .addCase(addEmployee.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchEmployeeExpenses.fulfilled, (state, action) => {
                const { employeeId, expenses } = action.payload;
                const employeeIndex = state.employees.findIndex(e => (e.employee_id === employeeId || e.id === employeeId));
                if (employeeIndex !== -1) {
                    // Calculate total expenses for this employee
                    const total = expenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount_requested || '0'), 0);
                    state.employees[employeeIndex].total_expenses = total;
                    // Store the raw expenses array for potential use in UI calculations
                    state.employees[employeeIndex].expenses = expenses;
                }
                // No need to return anything; Immer handles mutation
            });
    },
});

export const { clearError } = employeeSlice.actions;
export default employeeSlice.reducer;
