import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { fetchVendorById, fetchBankDetails, deleteBankDetail } from '@/store/slices/vendorSlice';
import {
    ArrowLeft,
    Store,
    Phone,
    MapPin,
    CreditCard,
    Building2,
    User,
    Globe,
    CheckCircle2,
    XCircle,
    Plus,
    Edit2,
    Trash2,
    Loader2,
    Calendar
} from 'lucide-react';
import { toast } from 'sonner';

const VendorDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { currentVendor, selectedVendorBankDetails, isLoading, bankDetailsLoading } = useAppSelector((state) => state.vendor);

    useEffect(() => {
        if (id) {
            const vendorId = parseInt(id);
            dispatch(fetchVendorById(vendorId));
            dispatch(fetchBankDetails(vendorId));
        }
    }, [dispatch, id]);

    const handleDeleteBank = async (bankId: number) => {
        if (window.confirm('Are you sure you want to deactivate this bank account?')) {
            try {
                await dispatch(deleteBankDetail(bankId)).unwrap();
                toast.success('Bank account deactivated successfully');
            } catch (err: any) {
                toast.error(err || 'Failed to delete bank detail');
            }
        }
    };

    if (isLoading && !currentVendor) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!currentVendor) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-foreground">Vendor not found</h2>
                <button onClick={() => navigate('/vendors')} className="btn-ghost mt-4">
                    Back to Vendors
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
                        onClick={() => navigate('/vendors')}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            {currentVendor.name}
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-success/10 text-success">
                                Active
                            </span>
                        </h1>
                        <p className="text-muted-foreground mt-1">Vendor ID: #{currentVendor.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/vendors/edit/${currentVendor.id}`)}
                        className="btn-primary"
                    >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Vendor
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card-elevated p-6 space-y-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                            <Store className="w-5 h-5 text-primary" />
                            Basic Information
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Contact Number</p>
                                    <p className="text-sm font-medium text-foreground">{currentVendor.contact_number}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Address</p>
                                    <p className="text-sm font-medium text-foreground leading-relaxed">
                                        {currentVendor.address || 'No address provided'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Registered On</p>
                                    <p className="text-sm font-medium text-foreground">
                                        {currentVendor.created_at ? new Date(currentVendor.created_at).toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric'
                                        }) : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Bank Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                            <CreditCard className="w-5 h-5 text-primary" />
                            Bank Accounts
                        </h3>
                        {/* We can add a button here to add more bank accounts if needed in future */}
                    </div>

                    {bankDetailsLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : selectedVendorBankDetails.length === 0 ? (
                        <div className="card-elevated p-12 text-center border-dashed border-2 border-border bg-muted/30">
                            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <p className="text-muted-foreground">No bank accounts registered for this vendor</p>
                            <button
                                onClick={() => navigate(`/vendors/edit/${currentVendor.id}`)}
                                className="btn-ghost mt-4"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Bank Account
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {selectedVendorBankDetails.map((bank) => (
                                <div key={bank.id} className={`card-elevated p-6 relative overflow-hidden ${!bank.is_active ? 'opacity-60' : ''}`}>
                                    {!bank.is_active && (
                                        <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />
                                    )}
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                            <Building2 className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {bank.is_active ? (
                                                <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-md bg-success/10 text-success flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Active
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-md bg-destructive/10 text-destructive flex items-center gap-1">
                                                    <XCircle className="w-3 h-3" /> Inactive
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Account Holder</p>
                                            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                <User className="w-3.5 h-3.5 text-muted-foreground" />
                                                {bank.account_holder_name}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Bank Name</p>
                                                <p className="text-sm font-medium text-foreground">{bank.bank_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Account Type</p>
                                                <p className="text-sm font-medium text-foreground">{bank.account_type}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Account Number</p>
                                            <p className="text-base font-mono font-bold text-foreground tracking-wider">
                                                {bank.account_number}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">IFSC Code</p>
                                                <p className="text-sm font-medium text-foreground">{bank.ifsc_code}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Branch</p>
                                                <p className="text-sm font-medium text-foreground">{bank.branch_name || '-'}</p>
                                            </div>
                                        </div>

                                        {bank.upi_id && (
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">UPI ID</p>
                                                <p className="text-sm font-medium text-primary flex items-center gap-2">
                                                    <Globe className="w-3.5 h-3.5" />
                                                    {bank.upi_id}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-border flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => navigate(`/vendors/edit/${currentVendor.id}`)}
                                            className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                                            title="Edit Details"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        {bank.is_active && (
                                            <button
                                                onClick={() => handleDeleteBank(bank.id)}
                                                className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"
                                                title="Deactivate Account"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorDetails;
