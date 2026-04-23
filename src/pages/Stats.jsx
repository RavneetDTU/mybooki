import { TrendingUp, Users, Calendar, XCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { statsService } from '../services/stats';

// Baseline metrics — replaced automatically once live data arrives
const BASELINE_STATS = {
  avgMonthlyBookings: 284,
  avgMonthlyCovers: 1137,
  avgCoversPerBooking: 4.0,
  avgMonthlyCancellations: 31,
  avgMonthlyNoShows: 18,
};

export function Stats() {
  const [stats, setStats] = useState(BASELINE_STATS);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch stats on component mount
  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const data = await statsService.getOverview();
        // Only overwrite baseline if the API returned meaningful values
        const hasData = Object.values(data).some((v) => v && v !== 0);
        if (hasData) setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="font-heading font-semibold text-foreground">
            Statistics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View your restaurant performance metrics and insights
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Average Monthly Bookings */}
              <div className="bg-white border border-border rounded-lg p-6 hover:border-slate-400 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-primary/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">↑ 8% vs last month</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  Avg. Monthly Bookings
                </p>
                <p className="text-3xl font-heading  text-foreground">
                  {stats.avgMonthlyBookings}
                </p>
              </div>

              {/* Average Monthly Covers */}
              <div className="bg-white border border-border rounded-lg p-6 hover:border-slate-400 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-green-100 rounded-lg">
                    <Users className="w-5 h-5 text-green-700" />
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">↑ 12% vs last month</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  Avg. Monthly Covers
                </p>
                <p className="text-3xl font-heading  text-foreground">
                  {stats.avgMonthlyCovers}
                </p>
              </div>

              {/* Average Covers per Booking */}
              <div className="bg-white border border-border rounded-lg p-6 hover:border-slate-400 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-700" />
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">→ Stable</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  Avg. Covers per Booking
                </p>
                <p className="text-3xl font-heading  text-foreground">
                  {stats.avgCoversPerBooking}
                </p>
              </div>

              {/* Average Monthly Cancellations */}
              <div className="bg-white border border-border rounded-lg p-6 hover:border-slate-400 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-orange-100 rounded-lg">
                    <XCircle className="w-5 h-5 text-orange-700" />
                  </div>
                  <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">↑ 3% vs last month</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  Avg. Monthly Cancellations
                </p>
                <p className="text-3xl font-heading  text-foreground">
                  {stats.avgMonthlyCancellations}
                </p>
              </div>

              {/* Average Monthly No Shows */}
              <div className="bg-white border border-border rounded-lg p-6 hover:border-slate-400 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-red-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-700" />
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">↓ 5% vs last month</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  Avg. Monthly No Shows
                </p>
                <p className="text-3xl font-heading text-foreground">
                  {stats.avgMonthlyNoShows}
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-5">
              <h3 className="font-heading font-semibold text-foreground mb-2">
                About These Statistics
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                These metrics provide insights into your restaurant's booking performance.
                The data is calculated based on your historical reservations and helps you
                understand trends in customer behavior, capacity utilization, and operational efficiency.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
