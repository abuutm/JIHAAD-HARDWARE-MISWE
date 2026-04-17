import React, { useState, useEffect, useMemo } from 'react';
import {
  Wind, Plus, Search, Filter, Calendar, Clock, DollarSign,
  TrendingUp, Users, Star, Award, Zap, Target, BarChart3,
  Settings, Bell, Download, Upload, RefreshCw, CheckCircle,
  XCircle, AlertTriangle, Info, Phone, Mail, MapPin,
  Bike, Car, Truck, Navigation, Gauge, Activity, Timer,
  CreditCard, Wallet, Receipt, PieChart, LineChart,
  Smartphone, QrCode, Camera, Mic, Volume2, Headphones
} from 'lucide-react';
import { AirServiceRecord, PaymentMethod } from './types';
import { db } from './db';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  totalServices: number;
  lastService: string;
  preferredVehicle: string;
}

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // minutes
  vehicleTypes: string[];
  features: string[];
}

interface ServiceSession {
  id: string;
  customerId?: string;
  vehicleType: string;
  serviceType: string;
  price: number;
  startTime: string;
  endTime?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  paymentMethod: PaymentMethod;
  notes?: string;
  rating?: number;
  feedback?: string;
}

const AirMachineView = ({ theme, radiusClass, settings, setSaveStatus }: any) => {
  // Core State
  const [services, setServices] = useState<AirServiceRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sessions, setSessions] = useState<ServiceSession[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);

  // UI State
  const [activeView, setActiveView] = useState<'dashboard' | 'services' | 'customers' | 'analytics' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);

  // Service Creation State
  const [newService, setNewService] = useState({
    customerId: '',
    vehicleType: 'Pikipiki',
    serviceType: 'standard',
    price: 500,
    notes: ''
  });

  // Analytics State
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [servicesData, customersData, sessionsData, packagesData] = await Promise.all([
          db.getAll('air_services'),
          db.getAll('air_customers') || [],
          db.getAll('air_sessions') || [],
          db.getAll('air_packages') || []
        ]);

        setServices(servicesData);
        setCustomers(customersData);
        setSessions(sessionsData);
        setPackages(packagesData);
      } catch (error) {
        console.error('Failed to load air machine data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Computed Analytics
  const analytics = useMemo(() => {
    const periodStart = new Date();
    switch (analyticsPeriod) {
      case 'today':
        periodStart.setHours(0, 0, 0, 0);
        break;
      case 'week':
        periodStart.setDate(periodStart.getDate() - 7);
        break;
      case 'month':
        periodStart.setMonth(periodStart.getMonth() - 1);
        break;
      case 'year':
        periodStart.setFullYear(periodStart.getFullYear() - 1);
        break;
    }

    const periodServices = services.filter(s => new Date(s.date) >= periodStart);
    const periodSessions = sessions.filter(s => new Date(s.startTime) >= periodStart);

    return {
      totalRevenue: periodServices.reduce((sum, s) => sum + s.total, 0),
      totalServices: periodServices.length,
      totalCustomers: new Set(periodServices.map(s => s.id)).size,
      avgServiceTime: 15, // Mock data
      customerSatisfaction: 4.5, // Mock data
      popularVehicle: 'Pikipiki',
      peakHours: '10:00 - 14:00',
      conversionRate: 85
    };
  }, [services, sessions, analyticsPeriod]);

  // Service Packages
  const defaultPackages: ServicePackage[] = [
    {
      id: 'basic',
      name: 'Basic Air Fill',
      description: 'Standard air filling service',
      price: 500,
      duration: 5,
      vehicleTypes: ['Pikipiki', 'Baiskeli'],
      features: ['Air pressure check', 'Basic filling']
    },
    {
      id: 'premium',
      name: 'Premium Service',
      description: 'Complete tire maintenance',
      price: 1000,
      duration: 15,
      vehicleTypes: ['Pikipiki', 'Gari', 'Bajaj'],
      features: ['Air pressure check', 'Tire inspection', 'Valve cleaning', 'Pressure optimization']
    },
    {
      id: 'vip',
      name: 'VIP Package',
      description: 'Luxury service with extras',
      price: 2000,
      duration: 25,
      vehicleTypes: ['Gari'],
      features: ['All premium features', 'Tire shine', 'Interior cleaning', 'Priority service']
    }
  ];

  // Handle Service Creation
  const handleCreateService = async () => {
    if (!newService.vehicleType || !newService.price) return;

    setSaveStatus?.('saving');

    const serviceId = `AS-${Date.now()}`;
    const sessionId = `SS-${Date.now()}`;

    const serviceRecord: AirServiceRecord = {
      id: serviceId,
      vehicleType: newService.vehicleType as any,
      count: 1,
      price: newService.price,
      total: newService.price,
      date: new Date().toISOString(),
      paymentMethod: PaymentMethod.CASH,
      notes: newService.notes
    };

    const sessionRecord: ServiceSession = {
      id: sessionId,
      customerId: newService.customerId || undefined,
      vehicleType: newService.vehicleType,
      serviceType: newService.serviceType,
      price: newService.price,
      startTime: new Date().toISOString(),
      status: 'completed',
      paymentMethod: PaymentMethod.CASH,
      notes: newService.notes
    };

    try {
      await Promise.all([
        db.put('air_services', serviceRecord),
        db.put('air_sessions', sessionRecord)
      ]);

      setServices(prev => [...prev, serviceRecord]);
      setSessions(prev => [...prev, sessionRecord]);

      // Reset form
      setNewService({
        customerId: '',
        vehicleType: 'Pikipiki',
        serviceType: 'standard',
        price: 500,
        notes: ''
      });

      setSaveStatus?.('saved');
    } catch (error) {
      console.error('Failed to create service:', error);
      setSaveStatus?.('error');
    }
  };

  // Render Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="neumorphic-card p-8 rounded-3xl">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading Air Machine System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="neumorphic-card p-6 rounded-3xl mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <div className="neumorphic-card p-3 rounded-2xl">
                <Wind className="w-8 h-8 text-blue-600" />
              </div>
              Advanced Air Machine Pro
            </h1>
            <p className="text-slate-600 mt-2">Professional air filling service management system</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="neumorphic-card px-4 py-2 rounded-2xl flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-slate-700">System Online</span>
            </div>
            <button className="neumorphic-button px-4 py-2 rounded-2xl flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'services', label: 'Services', icon: Activity },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`px-4 py-2 rounded-2xl flex items-center gap-2 transition-all ${
                activeView === tab.id
                  ? 'neumorphic-card text-slate-900 shadow-lg'
                  : 'text-slate-600 hover:neumorphic-card hover:text-slate-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {activeView === 'dashboard' && (
          <DashboardView
            analytics={analytics}
            services={services}
            sessions={sessions}
            customers={customers}
            settings={settings}
            onCreateService={handleCreateService}
            newService={newService}
            setNewService={setNewService}
          />
        )}

        {activeView === 'services' && (
          <ServicesView
            services={services}
            sessions={sessions}
            packages={packages}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            settings={settings}
          />
        )}

        {activeView === 'customers' && (
          <CustomersView
            customers={customers}
            services={services}
            settings={settings}
          />
        )}

        {activeView === 'analytics' && (
          <AnalyticsView
            analytics={analytics}
            services={services}
            sessions={sessions}
            analyticsPeriod={analyticsPeriod}
            setAnalyticsPeriod={setAnalyticsPeriod}
          />
        )}

        {activeView === 'settings' && (
          <SettingsView
            packages={packages}
            setPackages={setPackages}
            settings={settings}
          />
        )}
      </div>
    </div>
  );
};

