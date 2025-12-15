import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  PieChart, 
  FileText, 
  Shield, 
  ArrowRight,
  DollarSign,
  Users,
  BarChart3
} from 'lucide-react';

const Landing = () => {
  const monthlyData = [
    { month: 'Jan', amount: 24500 },
    { month: 'Feb', amount: 31200 },
    { month: 'Mar', amount: 28700 },
    { month: 'Apr', amount: 35100 },
    { month: 'May', amount: 29800 },
    { month: 'Jun', amount: 42300 },
  ];

  const vendorData = [
    { name: 'Tech Solutions', percentage: 35, color: 'bg-primary' },
    { name: 'Office Supplies', percentage: 20, color: 'bg-success' },
    { name: 'Cloud Services', percentage: 25, color: 'bg-warning' },
    { name: 'Marketing', percentage: 20, color: 'bg-chart-4' },
  ];

  const recentTransactions = [
    { vendor: 'Tech Solutions Inc', amount: 5400, date: 'Jan 15, 2024', status: 'Paid' },
    { vendor: 'Office Supplies Co', amount: 1250, date: 'Jan 12, 2024', status: 'Paid' },
    { vendor: 'Cloud Services Ltd', amount: 3200, date: 'Jan 10, 2024', status: 'Pending' },
  ];

  const maxAmount = Math.max(...monthlyData.map(d => d.amount));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">ExpenseFlow</span>
          </div>
          <Link to="/login" className="btn-primary">
            Sign In
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Streamline Your Expense & Payout Management
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              A comprehensive platform to track expenses, manage vendor payouts, and generate detailed financial reports with enterprise-grade security.
            </p>
            <Link to="/login" className="btn-primary text-base px-8 py-3">
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </motion.div>

          {/* Feature Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid md:grid-cols-4 gap-6 mb-20"
          >
            {[
              { icon: TrendingUp, title: 'Real-time Tracking', desc: 'Monitor expenses as they happen' },
              { icon: PieChart, title: 'Visual Analytics', desc: 'Understand spending patterns' },
              { icon: FileText, title: 'Detailed Reports', desc: 'Export to Excel or PDF' },
              { icon: Shield, title: 'Secure Access', desc: 'Enterprise-grade security' },
            ].map((feature, index) => (
              <div key={index} className="stat-card text-center">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </motion.div>

          {/* Demo Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="card-elevated p-8"
          >
            <div className="flex items-center gap-2 mb-8">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Dashboard Preview</h2>
              <span className="ml-2 px-2 py-0.5 bg-accent text-accent-foreground text-xs font-medium rounded">Demo</span>
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Total Expenses</span>
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">$191,600</p>
                <span className="text-xs text-success">+12.5% from last month</span>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Active Vendors</span>
                  <Users className="w-5 h-5 text-success" />
                </div>
                <p className="text-2xl font-bold text-foreground">24</p>
                <span className="text-xs text-muted-foreground">4 new this month</span>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Pending Payouts</span>
                  <TrendingUp className="w-5 h-5 text-warning" />
                </div>
                <p className="text-2xl font-bold text-foreground">$12,450</p>
                <span className="text-xs text-muted-foreground">5 transactions</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Monthly Trends Chart */}
              <div>
                <h3 className="section-title">Monthly Expense Trends</h3>
                <div className="flex items-end gap-4 h-48">
                  {monthlyData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-primary/80 rounded-t-md transition-all duration-300 hover:bg-primary"
                        style={{ height: `${(data.amount / maxAmount) * 100}%` }}
                      />
                      <span className="text-xs text-muted-foreground mt-2">{data.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vendor Distribution */}
              <div>
                <h3 className="section-title">Vendor-wise Distribution</h3>
                <div className="space-y-4">
                  {vendorData.map((vendor, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground">{vendor.name}</span>
                        <span className="text-muted-foreground">{vendor.percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${vendor.color} rounded-full transition-all duration-500`}
                          style={{ width: `${vendor.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="mt-8">
              <h3 className="section-title">Recent Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vendor</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx, index) => (
                      <tr key={index} className="table-row-hover border-b border-border last:border-0">
                        <td className="py-3 px-4 text-sm text-foreground">{tx.vendor}</td>
                        <td className="py-3 px-4 text-sm font-medium text-foreground">${tx.amount.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{tx.date}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            tx.status === 'Paid' 
                              ? 'bg-success/10 text-success' 
                              : 'bg-warning/10 text-warning'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2024 ExpenseFlow. Secure Expense & Payout Management.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
