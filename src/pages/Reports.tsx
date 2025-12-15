import { useState } from 'react';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { Download, FileSpreadsheet, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const Reports = () => {
  const { expenses, vendors } = useAppSelector((state) => state.expense);
  const [dateRange, setDateRange] = useState<'monthly' | 'custom'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter expenses based on date range
  const getFilteredExpenses = () => {
    if (dateRange === 'monthly') {
      return expenses.filter(exp => exp.date.startsWith(selectedMonth));
    } else if (startDate && endDate) {
      return expenses.filter(exp => exp.date >= startDate && exp.date <= endDate);
    }
    return expenses;
  };

  const filteredExpenses = getFilteredExpenses();
  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.actualAmount, 0);
  const paidAmount = filteredExpenses.reduce((sum, exp) => sum + exp.paidAmount, 0);
  const pendingAmount = totalAmount - paidAmount;

  const handleDownloadExcel = () => {
    // In production, this would generate actual Excel file
    toast.success('Excel report download initiated');
  };

  const handleDownloadPDF = () => {
    // In production, this would generate actual PDF file
    toast.success('PDF report download initiated');
  };

  // Vendor summary
  const vendorSummary = vendors.map(vendor => {
    const vendorExpenses = filteredExpenses.filter(exp => exp.vendorId === vendor.id);
    return {
      ...vendor,
      total: vendorExpenses.reduce((sum, exp) => sum + exp.actualAmount, 0),
      paid: vendorExpenses.reduce((sum, exp) => sum + exp.paidAmount, 0),
      count: vendorExpenses.length,
    };
  }).filter(v => v.count > 0);

  return (
    <div className="animate-fade-in">
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
              onClick={() => setDateRange('monthly')}
              className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                dateRange === 'monthly' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setDateRange('custom')}
              className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                dateRange === 'custom' 
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
              />
              <span className="text-muted-foreground hidden sm:block">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field w-full sm:w-auto"
                placeholder="End Date"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground mb-2">Total Expenses</p>
          <p className="text-xl sm:text-2xl font-bold text-foreground">${totalAmount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{filteredExpenses.length} transactions</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground mb-2">Paid Amount</p>
          <p className="text-xl sm:text-2xl font-bold text-success">${paidAmount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{filteredExpenses.filter(e => e.status === 'paid').length} fully paid</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground mb-2">Pending Amount</p>
          <p className="text-xl sm:text-2xl font-bold text-warning">${pendingAmount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{filteredExpenses.filter(e => e.status === 'pending').length} pending</p>
        </div>
      </div>

      {/* Vendor Summary */}
      <div className="card-elevated p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="section-title">Vendor Summary</h2>
        <div className="space-y-3 sm:space-y-4">
          {vendorSummary.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No vendor data for selected period</p>
          ) : (
            vendorSummary.map((vendor) => (
              <div key={vendor.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg gap-2">
                <div>
                  <p className="font-medium text-foreground">{vendor.name}</p>
                  <p className="text-sm text-muted-foreground">{vendor.count} transactions</p>
                </div>
                <div className="flex gap-4 sm:text-right">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold text-foreground">${vendor.total.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="font-semibold text-success">${vendor.paid.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
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
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Reason</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Actual</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Paid</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No transactions found for selected period
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="table-row-hover border-b border-border last:border-0">
                    <td className="py-4 px-6 text-sm text-muted-foreground">{expense.date}</td>
                    <td className="py-4 px-6 text-sm font-medium text-foreground">{expense.vendorName}</td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">{expense.reason}</td>
                    <td className="py-4 px-6 text-sm font-semibold text-foreground">${expense.actualAmount.toLocaleString()}</td>
                    <td className="py-4 px-6 text-sm font-semibold text-foreground">${expense.paidAmount.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        expense.status === 'paid' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-warning/10 text-warning'
                      }`}>
                        {expense.status === 'paid' ? 'Paid' : 'Pending'}
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
            <div key={expense.id} className="card-elevated p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-foreground">{expense.vendorName}</p>
                  <p className="text-sm text-muted-foreground">{expense.reason}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  expense.status === 'paid' 
                    ? 'bg-success/10 text-success' 
                    : 'bg-warning/10 text-warning'
                }`}>
                  {expense.status === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Actual</p>
                  <p className="font-semibold text-foreground">${expense.actualAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Paid</p>
                  <p className="font-semibold text-foreground">${expense.paidAmount.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{expense.date}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reports;
