import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { fetchAllExpensesAndRecurring } from '@/store/slices/expenseSlice';
import { fetchVendors } from '@/store/slices/vendorSlice';
import { Download, FileSpreadsheet, FileText, Calendar, Loader2, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axiosInstance';

const Reports = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { expenses, isLoading: expensesLoading } = useAppSelector((state) => state.expense);
  const { vendors, isLoading: vendorsLoading } = useAppSelector((state) => state.vendor);

  const [dateRange, setDateRange] = useState<'monthly' | 'custom' | 'today'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    dispatch(fetchAllExpensesAndRecurring());
    dispatch(fetchVendors());
  }, [dispatch]);

  // Helper to get vendor name
  const getVendorName = (id: number | string) => {
    if (typeof id === 'string') return id;
    const vendor = vendors.find(v => v.id === id);
    return vendor?.name || 'Unknown Vendor';
  };

  // Filter expenses based on date range
  const getFilteredExpenses = () => {
    if (dateRange === 'monthly') {
      return expenses.filter(exp => {
        const date = exp.created_at || exp.updated_at || '';
        return date.startsWith(selectedMonth);
      });
    } else if (startDate && endDate) {
      return expenses.filter(exp => {
        const fullDate = exp.created_at || exp.updated_at || '';
        const dateOnly = fullDate.split('T')[0];
        return dateOnly >= startDate && dateOnly <= endDate;
      });
    }
    return expenses;
  };

  const filteredExpenses = getFilteredExpenses();
  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount_requested), 0);
  const paidAmount = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount_paid), 0);
  const pendingAmount = totalAmount - paidAmount;



  const downloadReport = async (type: 'excel' | 'pdf') => {
    if (dateRange === 'monthly' && !selectedMonth) {
      toast.error('Please select a month');
      return;
    }
    if (dateRange !== 'monthly' && (!startDate || !endDate)) {
      toast.error('Please select a valid date range');
      return;
    }

    const toastId = toast.loading(`Generating ${type.toUpperCase()} report...`);

    try {
      const endpoint = type === 'excel' ? 'reports/excel/' : 'reports/pdf/';
      let response;

      if (dateRange === 'monthly') {
        const [year, month] = selectedMonth.split('-');
        response = await axiosInstance.get(endpoint, {
          params: {
            period: 'monthly',
            year,
            month: parseInt(month).toString()
          },
          responseType: 'blob'
        });
      } else {
        response = await axiosInstance.post(endpoint, {
          period: 'weekly',
          week_start: startDate,
          week_end: endDate
        }, {
          responseType: 'blob'
        });
      }

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      let filename = `expense_report_${type}`;
      if (dateRange === 'monthly') {
        filename += `_${selectedMonth}`;
      } else {
        filename += `_${startDate}_to_${endDate}`;
      }
      const extension = type === 'excel' ? 'xlsx' : 'pdf';

      link.setAttribute('download', `${filename}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      toast.success(`${type.toUpperCase()} report downloaded successfully`, { id: toastId });
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${type.toUpperCase()} report`, { id: toastId });
    }
  };

  const handleDownloadExcel = () => downloadReport('excel');
  const handleDownloadPDF = () => downloadReport('pdf');

  // Vendor summary
  const vendorSummary = vendors.map(vendor => {
    const vendorExpenses = filteredExpenses.filter(exp => exp.vendor === vendor.id);
    return {
      id: vendor.id,
      name: vendor.name || 'Unknown',
      total: vendorExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount_requested), 0),
      paid: vendorExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount_paid), 0),
      count: vendorExpenses.length,
    };
  }).filter(v => v.count > 0);

  if (expensesLoading || vendorsLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Generate and download expense reports</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDownloadExcel} className="btn-secondary flex-1 sm:flex-none">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </button>
          <button onClick={handleDownloadPDF} className="btn-primary flex-1 sm:flex-none">
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </button>
        </div>
      </div>

      {/* Date Filters */}
      <div className="card-elevated p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="section-title flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Date Range
        </h2>

        <div className="flex flex-wrap gap-3 sm:gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setDateRange('today');
                const today = new Date().toISOString().split('T')[0];
                setStartDate(today);
                setEndDate(today);
              }}
              className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-colors ${dateRange === 'today'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('monthly')}
              className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-colors ${dateRange === 'monthly'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setDateRange('custom')}
              className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-colors ${dateRange === 'custom'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
            >
              Custom
            </button>
          </div>

          {dateRange === 'monthly' ? (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-field w-full sm:w-auto"
            />
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center w-full sm:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field w-full sm:w-auto"
                placeholder="Start Date"
                disabled={dateRange === 'today'}
              />
              <span className="text-muted-foreground hidden sm:block">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field w-full sm:w-auto"
                placeholder="End Date"
                disabled={dateRange === 'today'}
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground mb-2">Total Expenses</p>
          <p className="text-xl sm:text-2xl font-bold text-foreground">₹{totalAmount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{filteredExpenses.length} transactions</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground mb-2">Paid Amount</p>
          <p className="text-xl sm:text-2xl font-bold text-success">₹{paidAmount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{filteredExpenses.filter(e => e.status === 'PAID').length} fully paid</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground mb-2">Pending Amount</p>
          <p className="text-xl sm:text-2xl font-bold text-warning">₹{pendingAmount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{filteredExpenses.filter(e => e.status !== 'PAID').length} pending/partial</p>
        </div>
      </div>

      {/* Transaction List - Desktop */}
      <div className="card-elevated overflow-hidden hidden md:block">
        <div className="p-4 sm:p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Transaction Details</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Vendor</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Requested</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Paid</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    No transactions found for selected period
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    onClick={() => navigate(`/expenses/${expense.id}`)}
                    className="table-row-hover border-b border-border last:border-0 cursor-pointer"
                  >
                    <td className="py-4 px-6 text-sm text-muted-foreground">{expense.created_at?.split('T')[0]}</td>
                    <td className="py-4 px-6 text-sm font-medium text-foreground">{getVendorName(expense.vendor)}</td>
                    <td className="py-4 px-6 text-sm font-semibold text-foreground">₹{parseFloat(expense.amount_requested).toLocaleString()}</td>
                    <td className="py-4 px-6 text-sm font-semibold text-foreground">₹{parseFloat(expense.amount_paid).toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${expense.status === 'PAID'
                        ? 'bg-success/10 text-success'
                        : (expense.status === 'PARTIAL' || expense.status === 'PARTIAL_PAID' || expense.status === 'PARTIALLY_PAID')
                          ? 'bg-warning/10 text-warning'
                          : 'bg-destructive/10 text-destructive'
                        }`}>
                        {expense.status === 'PARTIAL_PAID' || expense.status === 'PARTIALLY_PAID' ? 'PARTIAL' : expense.status === 'UNPAID' ? 'PENDING' : expense.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction List - Mobile */}
      <div className="md:hidden space-y-3">
        <h2 className="section-title">Transaction Details</h2>
        {filteredExpenses.length === 0 ? (
          <div className="card-elevated p-8 text-center text-muted-foreground">
            No transactions found for selected period
          </div>
        ) : (
          filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              onClick={() => navigate(`/expenses/${expense.id}`)}
              className="card-elevated p-4 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-foreground">{getVendorName(expense.vendor)}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${expense.status === 'PAID'
                  ? 'bg-success/10 text-success'
                  : (expense.status === 'PARTIAL' || expense.status === 'PARTIAL_PAID' || expense.status === 'PARTIALLY_PAID')
                    ? 'bg-warning/10 text-warning'
                    : 'bg-destructive/10 text-destructive'
                  }`}>
                  {expense.status === 'PARTIAL_PAID' || expense.status === 'PARTIALLY_PAID' ? 'PARTIAL' : expense.status === 'UNPAID' ? 'PENDING' : expense.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Requested</p>
                  <p className="font-semibold text-foreground">₹{parseFloat(expense.amount_requested).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Paid</p>
                  <p className="font-semibold text-foreground">₹{parseFloat(expense.amount_paid).toLocaleString()}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{expense.created_at?.split('T')[0]}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reports;
