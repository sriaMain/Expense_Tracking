import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import {
    fetchVendors,
    addVendor,
    updateVendor,
    fetchBankDetails,
    addBankDetail,
    updateBankDetail,
    BankDetail
} from '@/store/slices/vendorSlice';
import { ArrowLeft, Save, Loader2, Store, Phone, MapPin, Building2, CreditCard, User, Globe, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const AddVendor = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get('redirect');
    const isEditing = !!id;
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { vendors, selectedVendorBankDetails, isLoading, bankDetailsLoading } = useAppSelector((state) => state.vendor);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [vendorData, setVendorData] = useState({
        name: '',
        address: '',
        contact_number: '',
    });

    const [bankData, setBankData] = useState({
        bank_name: '',
        account_holder_name: '',
        account_number: '',
        ifsc_code: '',
        account_type: 'CURRENT' as 'CURRENT' | 'SAVINGS',
        branch_name: '',
        upi_id: '',
        is_active: true,
    });

    const [existingBankDetailId, setExistingBankDetailId] = useState<number | null>(null);

    useEffect(() => {
        if (isEditing && vendors.length === 0) {
            dispatch(fetchVendors());
        }
    }, [dispatch, isEditing, vendors.length]);

    useEffect(() => {
        if (isEditing && vendors.length > 0) {
            const vendor = vendors.find(v => v.id === parseInt(id!));
            if (vendor) {
                setVendorData({
                    name: vendor.name,
                    address: vendor.address,
                    contact_number: vendor.contact_number,
                });
                dispatch(fetchBankDetails(vendor.id));
            }
        }
    }, [isEditing, vendors, id, dispatch]);

    useEffect(() => {
        if (isEditing && selectedVendorBankDetails.length > 0) {
            const primaryBank = selectedVendorBankDetails[0]; // For now, we just edit the first one
            setExistingBankDetailId(primaryBank.id);
            setBankData({
                bank_name: primaryBank.bank_name,
                account_holder_name: primaryBank.account_holder_name,
                account_number: primaryBank.account_number,
                ifsc_code: primaryBank.ifsc_code,
                account_type: primaryBank.account_type,
                branch_name: primaryBank.branch_name || '',
                upi_id: primaryBank.upi_id || '',
                is_active: primaryBank.is_active,
            });
        }
    }, [selectedVendorBankDetails, isEditing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vendorData.name || !vendorData.contact_number) {
            toast.error('Vendor Name and Contact are required');
            return;
        }

        if (!bankData.bank_name || !bankData.account_holder_name || !bankData.account_number || !bankData.ifsc_code) {
            toast.error('Bank Name, Holder Name, Account Number and IFSC are required');
            return;
        }

        setIsSubmitting(true);
        try {
            let vendorId = parseInt(id!);

            if (isEditing) {
                // Always send both vendor and bank details to ensure full payload is sent
                // Include ID in vendorData for a complete PUT payload
                await dispatch(updateVendor({
                    id: vendorId,
                    vendorData: { ...vendorData, id: vendorId }
                })).unwrap();

                if (existingBankDetailId) {
                    // Include both bank detail ID and vendor ID in bankData
                    await dispatch(updateBankDetail({
                        id: existingBankDetailId,
                        bankData: { ...bankData, id: existingBankDetailId, vendor: vendorId }
                    })).unwrap();
                } else {
                    await dispatch(addBankDetail({ vendorId, bankData })).unwrap();
                }
                toast.success('Vendor and bank details updated successfully');
            } else {
                const newVendor = await dispatch(addVendor(vendorData)).unwrap();
                vendorId = newVendor.id;
                await dispatch(addBankDetail({ vendorId, bankData })).unwrap();
                toast.success('Vendor and bank details added successfully');
            }

            if (redirect) {
                const separator = redirect.includes('?') ? '&' : '?';
                navigate(`${redirect}${separator}vendor_id=${vendorId}`);
            } else {
                navigate('/vendors');
            }
        } catch (err: any) {
            const errorMsg = typeof err === 'object' ? Object.entries(err).map(([k, v]) => `${k}: ${v}`).join(', ') : err;
            toast.error(errorMsg || 'Failed to save vendor details');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-fade-in pb-20">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(redirect || '/vendors')}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {isEditing ? 'Edit Vendor' : 'Add New Vendor'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isEditing ? 'Update vendor information and bank details' : 'Register a new vendor with bank details'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Basic Information */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="card-elevated p-6 space-y-6">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                                <Store className="w-5 h-5 text-primary" />
                                Basic Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Vendor Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={vendorData.name}
                                        onChange={(e) => setVendorData({ ...vendorData, name: e.target.value })}
                                        className="input-field"
                                        placeholder="Enter vendor name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Contact Number *</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            required
                                            value={vendorData.contact_number}
                                            onChange={(e) => setVendorData({ ...vendorData, contact_number: e.target.value })}
                                            className="input-field pl-10"
                                            placeholder="Enter contact number"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-4 w-4 h-4 text-muted-foreground" />
                                        <textarea
                                            value={vendorData.address}
                                            onChange={(e) => setVendorData({ ...vendorData, address: e.target.value })}
                                            className="input-field pl-10 min-h-[100px]"
                                            placeholder="Enter full address"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
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
                                        {isEditing ? 'Update Vendor' : 'Save Vendor'}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(redirect || '/vendors')}
                                className="btn-ghost px-8"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                    {/* Bank Details */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="card-elevated p-6 space-y-6 border-l-4 border-primary">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                                <CreditCard className="w-5 h-5 text-primary" />
                                Bank Details
                            </h3>

                            {bankDetailsLoading && <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Account Holder Name *</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            required
                                            value={bankData.account_holder_name}
                                            onChange={(e) => setBankData({ ...bankData, account_holder_name: e.target.value })}
                                            className="input-field pl-10"
                                            placeholder="Name as per bank records"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Bank Name *</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            required
                                            value={bankData.bank_name}
                                            onChange={(e) => setBankData({ ...bankData, bank_name: e.target.value })}
                                            className="input-field pl-10"
                                            placeholder="e.g. HDFC Bank"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1.5">Account Type *</label>
                                        <select
                                            value={bankData.account_type}
                                            onChange={(e) => setBankData({ ...bankData, account_type: e.target.value as 'CURRENT' | 'SAVINGS' })}
                                            className="input-field"
                                        >
                                            <option value="CURRENT">Current</option>
                                            <option value="SAVINGS">Savings</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1.5">IFSC Code *</label>
                                        <input
                                            type="text"
                                            required
                                            value={bankData.ifsc_code}
                                            onChange={(e) => setBankData({ ...bankData, ifsc_code: e.target.value.toUpperCase() })}
                                            className="input-field"
                                            placeholder="IFSC Code"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Account Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={bankData.account_number}
                                        onChange={(e) => setBankData({ ...bankData, account_number: e.target.value })}
                                        className="input-field"
                                        placeholder="Enter account number"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Branch Name</label>
                                    <input
                                        type="text"
                                        value={bankData.branch_name}
                                        onChange={(e) => setBankData({ ...bankData, branch_name: e.target.value })}
                                        className="input-field"
                                        placeholder="Enter branch name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">UPI ID (Optional)</label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={bankData.upi_id}
                                            onChange={(e) => setBankData({ ...bankData, upi_id: e.target.value })}
                                            className="input-field pl-10"
                                            placeholder="e.g. vendor@upi"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={bankData.is_active}
                                        onChange={(e) => setBankData({ ...bankData, is_active: e.target.checked })}
                                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                    />
                                    <label htmlFor="is_active" className="text-sm font-medium text-foreground flex items-center gap-1">
                                        Active Bank Account
                                        <CheckCircle2 className="w-3 h-3 text-success" />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddVendor;
