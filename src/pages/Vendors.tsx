import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { fetchVendors, deleteVendor } from '@/store/slices/vendorSlice';
import { Plus, Loader2, Store, Phone, MapPin, Search, Edit2, Trash2, CreditCard, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const Vendors = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { vendors, isLoading } = useAppSelector((state) => state.vendor);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        dispatch(fetchVendors());
    }, [dispatch]);

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this vendor?')) {
            try {
                await dispatch(deleteVendor(id)).unwrap();
                toast.success('Vendor deleted successfully');
            } catch (err: any) {
                toast.error(err || 'Failed to delete vendor');
            }
        }
    };

    const filteredVendors = vendors.filter(v =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.contact_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Vendors</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your business vendors and their bank accounts</p>
                </div>
                <button
                    onClick={() => navigate('/vendors/add')}
                    className="btn-primary w-full sm:w-auto"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Vendor
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search vendors by name or contact..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-10 w-full max-w-md"
                />
            </div>

            {/* Vendors Table - Desktop */}
            <div className="card-elevated overflow-hidden hidden md:block">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Vendor Name</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Contact</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Address</th>
                                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
                                <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                    </td>
                                </tr>
                            ) : filteredVendors.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                        No vendors found
                                    </td>
                                </tr>
                            ) : (
                                filteredVendors.map((vendor) => (
                                    <tr key={vendor.id} className="table-row-hover border-b border-border last:border-0">
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => navigate(`/vendors/${vendor.id}`)}
                                                className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
                                            >
                                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                    <Store className="w-4 h-4 text-primary" />
                                                </div>
                                                <span className="text-sm font-medium text-foreground hover:text-primary transition-colors">{vendor.name}</span>
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3 h-3" />
                                                {vendor.contact_number}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-muted-foreground max-w-xs truncate">
                                            {vendor.address || '-'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-success/10 text-success">
                                                Active
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/vendors/edit/${vendor.id}`)}
                                                    className="p-2 hover:bg-muted rounded-lg transition-colors text-primary"
                                                    title="Edit Vendor & Bank Details"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(vendor.id)}
                                                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Vendors Cards - Mobile */}
            <div className="md:hidden space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="card-elevated p-8 text-center text-muted-foreground">
                        No vendors found
                    </div>
                ) : (
                    filteredVendors.map((vendor) => (
                        <div key={vendor.id} className="card-elevated p-4 space-y-4">
                            <div className="flex items-start justify-between">
                                <button
                                    onClick={() => navigate(`/vendors/${vendor.id}`)}
                                    className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                                >
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <Store className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground hover:text-primary transition-colors">{vendor.name}</h3>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {vendor.contact_number}
                                        </p>
                                    </div>
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate(`/vendors/edit/${vendor.id}`)}
                                        className="p-2 hover:bg-muted rounded-lg text-primary"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(vendor.id)}
                                        className="p-2 hover:bg-destructive/10 rounded-lg text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 pt-3 border-t border-border">
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <p className="text-sm text-muted-foreground">{vendor.address || 'No address provided'}</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-primary font-medium">
                                    <CreditCard className="w-4 h-4" />
                                    Click edit to manage bank accounts
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-8 p-4 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Bank Details Management</p>
                    <p>Bank details are now managed separately for each vendor. You can add or update bank accounts by clicking the edit button on any vendor.</p>
                </div>
            </div>
        </div>
    );
};

export default Vendors;
