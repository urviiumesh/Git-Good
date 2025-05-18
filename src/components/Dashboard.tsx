import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  
} from 'recharts';
import { ChatSection } from '@/components/ChatSection';
import Papa from 'papaparse';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { TrendingUp, MapPin, Clock, Award, ChevronDown, DollarSign, Megaphone, GraduationCap, Code, ClipboardCheck, AlertCircle, Users } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock data for visualizations
const deliveryData = [
  { city: 'Mumbai', orders: 1200, avgTime: 35 },
  { city: 'Delhi', orders: 980, avgTime: 42 },
  { city: 'Bangalore', orders: 850, avgTime: 38 },
  { city: 'Chennai', orders: 720, avgTime: 45 },
  { city: 'Kolkata', orders: 650, avgTime: 40 },
];

const cashflowData = [
  { month: 'Jan', revenue: 4500000, expenses: 3200000 },
  { month: 'Feb', revenue: 5200000, expenses: 3800000 },
  { month: 'Mar', revenue: 4800000, expenses: 3500000 },
  { month: 'Apr', revenue: 5500000, expenses: 4000000 },
  { month: 'May', revenue: 6000000, expenses: 4200000 },
];

const engagementData = [
  { platform: 'Instagram', engagement: 45 },
  { platform: 'Facebook', engagement: 30 },
  { platform: 'Twitter', engagement: 15 },
  { platform: 'LinkedIn', engagement: 10 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Delivery Heatmap mock data
const deliveryDataToday = [
  { city: 'Mumbai', orders: 1200, avgTime: 35 },
  { city: 'Delhi', orders: 980, avgTime: 42 },
  { city: 'Bangalore', orders: 850, avgTime: 38 },
  { city: 'Chennai', orders: 720, avgTime: 45 },
  { city: 'Kolkata', orders: 650, avgTime: 40 },
];
const deliveryDataWeek = [
  { city: 'Mumbai', orders: 8200, avgTime: 37 },
  { city: 'Delhi', orders: 7100, avgTime: 41 },
  { city: 'Bangalore', orders: 6900, avgTime: 39 },
  { city: 'Chennai', orders: 6100, avgTime: 44 },
  { city: 'Kolkata', orders: 5800, avgTime: 42 },
];

// CPO Components
const DeliveryHeatmap = () => {
  const [timeRange, setTimeRange] = useState('today');
  const data = timeRange === 'today' ? deliveryDataToday : deliveryDataWeek;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Delivery Heatmap</CardTitle>
            <CardDescription>City-wise live delivery time visualization</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timeRange === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('today')}
            >
              Today
            </Button>
            <Button
              variant={timeRange === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('week')}
            >
              Week
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="city" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="orders" fill="#8884d8" name="Orders" isAnimationActive />
              <Bar yAxisId="right" dataKey="avgTime" fill="#82ca9d" name="Avg Time (min)" isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const OrderSpikeAlert = () => (
  <Alert className="bg-primary/10 border-primary/20">
    <Icons.alertTriangle className="h-4 w-4" />
    <AlertTitle>Order Spike Detected!</AlertTitle>
    <AlertDescription>
      Mumbai showing 45% growth in orders in the last hour
    </AlertDescription>
  </Alert>
);

const WarehouseKPI = () => (
  <Card>
    <CardHeader>
      <CardTitle>Warehouse KPIs</CardTitle>
      <CardDescription>Efficiency metrics and throughput</CardDescription>
    </CardHeader>
    <CardContent className="grid gap-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Efficiency</span>
          <span className="text-primary">92%</span>
        </div>
        <Progress value={92} className="h-2" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Avg Handling Time</span>
          <span className="text-primary">4.2 min</span>
        </div>
        <Progress value={84} className="h-2" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Throughput</span>
          <span className="text-primary">150/hr</span>
        </div>
        <Progress value={75} className="h-2" />
      </div>
    </CardContent>
  </Card>
);

// Software Engineer Components
const ErrorLogStream = () => (
  <Card>
    <CardHeader>
      <CardTitle>Error Log Stream</CardTitle>
      <CardDescription>Live tail of order assignment engine logs</CardDescription>
    </CardHeader>
    <CardContent>
      <ScrollArea className="h-[200px] rounded-md border p-4">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="text-sm font-mono">
              <span className="text-red-500">[ERROR]</span> Order assignment failed for ID: ORD-{i}23
            </div>
          ))}
        </div>
      </ScrollArea>
    </CardContent>
  </Card>
);

