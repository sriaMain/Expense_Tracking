import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { fetchProjectExpenses, fetchProjects, updateProject, deleteProject } from '@/store/slices/projectSlice';
import { fetchVendors } from '@/store/slices/vendorSlice';
import { fetchCategories } from '@/store/slices/categorySlice';
import {
    ArrowLeft,
    Briefcase,
    Calendar,
    Loader2,
    Receipt,
    IndianRupee,
    TrendingUp,
    Clock,
    Edit2,
    Trash2,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { projects, currentProjectExpenses, isLoading } = useAppSelector((state) => state.project);
    const { vendors } = useAppSelector((state) => state.vendor);
    const { categories } = useAppSelector((state) => state.category);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', description: '', budget: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const project = projects.find(p => p.id === parseInt(id || '0'));

    useEffect(() => {
        if (id) {
            const projectId = parseInt(id);
            dispatch(fetchProjectExpenses(projectId));
            if (projects.length === 0) {
                dispatch(fetchProjects());
            }
            dispatch(fetchVendors());
            dispatch(fetchCategories());
        }
    }, [dispatch, id, projects.length]);

    useEffect(() => {
        if (project) {
            setEditForm({
                name: project.name,
                description: project.description || '',
                budget: project.budget.toString()
            });
        }
    }, [project]);

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !editForm.name || !editForm.budget) {
            toast.error('Please fill in required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await dispatch(updateProject({
                id: parseInt(id),
                data: {
                    ...editForm,
                    budget: parseFloat(editForm.budget)
                }
            })).unwrap();
            toast.success('Project updated successfully');
            setShowEditModal(false);
        } catch (error) {
            toast.error((error as string) || 'Failed to update project');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!id) return;
        if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            try {
                await dispatch(deleteProject(parseInt(id))).unwrap();
                toast.success('Project deleted successfully');
                navigate('/projects');
            } catch (error) {
                toast.error((error as string) || 'Failed to delete project');
            }
        }
    };

    const getVendorName = (id: number | string) => {
        if (typeof id === 'string') return id;
        const vendor = vendors.find(v => v.id === id);
        return vendor ? vendor.name : 'Unknown Vendor';
    };

    const getCategoryName = (id: number) => categories.find(c => c.id === id)?.name || 'Unknown Category';

    const handleExpenseClick = (expenseId: number) => {
        navigate(`/expenses/${expenseId}`);
    };

    const totalRequested = currentProjectExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount_requested), 0);
    const totalPaid = currentProjectExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount_paid), 0);
    const totalRemaining = currentProjectExpenses.reduce((sum, exp) => sum + parseFloat(exp.remaining_amount), 0);

    if (isLoading && !project) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-foreground">Project not found</h2>
                <button onClick={() => navigate('/projects')} className="btn-ghost mt-4">
                    Back to Projects
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/projects')}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            {project.name}
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${project.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                                {project.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </h1>
                        <p className="text-muted-foreground mt-1">Project ID: #{project.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="btn-ghost text-primary hover:bg-primary/10"
                    >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                    </button>
                    <button
                        onClick={handleDeleteProject}
                        className="btn-ghost text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="stat-card">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <IndianRupee className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Total Budget Used</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">₹{totalRequested.toLocaleString()}</p>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-success/10 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-success" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">₹{totalPaid.toLocaleString()}</p>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-warning/10 rounded-lg">
                            <Clock className="w-4 h-4 text-warning" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Pending Payouts</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">₹{totalRemaining.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Project Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card-elevated p-6 space-y-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                            <Briefcase className="w-5 h-5 text-primary" />
                            Project Details
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Description</p>
                                <p className="text-sm text-foreground leading-relaxed">
                                    {project.description || 'No description provided.'}
                                </p>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Status</p>
                                    <p className="text-sm font-medium text-foreground">
                                        {project.is_active ? 'Currently Active' : 'Inactive'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Project Expenses */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                            <Receipt className="w-5 h-5 text-primary" />
                            Project Expenses
                        </h3>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : currentProjectExpenses.length === 0 ? (
                        <div className="card-elevated p-12 text-center border-dashed border-2 border-border bg-muted/30">
                            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <p className="text-muted-foreground">No expenses recorded for this project yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {currentProjectExpenses.map((expense) => (
                                <motion.div
                                    key={expense.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="card-elevated p-4 hover:border-primary/30 transition-all cursor-pointer"
                                    onClick={() => handleExpenseClick(expense.id)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-medium text-foreground">{getVendorName(expense.vendor)}</p>
                                            <p className="text-xs text-muted-foreground">{getCategoryName(expense.category)}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${expense.status === 'PAID' ? 'bg-success/10 text-success' :
                                            expense.status === 'PARTIAL' ? 'bg-warning/10 text-warning' :
                                                'bg-destructive/10 text-destructive'
                                            }`}>
                                            {expense.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Requested</p>
                                            <p className="text-sm font-semibold text-foreground">₹{parseFloat(expense.amount_requested).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Paid</p>
                                            <p className="text-sm font-semibold text-success">₹{parseFloat(expense.amount_paid).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Remaining</p>
                                            <p className="text-sm font-semibold text-warning">₹{parseFloat(expense.remaining_amount).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay flex items-center justify-center p-4 z-[60]"
                        onClick={() => setShowEditModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="card-elevated w-full max-w-md p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-foreground">Edit Project</h2>
                                <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-muted rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateProject} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Project Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Budget (₹) *</label>
                                    <input
                                        type="number"
                                        required
                                        value={editForm.budget}
                                        onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                                        className="input-field"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        className="input-field min-h-[100px]"
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="btn-primary flex-1"
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Update Project'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="btn-ghost flex-1"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectDetails;
