import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { fetchCategories, addCategory } from '@/store/slices/categorySlice';
import { Plus, Tag, Loader2, X, Search, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const Categories = () => {
    const dispatch = useAppDispatch();
    const { categories, isLoading } = useAppSelector((state) => state.category);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            toast.error('Please enter a category name');
            return;
        }

        setIsSubmitting(true);
        try {
            await dispatch(addCategory({ name: newCategoryName.trim() })).unwrap();
            toast.success('Category created successfully');
            setShowAddModal(false);
            setNewCategoryName('');
        } catch (error) {
            toast.error((error as string) || 'Failed to create category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Categories</h1>
                    <p className="text-muted-foreground mt-1">Organize your expenses with categories</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Category
                </button>
            </div>

            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10 w-full max-w-md"
                />
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filteredCategories.length === 0 ? (
                <div className="card-elevated p-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Tag className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">No categories found</h3>
                    <p className="text-muted-foreground mt-1">Create categories to better track your spending</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredCategories.map((category) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="card-elevated p-4 flex items-center justify-between group hover:border-primary/50 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <Tag className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">{category.name}</h3>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ID: {category.id}</p>
                                </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${category.is_active ? 'bg-success' : 'bg-muted'}`} title={category.is_active ? 'Active' : 'Inactive'} />
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Add Category Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay flex items-center justify-center p-4 z-[60]"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="card-elevated w-full max-w-sm p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-foreground">Add Category</h2>
                                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-muted rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            <form onSubmit={handleAddCategory} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Category Name</label>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        className="input-field"
                                        placeholder="e.g. Marketing, Utilities"
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="btn-primary flex-1"
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Add Category'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
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

export default Categories;
