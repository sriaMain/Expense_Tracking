import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { addExpense, addRecurringExpense, makePayment, fetchAllExpensesAndRecurring } from '@/store/slices/expenseSlice';
import { fetchVendors, addVendor } from '@/store/slices/vendorSlice';
import { fetchCategories, addCategory } from '@/store/slices/categorySlice';
import { fetchProjects, addProject } from '@/store/slices/projectSlice';
import { ArrowLeft, Plus, X, IndianRupee, Loader2, Save, UserPlus, FolderPlus, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import SearchableSelect from '@/components/SearchableSelect';

const AddExpense = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const urlVendorId = searchParams.get('vendor_id');
    const { vendors } = useAppSelector((state) => state.vendor);
    const { categories } = useAppSelector((state) => state.category);
    const { projects } = useAppSelector((state) => state.project);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [selectedVendor, setSelectedVendor] = useState(() => urlVendorId || sessionStorage.getItem('ae_vendor') || '');
    const [selectedCategory, setSelectedCategory] = useState(() => sessionStorage.getItem('ae_category') || '');
    const [selectedProject, setSelectedProject] = useState(() => sessionStorage.getItem('ae_project') || '');
    const [amount, setAmount] = useState(() => sessionStorage.getItem('ae_amount') || '');
    const [expenseReason, setExpenseReason] = useState(() => sessionStorage.getItem('ae_reason') || '');
    const [isRecurring, setIsRecurring] = useState(false);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [frequency, setFrequency] = useState('MONTHLY');

    // Sub-form visibility
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [showProjectForm, setShowProjectForm] = useState(false);

    // Sub-form states
    const [categoryName, setCategoryName] = useState('');
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [projectBudget, setProjectBudget] = useState('');

    // Persist form state
    useEffect(() => {
        sessionStorage.setItem('ae_vendor', selectedVendor);
        sessionStorage.setItem('ae_category', selectedCategory);
        sessionStorage.setItem('ae_project', selectedProject);
        sessionStorage.setItem('ae_amount', amount);
        sessionStorage.setItem('ae_reason', expenseReason);
    }, [selectedVendor, selectedCategory, selectedProject, amount, expenseReason]);

    useEffect(() => {
        dispatch(fetchVendors());
        dispatch(fetchCategories());
        dispatch(fetchProjects());
    }, [dispatch]);

    useEffect(() => {
        if (urlVendorId) {
            setSelectedVendor(urlVendorId);
        }
    }, [urlVendorId]);

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVendor || !selectedCategory || !amount) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!selectedProject && !expenseReason) {
            toast.error('Please provide a reason if no project is selected');
            return;
        }

        setIsSubmitting(true);
        try {
            const vendor = vendors.find(v => v.id.toString() === selectedVendor);
            const expenseData: any = {
                vendor_id: parseInt(selectedVendor),
                category: parseInt(selectedCategory),
                amount: parseFloat(amount),
            };

            if (selectedProject) {
                expenseData.project = parseInt(selectedProject);
            } else {
                expenseData.reason = expenseReason;
            }

            if (isRecurring) {
                expenseData.start_date = startDate;
                expenseData.frequency = frequency;
                await dispatch(addRecurringExpense(expenseData)).unwrap();
                toast.success('Recurring expense added successfully');
            } else {
                await dispatch(addExpense(expenseData)).unwrap();
                toast.success('Expense added successfully');
            }

            // Clear persistence
            sessionStorage.removeItem('ae_vendor');
            sessionStorage.removeItem('ae_category');
            sessionStorage.removeItem('ae_project');
            sessionStorage.removeItem('ae_amount');
            sessionStorage.removeItem('ae_reason');

            navigate('/expenses');
        } catch (error) {
            toast.error((error as string) || 'Failed to add expense');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddCategory = async () => {
        if (!categoryName) {
            toast.error('Please enter category name');
            return;
        }

        try {
            const result = await dispatch(addCategory({ name: categoryName })).unwrap();
            toast.success('Category created successfully');
            setShowCategoryForm(false);
            setSelectedCategory(result.id.toString());
            setCategoryName('');
        } catch (error) {
            toast.error((error as string) || 'Failed to add category');
        }
    };

    const handleAddProject = async () => {
        if (!projectName || !projectBudget) {
            toast.error('Please enter project name and budget');
            return;
        }

        try {
            const result = await dispatch(addProject({
                name: projectName,
                description: projectDescription,
                budget: parseFloat(projectBudget),
            })).unwrap();

            toast.success('Project created successfully');
            setShowProjectForm(false);
            setSelectedProject(result.id.toString());
            setProjectName('');
            setProjectDescription('');
            setProjectBudget('');
        } catch (error: any) {
            toast.error(typeof error === 'string' ? error : 'Failed to add project');
        }
    };

    return (
        <div className="animate-fade-in pb-20">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/expenses')}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Add New Expense</h1>
                    <p className="text-muted-foreground mt-1">Record a new expense transaction</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card-elevated p-6 space-y-6">
                        <form onSubmit={handleAddExpense} className="space-y-6">
                            <div className="space-y-4">
                                <SearchableSelect
                                    label="Vendor"
                                    placeholder="Select Vendor"
                                    value={selectedVendor}
                                    onChange={setSelectedVendor}
                                    options={vendors.map((v) => ({
                                        value: v.id.toString(),
                                        label: v.name,
                                    }))}
                                    showCreateOption={true}
                                    createOptionLabel="Create New Vendor"
                                    onCreateClick={() => navigate('/vendors/add?redirect=/expenses/add')}
                                />

                                <SearchableSelect
                                    label="Category"
                                    placeholder="Select Category"
                                    value={selectedCategory}
                                    onChange={setSelectedCategory}
                                    options={categories.map((cat) => ({
                                        value: cat.id.toString(),
                                        label: cat.name,
                                    }))}
                                    showCreateOption={true}
                                    createOptionLabel="Create New Category"
                                    onCreateClick={() => setShowCategoryForm(true)}
                                />

                                <SearchableSelect
                                    label="Project (Optional)"
                                    placeholder="Select Project"
                                    value={selectedProject}
                                    onChange={setSelectedProject}
                                    options={projects.map((proj) => ({
                                        value: proj.id.toString(),
                                        label: proj.name,
                                    }))}
                                    showCreateOption={true}
                                    createOptionLabel="Create New Project"
                                    onCreateClick={() => setShowProjectForm(true)}
                                />

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="input-field pl-8"
                                            required
                                        />
                                    </div>
                                </div>

                                {!selectedProject && (
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Reason for Expense</label>
                                        <textarea
                                            placeholder="Please provide a reason since no project is selected"
                                            value={expenseReason}
                                            onChange={(e) => setExpenseReason(e.target.value)}
                                            className="input-field"
                                            rows={3}
                                            required={!selectedProject}
                                        />
                                    </div>
                                )}

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="isRecurring"
                                            checked={isRecurring}
                                            onChange={(e) => setIsRecurring(e.target.checked)}
                                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                        />
                                        <label htmlFor="isRecurring" className="text-sm font-medium text-foreground cursor-pointer">
                                            Recurring Expense
                                        </label>
                                    </div>

                                    {isRecurring && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-2"
                                        >
                                            <label className="block text-sm font-medium text-foreground">Start Date</label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="input-field"
                                                required={isRecurring}
                                            />
                                        </motion.div>
                                    )}

                                    {isRecurring && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-2"
                                        >
                                            <label className="block text-sm font-medium text-foreground">Frequency</label>
                                            <select
                                                value={frequency}
                                                onChange={(e) => setFrequency(e.target.value)}
                                                className="input-field"
                                                required={isRecurring}
                                            >
                                                <option value="DAILY">Daily</option>
                                                <option value="WEEKLY">Weekly</option>
                                                <option value="MONTHLY">Monthly</option>
                                                <option value="QUARTERLY">Quarterly</option>
                                                <option value="YEARLY">Yearly</option>
                                            </select>
                                            <p className="text-xs text-muted-foreground">This expense will be automatically created based on the selected frequency.</p>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn-primary flex-1 h-12"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <Save className="w-5 h-5" />
                                            Save Expense Record
                                        </span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/expenses')}
                                    className="btn-ghost px-8"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Quick Add Panels */}
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        {showCategoryForm && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="card-elevated p-6 border-l-4 border-primary"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-primary" />
                                        New Category
                                    </h3>
                                    <button onClick={() => setShowCategoryForm(false)} className="text-muted-foreground hover:text-foreground">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Category Name"
                                        value={categoryName}
                                        onChange={(e) => setCategoryName(e.target.value)}
                                        className="input-field"
                                    />
                                    <button onClick={handleAddCategory} className="btn-primary w-full">
                                        Create Category
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {showProjectForm && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="card-elevated p-6 border-l-4 border-primary"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <FolderPlus className="w-4 h-4 text-primary" />
                                        New Project
                                    </h3>
                                    <button onClick={() => setShowProjectForm(false)} className="text-muted-foreground hover:text-foreground">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Project Name"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        className="input-field"
                                    />
                                    <textarea
                                        placeholder="Description"
                                        value={projectDescription}
                                        onChange={(e) => setProjectDescription(e.target.value)}
                                        className="input-field"
                                        rows={2}
                                    />
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                        <input
                                            type="number"
                                            placeholder="Budget"
                                            value={projectBudget}
                                            onChange={(e) => setProjectBudget(e.target.value)}
                                            className="input-field pl-8"
                                        />
                                    </div>
                                    <button onClick={handleAddProject} className="btn-primary w-full">
                                        Create Project
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {!showCategoryForm && !showProjectForm && (
                            <div className="card-elevated p-6 bg-muted/30 border border-dashed border-border">
                                <h3 className="text-sm font-medium text-muted-foreground mb-4">Quick Actions</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => navigate('/vendors/add?redirect=/expenses/add')}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-background rounded-lg transition-colors text-foreground"
                                    >
                                        <UserPlus className="w-4 h-4 text-primary" />
                                        Add New Vendor
                                    </button>
                                    <button
                                        onClick={() => setShowCategoryForm(true)}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-background rounded-lg transition-colors text-foreground"
                                    >
                                        <Tag className="w-4 h-4 text-primary" />
                                        Add New Category
                                    </button>
                                    <button
                                        onClick={() => setShowProjectForm(true)}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-background rounded-lg transition-colors text-foreground"
                                    >
                                        <FolderPlus className="w-4 h-4 text-primary" />
                                        Add New Project
                                    </button>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AddExpense;
