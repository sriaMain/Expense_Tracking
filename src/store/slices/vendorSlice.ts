import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/lib/axiosInstance';
import { Expense } from './expenseSlice';

export interface BankDetail {
    id: number;
    vendor: number;
    bank_name: string;
    account_holder_name: string;
    account_number: string;
    ifsc_code: string;
    account_type: 'CURRENT' | 'SAVINGS';
    branch_name?: string;
    upi_id?: string;
    is_active: boolean;
    created_at?: string;
}

export interface Vendor {
    id: number;
    name: string;
    address: string;
    contact_number: string;
    bank_details?: BankDetail[];
    total_expenses?: number;
    expenses?: Expense[];
    created_at?: string;
    updated_at?: string;
}

interface VendorState {
    vendors: Vendor[];
    currentVendor: Vendor | null;
    selectedVendorBankDetails: BankDetail[];
    isLoading: boolean;
    bankDetailsLoading: boolean;
    error: string | null;
}

const initialState: VendorState = {
    vendors: [],
    currentVendor: null,
    selectedVendorBankDetails: [],
    isLoading: false,
    bankDetailsLoading: false,
    error: null,
};

// Vendor Thunks
export const fetchVendors = createAsyncThunk(
    'vendors/fetchVendors',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('vendors/');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch vendors');
        }
    }
);

export const fetchVendorById = createAsyncThunk(
    'vendors/fetchVendorById',
    async (id: number, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`vendors/${id}/`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch vendor details');
        }
    }
);

export const addVendor = createAsyncThunk(
    'vendors/addVendor',
    async (vendorData: Omit<Vendor, 'id' | 'created_at' | 'updated_at' | 'bank_details'>, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('vendors/', vendorData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to add vendor');
        }
    }
);

export const updateVendor = createAsyncThunk(
    'vendors/updateVendor',
    async ({ id, vendorData }: { id: number; vendorData: Partial<Vendor> }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`vendors/${id}/`, vendorData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to update vendor');
        }
    }
);

export const deleteVendor = createAsyncThunk(
    'vendors/deleteVendor',
    async (id: number, { rejectWithValue }) => {
        try {
            await axiosInstance.delete(`vendors/${id}/`);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to delete vendor');
        }
    }
);

export const fetchVendorExpenses = createAsyncThunk(
    'vendors/fetchVendorExpenses',
    async (vendorId: number, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`vendors/${vendorId}/expenses/`);
            return { vendorId, expenses: response.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch vendor expenses');
        }
    }
);

// Bank Detail Thunks
export const fetchBankDetails = createAsyncThunk(
    'vendors/fetchBankDetails',
    async (vendorId: number, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`vendors/${vendorId}/bank-details/`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch bank details');
        }
    }
);

export const addBankDetail = createAsyncThunk(
    'vendors/addBankDetail',
    async ({ vendorId, bankData }: { vendorId: number; bankData: Omit<BankDetail, 'id' | 'vendor' | 'created_at'> }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`vendors/${vendorId}/bank-details/`, bankData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to add bank details');
        }
    }
);

export const updateBankDetail = createAsyncThunk(
    'vendors/updateBankDetail',
    async ({ id, bankData }: { id: number; bankData: Partial<BankDetail> }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`vendors/bank-details/${id}/`, bankData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to update bank details');
        }
    }
);

export const deleteBankDetail = createAsyncThunk(
    'vendors/deleteBankDetail',
    async (id: number, { rejectWithValue }) => {
        try {
            await axiosInstance.delete(`vendors/bank-details/${id}/`);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to delete bank detail');
        }
    }
);

const vendorSlice = createSlice({
    name: 'vendor',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSelectedBankDetails: (state) => {
            state.selectedVendorBankDetails = [];
        }
    },
    extraReducers: (builder) => {
        builder
            // Vendors
            .addCase(fetchVendors.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchVendors.fulfilled, (state, action) => {
                state.isLoading = false;
                state.vendors = action.payload;
            })
            .addCase(fetchVendors.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchVendorById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchVendorById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentVendor = action.payload;
            })
            .addCase(fetchVendorById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(addVendor.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(addVendor.fulfilled, (state, action) => {
                state.isLoading = false;
                state.vendors.unshift(action.payload);
            })
            .addCase(addVendor.rejected, (state, action) => {
                state.isLoading = false;
                state.error = JSON.stringify(action.payload);
            })
            .addCase(updateVendor.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.vendors.findIndex(v => v.id === action.payload.id);
                if (index !== -1) {
                    state.vendors[index] = action.payload;
                }
            })
            // Bank Details
            .addCase(fetchBankDetails.pending, (state) => {
                state.bankDetailsLoading = true;
            })
            .addCase(fetchBankDetails.fulfilled, (state, action) => {
                state.bankDetailsLoading = false;
                state.selectedVendorBankDetails = action.payload;
            })
            .addCase(fetchBankDetails.rejected, (state, action) => {
                state.bankDetailsLoading = false;
                state.error = action.payload as string;
            })
            .addCase(addBankDetail.fulfilled, (state, action) => {
                state.selectedVendorBankDetails.unshift(action.payload);
            })
            .addCase(updateBankDetail.fulfilled, (state, action) => {
                const index = state.selectedVendorBankDetails.findIndex(b => b.id === action.payload.id);
                if (index !== -1) {
                    state.selectedVendorBankDetails[index] = action.payload;
                }
            })
            .addCase(deleteBankDetail.fulfilled, (state, action) => {
                state.selectedVendorBankDetails = state.selectedVendorBankDetails.filter(b => b.id !== action.payload);
            })
            .addCase(fetchVendorExpenses.fulfilled, (state, action) => {
                const { vendorId, expenses } = action.payload;
                const vendorIndex = state.vendors.findIndex(v => v.id === vendorId);
                if (vendorIndex !== -1) {
                    const total = expenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount_requested || '0'), 0);
                    state.vendors[vendorIndex].total_expenses = total;
                    state.vendors[vendorIndex].expenses = expenses;
                }
            });
    },
});

export const { clearError, clearSelectedBankDetails } = vendorSlice.actions;
export default vendorSlice.reducer;