const BuildMonitor = () => (
  <Card>
    <CardHeader>
      <CardTitle>Build & Deploy Monitor</CardTitle>
      <CardDescription>CI/CD pipeline status</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Main Branch</span>
          <Badge variant="default">Passing</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span>Staging</span>
          <Badge variant="secondary">In Progress</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span>Production</span>
          <Badge variant="default">Deployed</Badge>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Accounts Components
const CashflowChart = () => {
  const [view, setView] = useState('revenue');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Account Finances</CardTitle>
            <CardDescription>Financial overview</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={view === 'revenue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('revenue')}
            >
              Revenue
            </Button>
            <Button
              variant={view === 'expenses' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('expenses')}
            >
              Expenses
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashflowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey={view === 'revenue' ? 'revenue' : 'expenses'}
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const VendorPayments = () => (
  <Card>
    <CardHeader>
      <CardTitle>Vendor Payments</CardTitle>
      <CardDescription>Pending payouts by category</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {['Restaurants', 'Riders', 'Dark Stores'].map((category) => (
          <div key={category} className="flex items-center justify-between">
            <span>{category}</span>
            <Badge variant="outline">₹{Math.floor(Math.random() * 100000)}</Badge>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);



interface MarketingCampaign {
  campaign_id: string;
  campaign_name: string;
  target_region: string;
  platform: string;
  test_date: string;
  click_through_rate: number;
  conversions: number;
  feedback_score: number;
  status: string;
}

const useMarketingData = () => {
  const [marketingData, setMarketingData] = useState<MarketingCampaign[]>([]);

  useEffect(() => {
    const loadMarketingData = async () => {
      try {
        const response = await fetch('/data/marketing_campaign_testing.csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const typedData = results.data.map((row: any) => ({
              ...row,
              click_through_rate: parseFloat(row.click_through_rate),
              conversions: parseInt(row.conversions),
              feedback_score: parseFloat(row.feedback_score)
            }));
            setMarketingData(typedData);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
          }
        });
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };

    loadMarketingData();
  }, []);

  return marketingData;
};

const MarketingDashboard = () => {
  const marketingData = useMarketingData();
  
  // Process campaign data for analytics
  const metrics = useMemo(() => {
    // Return defaults if no data or invalid data
    if (!marketingData || marketingData.length === 0) {
      return {
        bestFeedback: 0,
        totalConversions: 0,
        avgCTR: 0,
        liveCampaigns: 0
      };
    }

    // Safely calculate best feedback score
    const validFeedbackScores = marketingData
      .map(item => Number(item.feedback_score))
      .filter(score => !isNaN(score));
    
    const bestFeedback = validFeedbackScores.length > 0
      ? Math.max(...validFeedbackScores)
      : 0;

    // Safely calculate total conversions
    const totalConversions = marketingData.reduce((sum, item) => {
      const conversions = Number(item.conversions) || 0;
      return sum + conversions;
    }, 0);

    // Safely calculate average CTR
    const validCTRs = marketingData
      .map(item => Number(item.click_through_rate))
      .filter(rate => !isNaN(rate));
    
    const avgCTR = validCTRs.length > 0
      ? validCTRs.reduce((sum, rate) => sum + rate, 0) / validCTRs.length
      : 0;

    // Count live campaigns
    const liveCampaigns = marketingData.filter(item => 
      item.status === 'Live'
    ).length;

    return {
      bestFeedback,
      totalConversions,
      avgCTR: parseFloat(avgCTR.toFixed(2)), // Format to 2 decimal places
      liveCampaigns
    };
  }, [marketingData]);

  // Get top 4 performing campaigns by conversions
  const topPerformers = useMemo(() => {
    return [...marketingData]
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 4);
  }, [marketingData]);

  return (
    <div className="space-y-6">
      {/* Premium Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="col-span-1"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-950 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {metrics.liveCampaigns}
              </CardTitle>
              <CardDescription className="text-blue-600 dark:text-blue-300 font-medium">
                Active Campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Megaphone className="h-4 w-4 text-blue-500" />
                <p className="text-sm text-blue-600 dark:text-blue-300">Live Campaign Status</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="col-span-1"
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-950 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl font-bold text-green-600 dark:text-green-400">
                {metrics.avgCTR}%
              </CardTitle>
              <CardDescription className="text-green-600 dark:text-green-300 font-medium">
                Average CTR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-sm text-green-600 dark:text-green-300">Click-Through Rate</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="col-span-1"
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-950 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {metrics.totalConversions.toLocaleString()}
              </CardTitle>
              <CardDescription className="text-purple-600 dark:text-purple-300 font-medium">
                Total Conversions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-purple-500" />
                <p className="text-sm text-purple-600 dark:text-purple-300">Campaign Success</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="col-span-1"
        >
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-950 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {metrics.bestFeedback.toFixed(1)}
              </CardTitle>
              <CardDescription className="text-orange-600 dark:text-orange-300 font-medium">
                Best Feedback Score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-orange-500" />
                <p className="text-sm text-orange-600 dark:text-orange-300">Customer Satisfaction</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-2 gap-6">
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="col-span-1"
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>Conversion rates by platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={marketingData.filter(c => c.status === 'Live')}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="platform" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar yAxisId="left" dataKey="click_through_rate" name="CTR (%)" fill="#8884d8" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="conversions" name="Conversions" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="col-span-1"
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Regional Distribution</CardTitle>
              <CardDescription>Campaign performance by region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={marketingData.reduce((acc, curr) => {
                        const existing = acc.find(item => item.region === curr.target_region);
                        if (existing) {
                          existing.value += curr.conversions;
                        } else {
                          acc.push({
                            region: curr.target_region,
                            value: curr.conversions
                          });
                        }
                        return acc;
                      }, []).sort((a, b) => b.value - a.value).slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="region"
                    >
                      {marketingData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value, name) => [`${value} conversions`, `${name}`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Performing Campaigns */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Top Performing Campaigns</CardTitle>
          <CardDescription>Highest converting campaigns across regions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {topPerformers.map((campaign) => (
              <motion.div
                key={campaign.campaign_id}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="p-4 rounded-lg border bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg truncate">{campaign.campaign_name}</h3>
                    <Badge
                      variant={campaign.status === 'Live' ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Platform</span>
                      <span className="font-medium">{campaign.platform}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Region</span>
                      <span className="font-medium">{campaign.target_region}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">CTR</span>
                      <span className="font-medium">{campaign.click_through_rate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Conversions</span>
                      <span className="font-medium">{campaign.conversions}</span>
                    </div>
                    <Progress
                      value={campaign.feedback_score * 10}
                      className="h-2 bg-gradient-to-r from-blue-500 to-purple-500"
                    />
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Feedback Score</span>
                      <span className="font-medium">{campaign.feedback_score}/10</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Intern Components
const InternInventorySection = () => {
  const [inventoryData, setInventoryData] = useState([]);
const [sortBy, setSortBy] = useState('date');
  const [filterStore, setFilterStore] = useState('all');

  useEffect(() => {
    fetch('/data/intern_inventory_logs (1).json')
      .then(response => response.json())
      .then(data => setInventoryData(data));
  }, []);

  const stats = useMemo(() => {
    if (!inventoryData.length) return {
      totalChecked: 0,
      totalDiscrepancies: 0,
      pendingApprovals: 0,
      activeInterns: 0,
      efficiency: 0
    };

    const total = inventoryData.reduce((acc, log) => ({
      totalChecked: acc.totalChecked + log.items_checked,
      totalDiscrepancies: acc.totalDiscrepancies + log.discrepancies_found
    }), { totalChecked: 0, totalDiscrepancies: 0 });

    return {
      totalChecked: total.totalChecked,
      totalDiscrepancies: total.totalDiscrepancies,
      pendingApprovals: inventoryData.filter(log => !log.supervisor_approval).length,
      activeInterns: new Set(inventoryData.map(log => log.reported_by)).size,
      efficiency: ((total.totalChecked - total.totalDiscrepancies) / total.totalChecked * 100).toFixed(1)
    };
  }, [inventoryData]);

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-4 gap-6"
      >
        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-black/20 backdrop-blur-lg border-purple-100 dark:border-purple-900/20">
          <CardHeader className="space-y-1">
            <div className="flex items-center space-x-2">
              <ClipboardCheck className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-xl font-semibold">Total Items Checked</CardTitle>
            </div>
            <CardDescription>Inventory verification progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
              {stats.totalChecked.toLocaleString()}
            </div>
            <Progress value={Math.min((stats.totalChecked / 10000) * 100, 100)} className="mt-4" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-black/20 backdrop-blur-lg border-red-100 dark:border-red-900/20">
          <CardHeader className="space-y-1">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-xl font-semibold">Discrepancies</CardTitle>
            </div>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-600 dark:text-red-400">
              {stats.totalDiscrepancies}
            </div>
            <div className="mt-2 text-sm text-red-600 dark:text-red-400">
              {((stats.totalDiscrepancies / stats.totalChecked) * 100).toFixed(1)}% error rate
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-black/20 backdrop-blur-lg border-amber-100 dark:border-amber-900/20">
          <CardHeader className="space-y-1">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-xl font-semibold">Pending Reviews</CardTitle>
            </div>
            <CardDescription>Awaiting supervisor approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">
              {stats.pendingApprovals}
            </div>
            <Progress value={(stats.pendingApprovals / inventoryData.length) * 100} className="mt-4" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-black/20 backdrop-blur-lg border-green-100 dark:border-green-900/20">
          <CardHeader className="space-y-1">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-500" />
              <CardTitle className="text-xl font-semibold">Team Efficiency</CardTitle>
            </div>
            <CardDescription>Overall performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600 dark:text-green-400">
              {stats.efficiency}%
            </div>
            <Progress value={parseFloat(String(stats.efficiency))} className="mt-4" />
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="backdrop-blur-lg border-slate-200 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Store Performance</CardTitle>
                  <CardDescription>Items checked vs discrepancies by location</CardDescription>
                </div>
                <Select value={filterStore} onValueChange={setFilterStore}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by store" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stores</SelectItem>
                    {Array.from(new Set(inventoryData.map(log => log.store_id))).map(store => (
                      <SelectItem key={store} value={store}>{store}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryData.filter(log => filterStore === 'all' || log.store_id === filterStore)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="store_id" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Bar dataKey="items_checked" fill="#8884d8" name="Items Checked">
                    {inventoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                    ))}
                  </Bar>
                  <Bar dataKey="discrepancies_found" fill="#82ca9d" name="Discrepancies" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="backdrop-blur-lg border-slate-200 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Intern Performance Trends</CardTitle>
                  <CardDescription>Efficiency tracking over time</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={inventoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="date_checked" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="items_checked" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8', r: 4 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="backdrop-blur-lg border-slate-200 dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Inventory Logs</CardTitle>
                <CardDescription>Latest inventory verification activities</CardDescription>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="items">Items Checked</SelectItem>
                  <SelectItem value="discrepancies">Discrepancies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 rounded-tl-lg">Log ID</th>
                    <th className="px-6 py-3">Store</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Items Checked</th>
                    <th className="px-6 py-3">Discrepancies</th>
                    <th className="px-6 py-3">Reported By</th>
                    <th className="px-6 py-3 rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData
                    .sort((a, b) => {
                      switch(sortBy) {
                        case 'date':
                          return new Date(b.date_checked).getTime() - new Date(a.date_checked).getTime();
                        case 'items':
                          return b.items_checked - a.items_checked;
                        case 'discrepancies':
                          return b.discrepancies_found - a.discrepancies_found;
                        default:
                          return 0;
                      }
                    })
                    .slice(0, 5)
                    .map((log) => (
                      <motion.tr 
                        key={log.log_id} 
                        className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td className="px-6 py-4 font-medium">{log.log_id}</td>
                        <td className="px-6 py-4">{log.store_id}</td>
                        <td className="px-6 py-4">{new Date(log.date_checked).toLocaleDateString()}</td>
                        <td className="px-6 py-4">{log.items_checked.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.discrepancies_found > 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
                            {log.discrepancies_found}
                          </span>
                        </td>
                        <td className="px-6 py-4">{log.reported_by.split('@')[0]}</td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant="default"
                            className={`${log.supervisor_approval ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}
                          >
                            {log.supervisor_approval ? "Approved" : "Pending"}
                          </Badge>
                        </td>
                      </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

function InfoCard({ title, row, color }: { title: string, row: any, color: string }) {
  if (!row) return null;
  return (
    <div
      style={{
        border: `2px solid ${color}`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        background: "#fff",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
      className="transition-all duration-200 hover:scale-105 hover:shadow-xl"
    >
      <h2 style={{ color, fontWeight: 700, fontSize: 20 }}>{title}</h2>
      <p>SKU: {row.SKU_ID}</p>
      <p>Region: {row.Region}</p>
      <p>Date: {row.Date}</p>
      <p>Orders: {row.Orders}</p>
      <p>Returns: {row.Returns}</p>
      <p>Delay: {row.Delay_Minutes} min</p>
    </div>
  );
}

function PremiumStatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
      className="flex-1 min-w-[240px] max-w-xs"
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        border: `1px solid ${color}20`,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 12,
        minHeight: 160,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background element */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          background: `${color}10`,
          borderRadius: '50%',
          zIndex: 0,
        }}
      />
      
      <div className="flex items-center gap-3 mb-1 relative z-10">
        {icon && (
          <span
            style={{
              background: `${color}15`,
              borderRadius: 12,
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </span>
        )}
        <span 
          className="text-base font-medium tracking-wide" 
          style={{ color: color || '#1e293b' }}
        >
          {title}
        </span>
      </div>
      
      <div 
        className="text-2xl font-bold tracking-tight" 
        style={{ color: color || '#1e293b' }}
      >
        {value}
      </div>
      
      {subtitle && (
        <div 
          className="text-sm font-medium" 
          style={{ color: `${color}99` }}
        >
          {subtitle}
        </div>
      )}
    </motion.div>
  );
}

function CPOProductPerformance() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [date, setDate] = useState(null);

  // Read CSV on mount
  useEffect(() => {
    fetch('/data/cpo_performance.csv')
      .then((res) => res.text())
      .then((csv) => {
        const parsed = Papa.parse(csv, { header: true, dynamicTyping: true });
        setData(parsed.data);
        setFilteredData(parsed.data);
      });
  }, []);

  // Filter by date
  useEffect(() => {
    if (!date) {
      setFilteredData(data);
    } else {
      const d = date.toISOString().slice(0, 10);
      setFilteredData(data.filter((row) => row.Date === d));
    }
  }, [date, data]);

  // KPI calculations
  const totalOrders = useMemo(() => filteredData.reduce((a, b) => a + (b.Orders || 0), 0), [filteredData]);
  const totalReturns = useMemo(() => filteredData.reduce((a, b) => a + (b.Returns || 0), 0), [filteredData]);
  const avgDelay = useMemo(() => filteredData.length ? (filteredData.reduce((a, b) => a + (b.Delay_Minutes || 0), 0) / filteredData.length).toFixed(1) : 0, [filteredData]);
  const returnRate = useMemo(() => totalOrders ? ((totalReturns / totalOrders) * 100).toFixed(2) : 0, [totalReturns, totalOrders]);

  // Widget calculations
  const bestRegion = useMemo(() => {
    const map = {};
    filteredData.forEach(row => {
      map[row.Region] = (map[row.Region] || 0) + (row.Orders || 0);
    });
    return Object.entries(map).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || '-';
  }, [filteredData]);
  const highestDelay = useMemo(() => {
    if (!filteredData.length) return '-';
    const max = filteredData.reduce((a, b) => (a.Delay_Minutes > b.Delay_Minutes ? a : b));
    return `${max.Delay_Minutes} min (${max.Region})`;
  }, [filteredData]);
  const bestSKU = useMemo(() => {
    if (!filteredData.length) return '-';
    const max = filteredData.reduce((a, b) => (a.Orders > b.Orders ? a : b));
    return `${max.SKU_ID} (${max.Orders})`;
  }, [filteredData]);

  // Filter out undefined regions from pie chart data
  const regionData = useMemo(() => {
    const map = {};
    filteredData.forEach(row => {
      if (row.Region) {  // Only add if Region exists
        map[row.Region] = (map[row.Region] || 0) + (row.Orders || 0);
      }
    });
    return Object.entries(map).map(([region, orders]) => ({ region, orders }));
  }, [filteredData]);

  // Table: only show 10 rows, scrollable if more
  const tableRows = filteredData.slice(0, 10);
  const hasMoreRows = filteredData.length > 10;

  // Find the row with the highest delay
  const highestDelayRow = useMemo(() => {
    if (!filteredData.length) return null;
    return filteredData.reduce((a, b) => (a.Delay_Minutes > b.Delay_Minutes ? a : b));
  }, [filteredData]);

  // Find the row with the best SKU (highest orders)
  const bestSKURow = useMemo(() => {
    if (!filteredData.length) return null;
    return filteredData.reduce((a, b) => (a.Orders > b.Orders ? a : b));
  }, [filteredData]);

  const validData = useMemo(
    () => filteredData.filter(row => row.SKU_ID && row.Region && row.Date),
    [filteredData]
  );

  const bestSKURowValid = useMemo(() => {
    if (!validData.length) return null;
    return validData.reduce((a, b) => (a.Orders > b.Orders ? a : b));
  }, [validData]);

  const highestDelayRowValid = useMemo(() => {
    if (!validData.length) return null;
    return validData.reduce((a, b) => (a.Delay_Minutes > b.Delay_Minutes ? a : b));
  }, [validData]);

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 18 }}
    >
      {/* Order Spike Alert at the top */}
      <OrderSpikeAlert />

      {/* Section Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold">CPO Product Performance</h3>
        <div className="flex flex-wrap gap-4 items-center">
          <span className="font-semibold mr-2">Filter by Date:</span>
          <DatePicker
            selected={date}
            onChange={setDate}
            placeholderText="Select date"
            className="border rounded px-2 py-1"
            dateFormat="yyyy-MM-dd"
            isClearable
          />
          <a
            href="/data/cpo_performance.csv"
            download
            className="text-primary underline text-sm"
          >
            Download CSV
          </a>
        </div>
      </div>

      {/* Premium Stat Cards Row */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <PremiumStatCard
          title="Best SKU"
          value={bestSKURowValid ? bestSKURowValid.SKU_ID : '-'}
          subtitle={
            bestSKURowValid
              ? `Orders: ${bestSKURowValid.Orders} | Region: ${bestSKURowValid.Region}`
              : ''
          }
          icon={<Award size={20} color="#2563eb" />}
          color="#2563eb"
        />
        <PremiumStatCard
          title="Highest Delay"
          value={highestDelayRowValid ? `${highestDelayRowValid.Delay_Minutes} min` : '-'}
          subtitle={
            highestDelayRowValid
              ? `SKU: ${highestDelayRowValid.SKU_ID} | Region: ${highestDelayRowValid.Region}`
              : ''
          }
          icon={<Clock size={20} color="#f59e42" />}
          color="#f59e42"
        />
        <PremiumStatCard
          title="Top Region"
          value={bestRegion}
          subtitle={`Total Orders: ${totalOrders}`}
          icon={<MapPin size={20} color="#10b981" />}
          color="#10b981"
        />
        <PremiumStatCard
          title="Return Rate"
          value={returnRate + '%'}
          subtitle={`Returns: ${totalReturns} / Orders: ${totalOrders}`}
          icon={<TrendingUp size={20} color="#ef4444" />}
          color="#ef4444"
        />
      </div>

      {/* Charts */}
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" initial="hidden" animate="visible" variants={{hidden: {}, visible: {transition: {staggerChildren: 0.1}}}}>
        {/* Orders & Returns Bar Chart */}
        <motion.div whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle>Orders & Returns by SKU</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="SKU_ID" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Orders" fill="#2563eb" name="Orders" isAnimationActive />
                  <Bar dataKey="Returns" fill="#f59e42" name="Returns" isAnimationActive />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        {/* Delay Minutes Line Chart */}
        <motion.div whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Avg Delay by SKU</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="SKU_ID" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="Delay_Minutes" stroke="#10b981" name="Delay (min)" isAnimationActive />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        {/* Pie Chart for Region Share */}
        <motion.div whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>Order Share by Region</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={regionData}
                    dataKey="orders"
                    nameKey="region"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    isAnimationActive
                  >
                    {regionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        style={{ cursor: 'pointer' }}
                        onMouseOver={e => (e.target as SVGElement).setAttribute('filter', 'brightness(1.2)')}
                        onMouseOut={e => (e.target as SVGElement).removeAttribute('filter')}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
            <DeliveryHeatmap />
            <WarehouseKPI />
          </div>
      {/* Data Table Section - Moved to bottom */}
      <motion.div 
        className="space-y-4 mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-semibold">Recent Product Performance</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Total rows: {filteredData.length}</span>
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-0">
            <div className="relative overflow-hidden rounded-lg">
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-r from-primary/5 to-primary/10 backdrop-blur-sm">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-primary/80">
                        SKU ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-primary/80">
                        Region
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-primary/80">
                        Date
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-primary/80">
                        Orders
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-primary/80">
                        Returns
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-primary/80">
                        Delay (min)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {filteredData.map((row, index) => (
                      <motion.tr
                        key={row.SKU_ID + row.Region + row.Date}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-primary/5 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="font-mono text-sm font-medium text-primary/90">
                              {row.SKU_ID}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-primary/80">
                              {row.Region}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-primary/80">
                            {row.Date}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-medium text-primary/90">
                            {row.Orders}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-medium text-primary/90">
                            {row.Returns}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-medium text-primary/90">
                            {row.Delay_Minutes}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add custom scrollbar styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
      `}} />
    </motion.div>
  );
}
// Software Engineer Components
const SoftwareEngineeringSection = () => {
  const [bugData, setBugData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('all');

  useEffect(() => {
    fetch('/data/software_engineer_bug_reports.json')
      .then(res => res.json())
      .then(data => {
        // Ensure data is an array
        const dataArray = Array.isArray(data) ? data : [];
        setBugData(dataArray);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading bug data:', err);
        setBugData([]);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    if (!bugData || bugData.length === 0) {
      return {
        total: 0,
        highSeverity: 0,
        inProgress: 0,
        resolved: 0
      };
    }
    
    return {
      total: bugData.length,
      highSeverity: bugData.filter(bug => bug?.severity === 'High').length,
      inProgress: bugData.filter(bug => bug?.status === 'In Progress').length,
      resolved: bugData.filter(bug => bug?.status === 'Resolved').length
    };
  }, [bugData]);

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'High': return '#ff6b6b';
      case 'Medium': return '#ffd43b';
      case 'Low': return '#51cf66';
      default: return '#8884d8';
    }
  };

  // Enhanced data processing
  const severityData = useMemo(() => {
    if (!bugData || bugData.length === 0) {
      return [];
    }
    
    const counts = bugData.reduce((acc, bug) => {
      if (bug && bug.severity) {
        acc[bug.severity] = (acc[bug.severity] || 0) + 1;
      }
      return acc;
    }, {});
    
    return Object.entries(counts).map(([severity, count]) => ({
      severity,
      count,
      color: getSeverityColor(severity)
    }));
  }, [bugData]);

  const timelineData = useMemo(() => {
    if (!bugData || bugData.length === 0) {
      return {};
    }
    
    const now = new Date();
    const daysAgo = new Date();
    daysAgo.setDate(now.getDate() - 7);
    
    return bugData
      .filter(bug => bug && bug.timestamp && new Date(bug.timestamp) >= daysAgo)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .reduce((acc, bug) => {
        if (bug) {
          const date = new Date(bug.timestamp).toLocaleDateString();
          if (!acc[date]) {
            acc[date] = { date, open: 0, resolved: 0 };
          }
          if (bug.status === 'Resolved' || bug.status === 'Closed') {
            acc[date].resolved += 1;
          } else {
            acc[date].open += 1;
          }
        }
        return acc;
      }, {});
  }, [bugData]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/10"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-500/10">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Bugs</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-6 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/10"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-500/10">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.highSeverity}</div>
              <div className="text-sm text-muted-foreground">High Severity</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/10"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-500/10">
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/10"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/10">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.resolved}</div>
              <div className="text-sm text-muted-foreground">Resolved</div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bug Distribution</CardTitle>
            <CardDescription>By severity level</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="severity" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '6px' }}
                  formatter={(value) => [`${value} bugs`, 'Count']}
                />
                <Bar 
                  dataKey="count" 
                  fill="#8884d8" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resolution Timeline</CardTitle>
            <CardDescription>Bug status over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={Object.values(timelineData)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '6px' }}
                  formatter={(value, name) => [`${value} bugs`, name === 'open' ? 'Open' : 'Resolved']}
                />
                <Area 
                  type="monotone" 
                  dataKey="open" 
                  stackId="1" 
                  stroke="#ff6b6b" 
                  fill="#ff6b6b" 
                  fillOpacity={0.2}
                />
                <Area 
                  type="monotone" 
                  dataKey="resolved" 
                  stackId="1" 
                  stroke="#51cf66" 
                  fill="#51cf66" 
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Bug Reports</CardTitle>
            <CardDescription>Detailed list of reported bugs</CardDescription>
          </div>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] rounded-md">
            <div className="space-y-4">
              {bugData
                .filter(bug => filterSeverity === 'all' || bug.severity === filterSeverity)
                .map((bug, index) => (
                  <motion.div
                    key={bug.bug_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={bug.severity === 'High' ? 'destructive' : bug.severity === 'Medium' ? 'secondary' : 'default'}
                        >
                          {bug.severity}
                        </Badge>
                        <div className="font-medium">{bug.bug_id}</div>
                      </div>
                      <Badge
                        variant={bug.status === 'Resolved' ? 'default' : 'outline'}
                        className="capitalize"
                      >
                        {bug.status}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">{bug.description}</div>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {bug.reported_by}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {new Date(bug.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

function AccountsFinance() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch('/data/accounts_finance_reports.csv')
      .then(res => res.text())
      .then(csv => {
        const parsed = Papa.parse(csv, { header: true, dynamicTyping: true });
        setData(parsed.data.filter((row: any) => row.transaction_id));
      });
  }, []);

  // KPIs
  const totalExpenses = useMemo(() => data.reduce((a: number, b) => a + (Number(b.amount_usd) || 0), 0), [data]);
  const pending = useMemo(() => data.filter(r => r.payment_status === 'Pending').reduce((a: number, b) => a + (Number(b.amount_usd) || 0), 0), [data]);
  const failed = useMemo(() => data.filter(r => r.payment_status === 'Failed').reduce((a: number, b) => a + (Number(b.amount_usd) || 0), 0), [data]);
  const completed = useMemo(() => data.filter(r => r.payment_status === 'Completed').reduce((a: number, b) => a + (Number(b.amount_usd) || 0), 0), [data]);
  const topDept = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(r => { map[r.department] = (map[r.department] || 0) + (Number(r.amount_usd) || 0); });
    return Object.entries(map).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || '-';
  }, [data]);
  const topExpenseType = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(r => { map[r.expense_type] = (map[r.expense_type] || 0) + 1; });
    return Object.entries(map).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || '-';
  }, [data]);
  const topApprover = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(r => { map[r.approved_by] = (map[r.approved_by] || 0) + 1; });
    return Object.entries(map).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || '-';
  }, [data]);
  const avgTransaction = useMemo(() => data.length ? (totalExpenses / data.length).toFixed(2) : 0, [totalExpenses, data]);

  // Chart Data
  const expensesByDept = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(r => { map[r.department] = (map[r.department] || 0) + (Number(r.amount_usd) || 0); });
    return Object.entries(map).map(([department, amount]) => ({ department, amount }));
  }, [data]);
  const paymentStatusDist = useMemo(() => {
    const map = { Pending: 0, Failed: 0, Completed: 0 };
    data.forEach(r => { if (map[r.payment_status] !== undefined) map[r.payment_status] += 1; });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [data]);
  const expensesOverTime = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(r => { map[r.date] = (map[r.date] || 0) + (Number(r.amount_usd) || 0); });
    return Object.entries(map).map(([date, amount]) => ({ date, amount }));
  }, [data]);
  const expenseTypeByDept = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    data.forEach(r => {
      if (!map[r.department]) map[r.department] = {};
      map[r.department][r.expense_type] = (map[r.department][r.expense_type] || 0) + (Number(r.amount_usd) || 0);
    });
    return Object.entries(map).map(([department, types]) => {
      const row: Record<string, any> = { department };
      Object.entries(types).forEach(([type, value]) => {
        row[type] = value;
      });
      return row;
    });
  }, [data]);
  const departmentShare = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(r => { map[r.department] = (map[r.department] || 0) + (Number(r.amount_usd) || 0); });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map).map(([department, amount]) => ({ department, value: total ? (amount / total) * 100 : 0 }));
  }, [data]);
  const dailyTrend = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(r => { map[r.date] = (map[r.date] || 0) + (Number(r.amount_usd) || 0); });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({ date, amount }));
  }, [data]);
  const failedPayments = useMemo(() => data.filter(r => r.payment_status === 'Failed'), [data]);

  // Table Data
  const latestRows = useMemo(() => data.slice(-10).reverse(), [data]);

  // Analysis
  const pendingPercent = totalExpenses ? ((pending / totalExpenses) * 100).toFixed(1) : 0;
  const failedPercent = totalExpenses ? ((failed / totalExpenses) * 100).toFixed(1) : 0;
  const completedPercent = totalExpenses ? ((completed / totalExpenses) * 100).toFixed(1) : 0;

  const COLORS = ['#2563eb', '#f59e42', '#10b981', '#f43f5e', '#6366f1', '#facc15'];

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 80, damping: 18 }}>
      {/* KPI Cards */}
      <div
        className="w-full grid gap-4 mb-6"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gridAutoRows: '1fr',
        }}
      >
        <PremiumStatCard title="Total Expenses" value={`₹${totalExpenses.toLocaleString()}`} icon={<DollarSign size={20} color="#2563eb" />} color="#2563eb" />
        <PremiumStatCard title="Pending Payments" value={`₹${pending.toLocaleString()}`} icon={<Clock size={20} color="#f59e42" />} color="#f59e42" />
        <PremiumStatCard title="Failed Payments" value={`₹${failed.toLocaleString()}`} icon={<TrendingUp size={20} color="#f43f5e" />} color="#f43f5e" />
        <PremiumStatCard title="Completed Payments" value={`₹${completed.toLocaleString()}`} icon={<Award size={20} color="#10b981" />} color="#10b981" />
        <PremiumStatCard title="Avg Transaction" value={`₹${avgTransaction}`} icon={<TrendingUp size={20} color="#6366f1" />} color="#6366f1" />
      </div>

      {/* Charts */}
      <motion.div
        className="grid gap-6"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gridAutoRows: '1fr',
        }}
        initial="hidden"
        animate="visible"
        variants={{hidden: {}, visible: {transition: {staggerChildren: 0.1}}}}
      >

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <motion.div whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={expensesByDept} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#2563eb" name="Expenses" isAnimationActive />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        {/* Pie Chart: Payment Status Distribution */}
        <motion.div whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Payment Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={paymentStatusDist}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                    isAnimationActive
                  >
                    {paymentStatusDist.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        style={{ cursor: 'pointer' }}
                        onMouseOver={e => (e.target as SVGElement).setAttribute('filter', 'brightness(1.2)')}
                        onMouseOut={e => (e.target as SVGElement).removeAttribute('filter')}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        {/* Line Chart: Expenses Over Time */}
        <motion.div whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>Expenses Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={expensesOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="amount" stroke="#6366f1" name="Expenses" isAnimationActive />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        {/* Stacked Bar: Expense Type by Department */}
        <motion.div whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>Expense Type by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={expenseTypeByDept} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  {Array.from(new Set(data.map(r => r.expense_type))).map((type, idx) => (
                    <Bar key={type} dataKey={type} stackId="a" fill={COLORS[idx % COLORS.length]} name={type} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        {/* Pie Chart: Department Share */}
        <motion.div whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle>Department Share (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={departmentShare}
                    dataKey="value"
                    nameKey="department"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ department, percent }) => `${department} ${(percent * 100).toFixed(0)}%`}
                    isAnimationActive
                  >
                    {departmentShare.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        style={{ cursor: 'pointer' }}
                        onMouseOver={e => (e.target as SVGElement).setAttribute('filter', 'brightness(1.2)')}
                        onMouseOut={e => (e.target as SVGElement).removeAttribute('filter')}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        </div>
        {/* Bar Chart: Expenses by Department */}
        
      </motion.div>

      {/* Finance Analysis Section - More Professional */}
      <Card className="mt-6 bg-gradient-to-br from-primary/5 to-white border-2 border-primary/10 shadow-xl">
        <CardHeader className="flex flex-row items-center gap-4">
          <DollarSign className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-bold">Finance Analysis</CardTitle>
            <CardDescription>Key insights and highlights</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-base">
              <li><span className="font-semibold text-primary">{pendingPercent}%</span> of total expenses are <span className="font-semibold">pending</span>.</li>
              <li><span className="font-semibold text-destructive">{failedPercent}%</span> of total expenses are <span className="font-semibold">failed</span> payments.</li>
              <li>Most failed payments are in <span className="font-semibold">{topDept}</span> for <span className="font-semibold">{topExpenseType}</span>.</li>
              <li>Top approver: <span className="font-semibold">{topApprover}</span></li>
              <li>Average transaction size: <span className="font-semibold text-primary">₹{avgTransaction}</span></li>
            </ul>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-medium">Daily Trend:</span>
              </div>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={dailyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Failed Payments Table */}
      <motion.div className="space-y-4 mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-semibold text-destructive">Failed Payments</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{failedPayments.length} failed</span>
          </div>
        </div>
        <Card className="border-none shadow-lg">
          <CardContent className="p-0">
            <div className="relative overflow-hidden rounded-lg">
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-r from-destructive/10 to-destructive/5 backdrop-blur-sm">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-destructive">Transaction ID</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-destructive">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-destructive">Department</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-destructive">Expense Type</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-destructive">Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-destructive">Approved By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-destructive/10">
                    {failedPayments.map((row, index) => (
                      <motion.tr
                        key={row.transaction_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-destructive/10 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 font-mono text-destructive">{row.transaction_id}</td>
                        <td className="px-6 py-4">{row.date}</td>
                        <td className="px-6 py-4">{row.department}</td>
                        <td className="px-6 py-4">{row.expense_type}</td>
                        <td className="px-6 py-4 text-right font-semibold">₹{row.amount_usd?.toLocaleString()}</td>
                        <td className="px-6 py-4">{row.approved_by}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table Section */}
      <motion.div className="space-y-4 mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-semibold">Recent Transactions</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Latest 10</span>
          </div>
        </div>
        <Card className="border-none shadow-lg">
          <CardContent className="p-0">
            <div className="relative overflow-hidden rounded-lg">
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-r from-primary/5 to-primary/10 backdrop-blur-sm">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-primary/80">Transaction ID</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-primary/80">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-primary/80">Department</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-primary/80">Expense Type</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-primary/80">Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-primary/80">Payment Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-primary/80">Approved By</th>

                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {latestRows.map((row, index) => (
                      <motion.tr
                        key={row.transaction_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-primary/5 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 font-mono text-primary/90">{row.transaction_id}</td>
                        <td className="px-6 py-4">{row.date}</td>
                        <td className="px-6 py-4">{row.department}</td>
                        <td className="px-6 py-4">{row.expense_type}</td>
                        <td className="px-6 py-4 text-right font-semibold">₹{row.amount_usd?.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <Badge variant={row.payment_status === 'Completed' ? 'default' : row.payment_status === 'Pending' ? 'secondary' : 'destructive'}>
                            {row.payment_status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">{row.approved_by}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [activeRole, setActiveRole] = useState('cpo');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const tabs = [
    { value: 'cpo', label: 'CPO', icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'software-engineer', label: 'Software Engineer', icon: <Code className="h-4 w-4" /> },
    { value: 'Accounts', label: 'Accounts', icon: <DollarSign className="h-4 w-4" /> },
    { value: 'marketing', label: 'Marketing', icon: <Megaphone className="h-4 w-4" /> },
    { value: 'intern', label: 'Intern', icon: <GraduationCap className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue="cpo" 
        className="w-full" 
        onValueChange={setActiveRole}
      >
        <div className="border-b border-border/40">
          <div className="container mx-auto px-4">
            <TabsList className="w-full h-14 bg-transparent p-0">
              <div className="flex items-center space-x-1">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "relative px-6 py-2.5 text-sm font-medium transition-all duration-200",
                      "data-[state=active]:text-primary data-[state=active]:bg-primary/5",
                      "hover:bg-primary/5 hover:text-primary/80",
                      "rounded-none border-b-2 border-transparent",
                      "data-[state=active]:border-primary",
                      "flex items-center gap-2",
                      "focus-visible:ring-0 focus-visible:ring-offset-0",
                      "min-w-[120px] justify-center"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">
                        {tab.label.split(' ')[0]}
                      </span>
                    </span>
                  </TabsTrigger>
                ))}
              </div>
            </TabsList>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <TabsContent value="cpo" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >

              
              <CPOProductPerformance />
            </motion.div>
        </TabsContent>

          <TabsContent value="software-engineer" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SoftwareEngineeringSection />
              <div className="grid gap-4 md:grid-cols-2">
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="Accounts" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AccountsFinance />
            </motion.div>
          </TabsContent>

          <TabsContent value="marketing" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <MarketingDashboard />
            </motion.div>
          </TabsContent>

          <TabsContent value="intern" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <InternInventorySection />
            </motion.div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}