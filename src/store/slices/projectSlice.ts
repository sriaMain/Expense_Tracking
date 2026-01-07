import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/lib/axiosInstance';
import { Expense } from './expenseSlice';

export interface Project {
    id: number;
    name: string;
    description?: string;
    budget: string | number;
    is_active: boolean;
}

interface ProjectState {
    projects: Project[];
    currentProjectExpenses: Expense[];
    isLoading: boolean;
    error: string | null;
}

const initialState: ProjectState = {
    projects: [],
    currentProjectExpenses: [],
    isLoading: false,
    error: null,
};

export const fetchProjects = createAsyncThunk(
    'projects/fetchProjects',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('projects/');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch projects');
        }
    }
);

export const addProject = createAsyncThunk(
    'projects/addProject',
    async (projectData: { name: string; description?: string; budget: number }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('projects/', projectData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || error.response?.data || 'Failed to add project');
        }
    }
);

export const fetchProjectExpenses = createAsyncThunk(
    'projects/fetchProjectExpenses',
    async (projectId: number, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`projects/${projectId}/expenses/`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch project expenses');
        }
    }
);

export const updateProject = createAsyncThunk(
    'projects/updateProject',
    async ({ id, data }: { id: number; data: Partial<Project> }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`projects/${id}/`, data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || error.response?.data || 'Failed to update project');
        }
    }
);

export const deleteProject = createAsyncThunk(
    'projects/deleteProject',
    async (id: number, { rejectWithValue }) => {
        try {
            await axiosInstance.delete(`projects/${id}/`);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to delete project');
        }
    }
);

const projectSlice = createSlice({
    name: 'project',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProjects.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchProjects.fulfilled, (state, action) => {
                state.isLoading = false;
                state.projects = action.payload;
            })
            .addCase(fetchProjects.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(addProject.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(addProject.fulfilled, (state, action) => {
                state.isLoading = false;
                if (action.payload && typeof action.payload === 'object') {
                    state.projects.push(action.payload);
                }
            })
            .addCase(addProject.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchProjectExpenses.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchProjectExpenses.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentProjectExpenses = action.payload;
            })
            .addCase(fetchProjectExpenses.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(updateProject.fulfilled, (state, action) => {
                const index = state.projects.findIndex(p => p.id === action.payload.id);
                if (index !== -1) {
                    state.projects[index] = action.payload;
                }
            })
            .addCase(deleteProject.fulfilled, (state, action) => {
                state.projects = state.projects.filter(p => p.id !== action.payload);
            });
    },
});

export const { clearError } = projectSlice.actions;
export default projectSlice.reducer;
