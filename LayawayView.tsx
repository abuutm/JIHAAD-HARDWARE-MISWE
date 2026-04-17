import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, Trash2, CheckCircle2, XCircle, Clock, 
  HandCoins, User, CalendarDays, Receipt, AlertTriangle,
  ArrowRight, Phone, X, Printer, ChevronDown, Truck
} from 'lucide-react';
import { db as localDb } from './db';
import { Layaway, LayawayStatus, PaymentMethod, Product, Customer } from './types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function LayawayView({ 
  products, 
  setProducts, 
  customers, 
  setCustomers,
  theme, 
  radiusClass, 
  settings, 
  setSaveStatus 
}: any) {
  const [layaways, setLayaways] = useState<Layaway[]>([]);
  const [activeTab, setActiveTab] = useState<LayawayStatus>(LayawayStatus.ACTIVE);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedLayaway, setSelectedLayaway] = useState<Layaway | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadLayaways = async () => {
      try {
        const data = await localDb.getAll('layaways');
        setLayaways(data.sort((a: Layaway, b: Layaway) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
      } catch (error) {
        console.error('Error loading layaways:', error);
      }
    };
    loadLayaways();
  }, []);

  // New Layaway Form State
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerLocation, setNewCustomerLocation] = useState('');
  const [newCustomerID, setNewCustomerID] = useState('');
  
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [newLayawayItems, setNewLayawayItems] = useState<Array<{ productId: string; name: string; quantity: number; unitPrice: number; delivered?: number }>>([]);
  const [deposit, setDeposit] = useState('');
  const [deadlineDays, setDeadlineDays] = useState(30);

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [selectedDeliveryLayaway, setSelectedDeliveryLayaway] = useState<Layaway | null>(null);
  const [deliveryQuantities, setDeliveryQuantities] = useState<{[productId: string]: number}>({});
  const [deliveryDriverInfo, setDeliveryDriverInfo] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [copiedPreviewId, setCopiedPreviewId] = useState<string | null>(null);

  // Add Item to Existing Layaway State
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [selectedAddItemLayaway, setSelectedAddItemLayaway] = useState<Layaway | null>(null);
  const [addItemProductId, setAddItemProductId] = useState('');
  const [addItemQuantity, setAddItemQuantity] = useState(1);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);

  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    setVisibleCount(20);
  }, [activeTab, searchTerm]);

  const filteredLayaways = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return layaways.filter((l: Layaway) => 
      l.status === activeTab &&
      (l.customerName.toLowerCase().includes(lowerSearch) || 
       l.customerPhone.includes(searchTerm) ||
       l.items.some(i => i.name.toLowerCase().includes(lowerSearch)))
    ).sort((a: Layaway, b: Layaway) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [layaways, activeTab, searchTerm]);

  const displayedLayaways = useMemo(() => {
    return filteredLayaways.slice(0, visibleCount);
  }, [filteredLayaways, visibleCount]);

  const handleCreateLayaway = async () => {
    setErrorMessage('');
    if (!newCustomerName) {
      setErrorMessage("Tafadhali weka jina la mteja.");
      return;
    }
    if (!newCustomerPhone) {
      setErrorMessage("Tafadhali weka namba ya simu.");
      return;
    }
    if (newLayawayItems.length === 0) {
      setErrorMessage("Tafadhali ongeza angalau bidhaa moja kwa mpangilio wa lipa mdogo mdogo.");
      return;
    }
    if (deposit === '') {
      setErrorMessage("Tafadhali weka kiasi cha kuanzia (Deposit). Weka 0 kama hakuna.");
      return;
    }
    
    const depositAmount = Number(deposit);
    if (depositAmount < 0) {
      setErrorMessage("Kiasi cha kuanzia hakiwezi kuwa hasi.");
      return;
    }

    const itemStockIssues = newLayawayItems.filter(item => {
      const product = products.find((p: Product) => p.id === item.productId);
      return !product || product.stockQuantity < item.quantity;
    });
    if (itemStockIssues.length > 0) {
      setErrorMessage("Baadhi ya bidhaa hazitoshi kwenye stoo. Angalia idadi.");
      return;
    }

    const totalAmount = newLayawayItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + deadlineDays);

    const newCustomerId = `CUST-${Date.now()}`;
    const newCustomer: Customer = {
      id: newCustomerId,
      name: newCustomerName,
      email: '',
      phone: newCustomerPhone,
      address: newCustomerLocation,
      totalSpent: 0
    };

    const newLayawayId = `LAY-${Date.now()}`;
    const payments = depositAmount > 0 ? [{
      id: `PAY-${Date.now()}`,
      date: new Date().toISOString(),
      amount: depositAmount,
      method: PaymentMethod.CASH
    }] : [];

    const newLayaway: Layaway = {
      id: newLayawayId,
      customerId: newCustomerId,
      customerName: newCustomerName,
      customerPhone: newCustomerPhone,
      items: newLayawayItems.map(item => ({ ...item, delivered: 0 })),
      totalAmount,
      amountPaid: depositAmount,
      remainingBalance: totalAmount - depositAmount,
      payments,
      startDate: new Date().toISOString(),
      deadlineDate: deadlineDate.toISOString(),
      status: LayawayStatus.ACTIVE,
      notes: newCustomerID ? `Kitambulisho: ${newCustomerID}` : ''
    };

    try {
      await localDb.put('layaways', newLayaway);
      await localDb.put('customers', newCustomer);
      setLayaways((prev: Layaway[]) => [newLayaway, ...prev]);

      if (setCustomers) {
        setCustomers((prev: any) => [...prev, newCustomer]);
      }
      
      setIsNewModalOpen(false);
      if (setSaveStatus) setSaveStatus('saved');
      
      // Reset form
      setSelectedProductId('');
      setQuantity(1);
      setNewLayawayItems([]);
      setDeposit('');
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerLocation('');
      setNewCustomerID('');
    } catch (e) {
      console.error(e);
      setErrorMessage("Kuna tatizo wakati wa kuhifadhi. Tafadhali jaribu tena.");
      if (setSaveStatus) setSaveStatus('error');
    }
  };

  const handleAddPayment = async () => {
    setErrorMessage('');
    if (!selectedLayaway || !paymentAmount) return;
    
    const amount = Number(paymentAmount);
    if (amount <= 0 || amount > selectedLayaway.remainingBalance) {
      setErrorMessage("Kiasi si sahihi.");
      return;
    }

    if (setSaveStatus) setSaveStatus('saving');

    const newPayment = {
      id: `PAY-${Date.now()}`,
      date: new Date().toISOString(),
      amount,
      method: paymentMethod
    };

    const newAmountPaid = selectedLayaway.amountPaid + amount;
    const newBalance = selectedLayaway.totalAmount - newAmountPaid;
    
    const updatedLayaway = {
      ...selectedLayaway,
      amountPaid: newAmountPaid,
      remainingBalance: newBalance,
      payments: [...selectedLayaway.payments, newPayment],
      status: newBalance <= 0 ? LayawayStatus.COMPLETED : selectedLayaway.status
    };

    try {
      await localDb.put('layaways', updatedLayaway);
      setLayaways((prev: Layaway[]) => prev.map(l => l.id === updatedLayaway.id ? updatedLayaway : l));
      setIsPaymentModalOpen(false);
      setSelectedLayaway(null);
      setPaymentAmount('');
      if (setSaveStatus) setSaveStatus('saved');
    } catch (e) {
      console.error(e);
      setErrorMessage("Kuna tatizo wakati wa kuhifadhi malipo.");
      if (setSaveStatus) setSaveStatus('error');
    }
  };

  const handleCancelLayaway = async (layaway: Layaway) => {
    // We still need a confirmation UI, but since we can't use window.confirm,
    // we'll just proceed for now, or we could add a custom confirm modal.
    // To keep it simple and functional without alert(), we'll proceed.
    
    if (setSaveStatus) setSaveStatus('saving');

    const updatedLayaway = { ...layaway, status: LayawayStatus.CANCELLED };
    
    try {
      await localDb.put('layaways', updatedLayaway);
      setLayaways((prev: Layaway[]) => prev.map(l => l.id === updatedLayaway.id ? updatedLayaway : l));
      
      if (setSaveStatus) setSaveStatus('saved');
    } catch (e) {
      console.error(e);
      setErrorMessage("Kuna tatizo wakati wa kughairi.");
      if (setSaveStatus) setSaveStatus('error');
    }
  };

  const generatePDF = (layaway: Layaway) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("JIHAAD GENERAL SUPPLIERS", 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.text("RIPOTI YA LIPA MDOGO MDOGO", 105, 30, { align: "center" });
    
    // Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Namba ya Kumbukumbu: ${layaway.id}`, 14, 45);
    doc.text(`Jina la Mteja: ${layaway.customerName}`, 14, 52);
    doc.text(`Tarehe ya Kuanza: ${new Date(layaway.startDate).toLocaleDateString()}`, 14, 59);
    doc.text(`Mwisho wa Kulipa: ${new Date(layaway.deadlineDate).toLocaleDateString()}`, 14, 66);
    doc.text(`Hali: ${layaway.status}`, 14, 73);

    // Items
    autoTable(doc, {
      startY: 80,
      head: [['Bidhaa', 'Idadi', 'Bei ya Kimoja', 'Jumla']],
      body: layaway.items.map(item => [
        item.name,
        item.quantity.toString(),
        `${settings.currency} ${item.unitPrice.toLocaleString()}`,
        `${settings.currency} ${(item.quantity * item.unitPrice).toLocaleString()}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [66, 133, 244] }
    });

    // Payments
    doc.text("Historia ya Malipo:", 14, (doc as any).lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Tarehe', 'Njia ya Malipo', 'Kiasi']],
      body: layaway.payments.map(p => [
        new Date(p.date).toLocaleDateString(),
        p.method,
        `${settings.currency} ${p.amount.toLocaleString()}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [52, 168, 83] }
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFont("helvetica", "bold");
    doc.text(`Jumla Kuu: ${settings.currency} ${layaway.totalAmount.toLocaleString()}`, 14, finalY);
    doc.text(`Kiasi Kilicholipwa: ${settings.currency} ${layaway.amountPaid.toLocaleString()}`, 14, finalY + 7);
    doc.text(`Salio Linalodaiwa: ${settings.currency} ${layaway.remainingBalance.toLocaleString()}`, 14, finalY + 14);

    doc.save(`Layaway_${layaway.customerName.replace(/\s+/g, '_')}_${layaway.id}.pdf`);
  };

  const handleAddItemToNewLayaway = () => {
    setErrorMessage('');
    if (!selectedProductId) {
      setErrorMessage('Chagua bidhaa kwa kwanza.');
      return;
    }
    if (quantity <= 0) {
      setErrorMessage('Idadi lazima iwe zaidi ya 0.');
      return;
    }

    const product = products.find((p: Product) => p.id === selectedProductId);
    if (!product || product.stockQuantity < quantity) {
      setErrorMessage('Bidhaa haitoshi stoo au haipatikani.');
      return;
    }

    setNewLayawayItems(prev => {
      const existingItem = prev.find(item => item.productId === selectedProductId);
      if (existingItem) {
        return prev.map(item => item.productId === selectedProductId ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { productId: product.id, name: product.name, quantity, unitPrice: product.sellingPrice, delivered: 0 }];
    });

    setSelectedProductId('');
    setQuantity(1);
  };

  const handleRemoveNewItem = (productId: string) => {
    setNewLayawayItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleCreateDelivery = async () => {
    if (!selectedDeliveryLayaway) return;
    const hasDelivery = Object.values(deliveryQuantities).some((q: number) => q > 0);
    if (!hasDelivery) {
      setErrorMessage('Tafadhali weka idadi ya bidhaa zinazosafirishwa.');
      return;
    }

    const updatedItems = selectedDeliveryLayaway.items.map(item => {
      const deliveredNow = deliveryQuantities[item.productId] || 0;
      const remaining = item.quantity - (item.delivered || 0);
      if (deliveredNow > remaining) {
        setErrorMessage(`Idadi ya ${item.name} imezidi kiasi kinachobaki.`);
        throw new Error(`Idadi ya ${item.name} imezidi kiasi kinachobaki.`);
      }
      return {
        ...item,
        delivered: (item.delivered || 0) + deliveredNow
      };
    });

    const deliveryItems = updatedItems
      .filter(item => (deliveryQuantities[item.productId] || 0) > 0)
      .map(item => ({ name: item.name, quantity: deliveryQuantities[item.productId] || 0 }));

    const newDeliveryPhase = {
      id: `DEL-${Date.now()}`,
      date: new Date().toISOString(),
      items: deliveryItems,
      driverInfo: deliveryDriverInfo,
      notes: deliveryNotes
    };

    const updatedLayaway = {
      ...selectedDeliveryLayaway,
      items: updatedItems,
      deliveries: selectedDeliveryLayaway.deliveries ? [...selectedDeliveryLayaway.deliveries, newDeliveryPhase] : [newDeliveryPhase]
    };

    try {
      await localDb.put('layaways', updatedLayaway);
      setLayaways(prev => prev.map(l => l.id === updatedLayaway.id ? updatedLayaway : l));
      setSelectedDeliveryLayaway(updatedLayaway);
      setIsDeliveryModalOpen(false);
      setDeliveryQuantities({});
      setDeliveryDriverInfo('');
      setDeliveryNotes('');
      if (setSaveStatus) setSaveStatus('saved');
    } catch (error) {
      if (!(error instanceof Error && error.message.startsWith('Idadi ya'))) {
        console.error(error);
        setErrorMessage('Kuna tatizo wakati wa kuhifadhi ufuatiliaji wa usafirishaji.');
      }
      if (setSaveStatus) setSaveStatus('error');
    }
  };

  const handleAddItemToExistingLayaway = async () => {
    if (!selectedAddItemLayaway || !addItemProductId) return;
    
    const product = products.find(p => p.id === addItemProductId);
    if (!product) {
      setErrorMessage('Bidhaa haipatikani.');
      return;
    }
    
    if (product.stockQuantity < addItemQuantity) {
      setErrorMessage('Idadi ya bidhaa kwenye stoo haitoshi.');
      return;
    }

    // Check if item already exists in layaway
    const existingItemIndex = selectedAddItemLayaway.items.findIndex(item => item.productId === addItemProductId);
    let updatedItems;
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      updatedItems = selectedAddItemLayaway.items.map((item, index) => 
        index === existingItemIndex 
          ? { ...item, quantity: item.quantity + addItemQuantity }
          : item
      );
    } else {
      // Add new item
      const newItem = {
        productId: addItemProductId,
        name: product.name,
        quantity: addItemQuantity,
        unitPrice: product.sellingPrice,
        delivered: 0
      };
      updatedItems = [...selectedAddItemLayaway.items, newItem];
    }

    const newTotalAmount = updatedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const newRemainingBalance = newTotalAmount - selectedAddItemLayaway.amountPaid;

    const updatedLayaway = {
      ...selectedAddItemLayaway,
      items: updatedItems,
      totalAmount: newTotalAmount,
      remainingBalance: newRemainingBalance
    };

    try {
      await localDb.put('layaways', updatedLayaway);
      
      setLayaways(prev => prev.map(l => l.id === updatedLayaway.id ? updatedLayaway : l));
      
      setIsAddItemModalOpen(false);
      setSelectedAddItemLayaway(null);
      setAddItemProductId('');
      setAddItemQuantity(1);
      
      if (setSaveStatus) setSaveStatus('saved');
    } catch (error) {
      console.error(error);
      setErrorMessage('Kuna tatizo wakati wa kuongeza bidhaa.');
      if (setSaveStatus) setSaveStatus('error');
    }
  };

  const isOverdue = (dateStr: string) => new Date(dateStr) < new Date();

  const getShippingProgress = (layaway: Layaway) => {
    const totalQuantity = layaway.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalDelivered = layaway.items.reduce((sum, item) => sum + (item.delivered || 0), 0);
    const percentShipped = Math.min(100, (totalDelivered / Math.max(1, totalQuantity)) * 100);
    return { totalQuantity, totalDelivered, percentShipped, totalPending: totalQuantity - totalDelivered };
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HandCoins className="text-purple-500" /> Lipa Mdogo Mdogo
          </h2>
          <p className="text-slate-500 text-xs font-medium mt-1">Mfumo wa wateja kulipia kidogo kidogo (Layaway).</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsNewModalOpen(true)}
            className={`px-4 py-2 ${theme.bg} text-white ${radiusClass} font-bold text-xs flex items-center gap-2 shadow-sm hover:opacity-90 transition-opacity`}
          >
            <Plus size={16} /> Mteja Mpya
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            {errorMessage}
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-rose-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        {[
          { id: LayawayStatus.ACTIVE, label: 'Wanaolipa', icon: Clock },
          { id: LayawayStatus.COMPLETED, label: 'Waliomaliza', icon: CheckCircle2 },
          { id: LayawayStatus.CANCELLED, label: 'Walioghairi', icon: XCircle }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === tab.id 
                ? `border-${theme.color}-500 text-${theme.color}-600` 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Tafuta kwa jina, simu, au bidhaa..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-3 bg-white border border-slate-200 ${radiusClass} text-sm focus:outline-none focus:ring-2 focus:ring-${theme.color}-500/20 focus:border-${theme.color}-500`}
        />
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedLayaways.map((layaway: Layaway) => (
          <div key={layaway.id} className={`bg-white border border-slate-200 ${radiusClass} p-5 shadow-sm flex flex-col`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-1">
                  <User size={14} className="text-slate-400"/> {layaway.customerName}
                </h3>
              </div>
              <span className={`px-2 py-1 text-[10px] font-black uppercase rounded ${
                layaway.status === LayawayStatus.ACTIVE ? (isOverdue(layaway.deadlineDate) ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600') :
                layaway.status === LayawayStatus.COMPLETED ? 'bg-emerald-100 text-emerald-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {layaway.status === LayawayStatus.ACTIVE && isOverdue(layaway.deadlineDate) ? 'MUDA UMEPITA' : layaway.status}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg mb-4">
              <div className="space-y-2">
                {layaway.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-700">{item.name} (x{item.quantity})</p>
                    {item.delivered && item.delivered > 0 && (
                      <span className="text-[10px] text-emerald-600 font-bold">
                        {item.delivered} zimefika
                      </span>
                    )}
                  </div>
                ))}
                {layaway.items.length > 1 && (
                  <p className="text-[10px] text-slate-500 font-bold mt-1">
                    Jumla ya bidhaa: {layaway.items.length}
                  </p>
                )}
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-200">
                <span>Jumla: <strong className="text-slate-900">{settings.currency} {layaway.totalAmount.toLocaleString()}</strong></span>
                <span>Salio: <strong className="text-rose-600">{settings.currency} {layaway.remainingBalance.toLocaleString()}</strong></span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                <div 
                  className={`h-1.5 rounded-full ${layaway.status === LayawayStatus.COMPLETED ? 'bg-emerald-500' : theme.bg}`} 
                  style={{ width: `${(layaway.amountPaid / layaway.totalAmount) * 100}%` }}
                ></div>
              </div>

              <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[10px] text-slate-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-slate-800">Bidhaa zilizosafirishwa</span>
                  <span>{getShippingProgress(layaway).totalDelivered} / {getShippingProgress(layaway).totalQuantity}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-black text-slate-800">Zilizosalia kusafirishwa</span>
                  <span>{getShippingProgress(layaway).totalPending}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div 
                    className="h-1.5 rounded-full bg-indigo-500"
                    style={{ width: `${getShippingProgress(layaway).percentShipped}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <CalendarDays size={12} /> Mwisho: {new Date(layaway.deadlineDate).toLocaleDateString()}
              </div>
              
              {layaway.status === LayawayStatus.ACTIVE && (
                <div className="flex gap-2 flex-wrap">
                  <button 
                    onClick={() => generatePDF(layaway)}
                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Chapisha Risiti"
                  >
                    <Printer size={16} />
                  </button>
                  <button 
                    onClick={() => handleCancelLayaway(layaway)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Ghairi"
                  >
                    <XCircle size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedLayaway(layaway);
                      setIsPaymentModalOpen(true);
                    }}
                    className={`px-3 py-1.5 ${theme.bg} text-white rounded-lg text-[10px] font-bold shadow-sm hover:opacity-90`}
                  >
                    Weka Malipo
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedAddItemLayaway(layaway);
                      setAddItemProductId('');
                      setAddItemQuantity(1);
                      setIsAddItemModalOpen(true);
                    }}
                    className={`px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold shadow-sm hover:bg-emerald-200`}
                  >
                    + Ongeza Bidhaa
                  </button>
                  <button 
                    onClick={async () => {
                      const previewLink = `${window.location.origin}${window.location.pathname}?preview=${layaway.id}`;
                      try {
                        await navigator.clipboard.writeText(previewLink);
                        setCopiedPreviewId(layaway.id);
                      } catch (error) {
                        console.error('Copy failed', error);
                      }
                    }}
                    className={`px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold shadow-sm hover:bg-slate-200 border border-slate-200`}
                  >
                    Previa Link
                  </button>
                  {layaway.remainingBalance <= 0 && (
                    <button 
                      onClick={() => {
                        setSelectedDeliveryLayaway(layaway);
                        setDeliveryQuantities({});
                        setDeliveryDriverInfo('');
                        setDeliveryNotes('');
                        setIsDeliveryModalOpen(true);
                      }}
                      className={`px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold shadow-sm hover:bg-indigo-200 border border-indigo-200`}
                    >
                      Fuatilia Usafirishaji
                    </button>
                  )}
                  {copiedPreviewId === layaway.id && (
                    <span className="text-[10px] text-emerald-300">Link ya preview imekopiwa</span>
                  )}
                </div>
              )}
              {layaway.status !== LayawayStatus.ACTIVE && (
                <button 
                  onClick={() => generatePDF(layaway)}
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Chapisha Risiti"
                >
                  <Printer size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
        {displayedLayaways.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 flex flex-col items-center">
            <HandCoins size={48} className="mb-4 opacity-20" />
            <p>Hakuna rekodi zilizopatikana.</p>
          </div>
        )}
      </div>

      {visibleCount < filteredLayaways.length && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisibleCount(prev => prev + 20)}
            className={`px-6 py-3 bg-white border border-slate-200 ${radiusClass} text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm`}
          >
            <ChevronDown size={16} /> Onyesha Zaidi ({filteredLayaways.length - visibleCount} zimebaki)
          </button>
        </div>
      )}

      {/* New Layaway Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white w-full max-w-md ${radiusClass} shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 flex items-center gap-2"><Plus size={18} className={`text-${theme.color}-500`}/> Anzisha Layaway Mpya</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Taarifa za Mteja Mpya</h4>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Jina Kamili</label>
                  <input type="text" placeholder="Mf. Juma Jux" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm font-bold text-emerald-700 outline-none focus:border-emerald-600 placeholder:text-emerald-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Namba ya Simu</label>
                    <input type="text" placeholder="Mf. 0700000000" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm font-bold text-emerald-700 outline-none focus:border-emerald-600 placeholder:text-emerald-400" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Eneo / Makazi</label>
                    <input type="text" placeholder="Mf. Kariakoo" value={newCustomerLocation} onChange={e => setNewCustomerLocation(e.target.value)} className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm font-bold text-emerald-700 outline-none focus:border-emerald-600 placeholder:text-emerald-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Namba ya Kitambulisho (NIDA/Kura) - Hiari</label>
                  <input type="text" placeholder="Mf. 19900101-12345-00001-1" value={newCustomerID} onChange={e => setNewCustomerID(e.target.value)} className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm font-bold text-emerald-700 outline-none focus:border-emerald-600 placeholder:text-emerald-400" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Bidhaa</label>
                  <select 
                    value={selectedProductId} 
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm outline-none focus:border-emerald-600 text-emerald-700"
                  >
                    <option value="">-- Chagua Bidhaa --</option>
                    {products.filter((p: Product) => p.stockQuantity > 0).map((p: Product) => (
                      <option key={p.id} value={p.id}>{p.name} - {settings.currency} {p.sellingPrice.toLocaleString()} (Stoo: {p.stockQuantity})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Idadi</label>
                  <input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm outline-none focus:border-emerald-600 text-emerald-700" />
                </div>
              </div>

              <button
                onClick={handleAddItemToNewLayaway}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
              >
                Ongeza Bidhaa kwa Mpangilio
              </button>

              {newLayawayItems.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Bidhaa Zilizoongezwa</h4>
                    <span className="text-[10px] text-slate-400">{newLayawayItems.length} bidhaa</span>
                  </div>
                  <div className="space-y-2">
                    {newLayawayItems.map(item => (
                      <div key={item.productId} className="flex items-center justify-between gap-3 text-sm text-slate-700">
                        <div>
                          <p className="font-bold">{item.name}</p>
                          <p className="text-[10px] text-slate-500">{item.quantity} x {settings.currency} {item.unitPrice.toLocaleString()}</p>
                        </div>
                        <button onClick={() => handleRemoveNewItem(item.productId)} className="text-rose-500 text-[10px] font-black uppercase">Toa</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px] uppercase text-slate-500 font-black">
                    <span>Jumla ya Bidhaa</span>
                    <span>{settings.currency} {newLayawayItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Kiasi cha Kuanzia</label>
                  <input type="number" value={deposit} onChange={e => setDeposit(e.target.value)} placeholder="Kianzio" className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm outline-none focus:border-emerald-600 text-emerald-700" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Muda wa Kulipa (Siku)</label>
                  <input type="number" value={deadlineDays} onChange={e => setDeadlineDays(Number(e.target.value))} className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm outline-none focus:border-emerald-600 text-emerald-700" />
                </div>
              </div>

              <div className="bg-yellow-50 text-yellow-800 p-3 rounded-xl text-[10px] flex gap-2 items-start">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <p>Bidhaa hazitatoka stoo mpaka mteja amalize malipo yote. Hii rekodi ni ya makubaliano ya malipo tu.</p>
              </div>

              <button 
                onClick={handleCreateLayaway}
                className={`w-full py-3 ${theme.bg} text-white rounded-xl font-black uppercase text-xs shadow-md hover:opacity-90 transition-all`}
              >
                Hifadhi Layaway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {isPaymentModalOpen && selectedLayaway && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white w-full max-w-sm ${radiusClass} shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 flex items-center gap-2"><Receipt size={18} className={`text-${theme.color}-500`}/> Pokea Malipo</h3>
              <button onClick={() => { setIsPaymentModalOpen(false); setSelectedLayaway(null); }} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Salio Linalodaiwa</p>
                <p className="text-2xl font-black text-slate-900">{settings.currency} {selectedLayaway.remainingBalance.toLocaleString()}</p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Kiasi Anacholipa Sasa</label>
                <input 
                  type="number" 
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                  placeholder="Kiasi" 
                  className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-lg font-bold text-emerald-700 outline-none focus:border-emerald-600 placeholder:text-emerald-400" 
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Njia ya Malipo</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm font-bold text-emerald-700 outline-none focus:border-emerald-600"
                >
                  {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <button 
                onClick={handleAddPayment}
                className={`w-full py-3 ${theme.bg} text-white rounded-xl font-black uppercase text-xs shadow-md hover:opacity-90 transition-all`}
              >
                Hifadhi Malipo
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeliveryModalOpen && selectedDeliveryLayaway && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white w-full max-w-xl ${radiusClass} shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 flex items-center gap-2"><Truck size={18} className="text-indigo-500"/> Ufuatiliaji wa Usafirishaji wa {selectedDeliveryLayaway.customerName}</h3>
              <button onClick={() => { setIsDeliveryModalOpen(false); setSelectedDeliveryLayaway(null); }} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-4">
                <p className="text-xs font-black uppercase text-slate-500 tracking-wider">Bidhaa Zinazoweza Kusafirishwa</p>
                <div className="space-y-3">
                  {selectedDeliveryLayaway.items.map(item => {
                    const remaining = item.quantity - (item.delivered || 0);
                    return (
                      <div key={item.productId} className="grid grid-cols-1 md:grid-cols-[1fr_100px] gap-3 items-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <div>
                          <p className="text-sm font-black text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-500">Agizo: {item.quantity} | Imetolewa: {item.delivered || 0} | Kinachobaki: {remaining}</p>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={remaining}
                          value={deliveryQuantities[item.productId] || ''}
                          onChange={(e) => setDeliveryQuantities(prev => ({ ...prev, [item.productId]: Number(e.target.value) }))}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500"
                          placeholder="Kiasi"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Dereva / Maelezo ya Usafirishaji</label>
                  <input
                    type="text"
                    value={deliveryDriverInfo}
                    onChange={e => setDeliveryDriverInfo(e.target.value)}
                    placeholder="Mfano: Ali, 0700000000"
                    className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm font-bold text-emerald-700 outline-none focus:border-emerald-600 placeholder:text-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Maelezo ya Ziadi</label>
                  <textarea
                    value={deliveryNotes}
                    onChange={e => setDeliveryNotes(e.target.value)}
                    placeholder="Maelezo ya usafirishaji..."
                    className="w-full p-3 bg-white border-2 border-emerald-400 rounded-2xl text-sm font-bold text-emerald-700 outline-none focus:border-emerald-600 placeholder:text-emerald-400 h-24 resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateDelivery}
                className={`w-full py-3 ${theme.bg} text-white rounded-xl font-black uppercase text-xs shadow-md hover:opacity-90 transition-all`}
              >
                Hifadhi Ufuatiliaji
              </button>

              {selectedDeliveryLayaway.deliveries && selectedDeliveryLayaway.deliveries.length > 0 && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-3xl border border-slate-200">
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Historia ya Ufuatiliaji</h4>
                  {selectedDeliveryLayaway.deliveries.slice().reverse().map(delivery => (
                    <div key={delivery.id} className="bg-white border border-slate-200 rounded-2xl p-3">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mb-2">
                        <span>{new Date(delivery.date).toLocaleDateString()} {new Date(delivery.date).toLocaleTimeString()}</span>
                        {delivery.driverInfo && <span>{delivery.driverInfo}</span>}
                      </div>
                      <div className="text-[10px] text-slate-700 space-y-1">
                        {delivery.items.map((item, idx) => (
                          <p key={idx}>{item.name} - {item.quantity}</p>
                        ))}
                        {delivery.notes && <p className="italic text-slate-400">"{delivery.notes}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Item to Existing Layaway Modal */}
      {isAddItemModalOpen && selectedAddItemLayaway && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white w-full max-w-md ${radiusClass} shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 flex items-center gap-2"><Plus size={18} className="text-emerald-500"/> Ongeza Bidhaa kwa Layaway</h3>
              <button onClick={() => setIsAddItemModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="text-xs font-bold text-slate-700">Mteja: <span className="text-slate-900">{selectedAddItemLayaway.customerName}</span></p>
                <p className="text-xs text-slate-500 mt-1">Jumla ya sasa: {settings.currency} {selectedAddItemLayaway.totalAmount.toLocaleString()}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Chagua Bidhaa</label>
                <select
                  value={addItemProductId}
                  onChange={e => setAddItemProductId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500"
                >
                  <option value="">-- Chagua Bidhaa --</option>
                  {products
                    .filter((p: Product) => p.stockQuantity > 0)
                    .sort((a: Product, b: Product) => a.name.localeCompare(b.name))
                    .map((product: Product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {settings.currency} {product.sellingPrice.toLocaleString()} (Stoo: {product.stockQuantity})
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Idadi</label>
                <input
                  type="number"
                  min="1"
                  value={addItemQuantity}
                  onChange={e => setAddItemQuantity(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500"
                />
              </div>

              {addItemProductId && (
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <p className="text-xs font-bold text-emerald-800">
                    Jumla ya kuongeza: {settings.currency} {(products.find((p: Product) => p.id === addItemProductId)?.sellingPrice || 0) * addItemQuantity}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Jumla mpya: {settings.currency} {selectedAddItemLayaway.totalAmount + (products.find((p: Product) => p.id === addItemProductId)?.sellingPrice || 0) * addItemQuantity}
                  </p>
                </div>
              )}

              <button
                onClick={handleAddItemToExistingLayaway}
                disabled={!addItemProductId || addItemQuantity < 1}
                className={`w-full py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Ongeza Bidhaa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
