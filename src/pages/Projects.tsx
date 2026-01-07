import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { fetchProjects, addProject, updateProject, deleteProject, Project } from '@/store/slices/projectSlice';
import { Plus, FolderPlus, Loader2, X, Search, Briefcase, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const Projects = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { projects, isLoading } = useAppSelector((state) => state.project);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [newProject, setNewProject] = useState({ name: '', description: '', budget: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        dispatch(fetchProjects());
    }, [dispatch]);

    const handleAddProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProject.name || !newProject.budget) {
            toast.error('Please fill in required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await dispatch(addProject({
                name: newProject.name,
                description: newProject.description,
                budget: parseFloat(newProject.budget)
            })).unwrap();
            toast.success('Project created successfully');
            setShowAddModal(false);
            setNewProject({ name: '', description: '', budget: '' });
        } catch (error) {
            toast.error((error as string) || 'Failed to create project');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject || !newProject.name || !newProject.budget) {
            toast.error('Please fill in required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await dispatch(updateProject({
                id: selectedProject.id,
                data: {
                    name: newProject.name,
                    description: newProject.description,
                    budget: parseFloat(newProject.budget)
                }
            })).unwrap();
            toast.success('Project updated successfully');
            setShowEditModal(false);
            setSelectedProject(null);
            setNewProject({ name: '', description: '', budget: '' });
        } catch (error) {
            toast.error((error as string) || 'Failed to update project');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProject = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await dispatch(deleteProject(id)).unwrap();
                toast.success('Project deleted successfully');
            } catch (error) {
                toast.error((error as string) || 'Failed to delete project');
            }
        }
    };

    const openEditModal = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        setSelectedProject(project);
        setNewProject({
            name: project.name,
            description: project.description || '',
            budget: project.budget.toString()
        });
        setShowEditModal(true);
    };

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Projects</h1>
                    <p className="text-muted-foreground mt-1">Manage and track your business projects</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                </button>
            </div>

            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10 w-full max-w-md"
                />
            </div>

            {isLoading && projects.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="card-elevated p-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">No projects found</h3>
                    <p className="text-muted-foreground mt-1">Get started by creating your first project</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="card-elevated p-6 group hover:border-primary/50 transition-all cursor-pointer relative"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => openEditModal(e, project)}
                                        className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteProject(e, project.id)}
                                        className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${project.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                                        {project.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2">{project.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                                {project.description || 'No description provided.'}
                            </p>
                            <p className="text-sm font-medium text-foreground">Budget: {project.budget}</p>
                            <div className="pt-4 border-t border-border flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Project ID</span>
                                <span className="text-sm font-mono text-foreground">#{project.id}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Add Project Modal */}
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
                            className="card-elevated w-full max-w-md p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-foreground">Create New Project</h2>
                                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-muted rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            <form onSubmit={handleAddProject} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Project Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newProject.name}
                                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                        className="input-field"
                                        placeholder="e.g. Office Renovation"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Budget (₹) *</label>
                                    <input
                                        type="number"
                                        required
                                        value={newProject.budget}
                                        onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                                        className="input-field"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                                    <textarea
                                        value={newProject.description}
                                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                        className="input-field min-h-[100px]"
                                        placeholder="Brief details about the project..."
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="btn-primary flex-1"
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Project'}
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

            {/* Edit Project Modal */}
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

                            <form onSubmit={handleEditProject} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Project Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newProject.name}
                                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                        className="input-field"
                                        placeholder="e.g. Office Renovation"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Budget (₹) *</label>
                                    <input
                                        type="number"
                                        required
                                        value={newProject.budget}
                                        onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                                        className="input-field"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                                    <textarea
                                        value={newProject.description}
                                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                        className="input-field min-h-[100px]"
                                        placeholder="Brief details about the project..."
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

export default Projects;
