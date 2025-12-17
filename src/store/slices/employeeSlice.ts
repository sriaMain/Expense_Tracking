import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/lib/axiosInstance';

export interface Employee {
    id: number;
    employee_id: number;
    full_name: string;
    department: string;
    designation: string;
    joined_at: string;
    is_active: boolean;
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
                state.employees.push(action.payload);
            })
            .addCase(addEmployee.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError } = employeeSlice.actions;
export default employeeSlice.reducer;