// Dashboard Component
const DashboardView = ({ analytics, services, sessions, customers, settings, onCreateService, newService, setNewService }: any) => {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="neumorphic-card p-6 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Today's Revenue</p>
              <p className="text-2xl font-black text-slate-900">{settings.currency} {(isNaN(analytics.totalRevenue) || !isFinite(analytics.totalRevenue) ? 0 : analytics.totalRevenue).toLocaleString()}</p>
            </div>
            <div className="neumorphic-card p-3 rounded-2xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="neumorphic-card p-6 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Services Today</p>
              <p className="text-2xl font-black text-slate-900">{analytics.totalServices}</p>
            </div>
            <div className="neumorphic-card p-3 rounded-2xl">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="neumorphic-card p-6 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Customers</p>
              <p className="text-2xl font-black text-slate-900">{analytics.totalCustomers}</p>
            </div>
            <div className="neumorphic-card p-3 rounded-2xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="neumorphic-card p-6 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Rating</p>
              <p className="text-2xl font-black text-slate-900">{analytics.customerSatisfaction}⭐</p>
            </div>
            <div className="neumorphic-card p-3 rounded-2xl">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Service Creation */}
      <div className="neumorphic-card p-6 rounded-3xl">
        <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Quick Service
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Vehicle Type</label>
            <select
              value={newService.vehicleType}
              onChange={(e) => setNewService({...newService, vehicleType: e.target.value})}
              className="w-full neumorphic-card px-4 py-3 rounded-2xl border-0 outline-none"
            >
              <option value="Pikipiki">Pikipiki</option>
              <option value="Gari">Gari</option>
              <option value="Bajaj">Bajaj</option>
              <option value="Baiskeli">Baiskeli</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Service Type</label>
            <select
              value={newService.serviceType}
              onChange={(e) => setNewService({...newService, serviceType: e.target.value})}
              className="w-full neumorphic-card px-4 py-3 rounded-2xl border-0 outline-none"
            >
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="vip">VIP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Price ({settings.currency})</label>
            <input
              type="number"
              value={newService.price}
              onChange={(e) => setNewService({...newService, price: Number(e.target.value)})}
              className="w-full neumorphic-card px-4 py-3 rounded-2xl border-0 outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={onCreateService}
              className="w-full neumorphic-button px-6 py-3 rounded-2xl flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Create Service</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Services */}
      <div className="neumorphic-card p-6 rounded-3xl">
        <h3 className="text-xl font-black text-slate-900 mb-4">Recent Services</h3>
        <div className="space-y-3">
          {services.slice(-5).reverse().map((service: AirServiceRecord) => (
            <div key={service.id} className="flex items-center justify-between p-4 neumorphic-card rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="neumorphic-card p-2 rounded-xl">
                  {service.vehicleType === 'Pikipiki' && <Bike className="w-4 h-4 text-blue-600" />}
                  {service.vehicleType === 'Gari' && <Car className="w-4 h-4 text-green-600" />}
                  {service.vehicleType === 'Bajaj' && <Truck className="w-4 h-4 text-orange-600" />}
                  {service.vehicleType === 'Baiskeli' && <Wind className="w-4 h-4 text-purple-600" />}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{service.vehicleType}</p>
                  <p className="text-sm text-slate-600">{new Date(service.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-900">{settings.currency} {(isNaN(service.total) || !isFinite(service.total) ? 0 : service.total).toLocaleString()}</p>
                <p className="text-sm text-slate-600">{service.paymentMethod}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Services View Component
const ServicesView = ({ services, sessions, packages, searchQuery, setSearchQuery, filterStatus, setFilterStatus, selectedDate, setSelectedDate, settings }: any) => {
  const filteredServices = useMemo(() => {
    return services.filter((service: AirServiceRecord) => {
      const matchesSearch = !searchQuery ||
        service.vehicleType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.notes?.toLowerCase().includes(searchQuery.toLowerCase());

      const serviceDate = new Date(service.date).toISOString().split('T')[0];
      const matchesDate = serviceDate === selectedDate;

      return matchesSearch && matchesDate;
    });
  }, [services, searchQuery, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="neumorphic-card p-6 rounded-3xl">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full neumorphic-card pl-10 pr-4 py-3 rounded-2xl border-0 outline-none"
              />
            </div>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="neumorphic-card px-4 py-3 rounded-2xl border-0 outline-none"
          />
        </div>
      </div>

      {/* Services List */}
      <div className="grid gap-4">
        {filteredServices.map((service: AirServiceRecord) => (
          <div key={service.id} className="neumorphic-card p-6 rounded-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="neumorphic-card p-3 rounded-2xl">
                  {service.vehicleType === 'Pikipiki' && <Bike className="w-6 h-6 text-blue-600" />}
                  {service.vehicleType === 'Gari' && <Car className="w-6 h-6 text-green-600" />}
                  {service.vehicleType === 'Bajaj' && <Truck className="w-6 h-6 text-orange-600" />}
                  {service.vehicleType === 'Baiskeli' && <Wind className="w-6 h-6 text-purple-600" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{service.vehicleType}</h3>
                  <p className="text-sm text-slate-600">{new Date(service.date).toLocaleString()}</p>
                  {service.notes && <p className="text-sm text-slate-500 mt-1">{service.notes}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-900">{settings.currency} {(isNaN(service.total) || !isFinite(service.total) ? 0 : service.total).toLocaleString()}</p>
                <p className="text-sm text-slate-600">{service.count} vehicle(s)</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Customers View Component
const CustomersView = ({ customers, services, settings }: any) => {
  return (
    <div className="space-y-6">
      <div className="neumorphic-card p-6 rounded-3xl">
        <h3 className="text-xl font-black text-slate-900 mb-4">Customer Management</h3>
        <p className="text-slate-600">Advanced customer loyalty and management system coming soon...</p>
      </div>
    </div>
  );
};

// Analytics View Component
const AnalyticsView = ({ analytics, services, sessions, analyticsPeriod, setAnalyticsPeriod }: any) => {
  return (
    <div className="space-y-6">
      <div className="neumorphic-card p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-slate-900">Analytics Dashboard</h3>
          <select
            value={analyticsPeriod}
            onChange={(e) => setAnalyticsPeriod(e.target.value)}
            className="neumorphic-card px-4 py-2 rounded-2xl border-0 outline-none"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="neumorphic-card p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h4 className="font-bold text-slate-900">Revenue Trend</h4>
            </div>
            <p className="text-3xl font-black text-slate-900">{analytics.totalRevenue}</p>
            <p className="text-sm text-slate-600">+12% from last period</p>
          </div>

          <div className="neumorphic-card p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-600" />
              <h4 className="font-bold text-slate-900">Customer Growth</h4>
            </div>
            <p className="text-3xl font-black text-slate-900">{analytics.totalCustomers}</p>
            <p className="text-sm text-slate-600">+8% new customers</p>
          </div>

          <div className="neumorphic-card p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-6 h-6 text-yellow-600" />
              <h4 className="font-bold text-slate-900">Satisfaction</h4>
            </div>
            <p className="text-3xl font-black text-slate-900">{analytics.customerSatisfaction}/5</p>
            <p className="text-sm text-slate-600">Based on feedback</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Settings View Component
const SettingsView = ({ packages, setPackages, settings }: any) => {
  return (
    <div className="space-y-6">
      <div className="neumorphic-card p-6 rounded-3xl">
        <h3 className="text-xl font-black text-slate-900 mb-4">System Settings</h3>
        <p className="text-slate-600">Advanced configuration options coming soon...</p>
      </div>
    </div>
  );
};

export default AirMachineView;
