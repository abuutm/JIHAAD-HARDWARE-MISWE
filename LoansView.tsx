import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, Trash2, CheckCircle2, XCircle, Clock, 
  HandCoins, User, CalendarDays, Receipt, AlertTriangle,
  ArrowRight, Phone, X, Printer, CreditCard, ChevronDown, Calculator, Edit3, Truck, RotateCcw
} from 'lucide-react';
import { db } from './db';
import { Loan, LoanStatus, PaymentMethod, Product, Customer } from './types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function LoansView({ 
  loans, 
  setLoans, 
  products, 
  setProducts, 
  customers, 
  setCustomers,
  theme, 
  radiusClass, 
  settings, 
  setSaveStatus 
}: any) {
  const [activeTab, setActiveTab] = useState<LoanStatus>(LoanStatus.ACTIVE);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Calculator State
  const [calcAmount, setCalcAmount] = useState('');
  const [calcInterest, setCalcInterest] = useState('');
  const [calcDuration, setCalcDuration] = useState('');
  const [calcPeople, setCalcPeople] = useState(1);

  // New Loan Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerLocation, setNewCustomerLocation] = useState('');
  
  const [selectedProducts, setSelectedProducts] = useState<{product: Product, quantity: number, unitPrice: number}[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);

  const [loanAmount, setLoanAmount] = useState('');
  const [loanNotes, setLoanNotes] = useState('');
  const [dueDateDays, setDueDateDays] = useState(30);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  
  // Top-up Form State
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpNotes, setTopUpNotes] = useState('');
  const [topUpSelectedProducts, setTopUpSelectedProducts] = useState<{product: Product, quantity: number, unitPrice: number}[]>([]);
  const [topUpSelectedProductId, setTopUpSelectedProductId] = useState('');
  const [topUpProductQuantity, setTopUpProductQuantity] = useState(1);

  // Edit Notes Form State
  const [isEditNotesModalOpen, setIsEditNotesModalOpen] = useState(false);
  const [editNotesText, setEditNotesText] = useState('');

  // Delivery Form State
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryQuantities, setDeliveryQuantities] = useState<{[itemName: string]: number}>({});
  const [deliveryDriverInfo, setDeliveryDriverInfo] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Generic Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);

  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    setVisibleCount(20);
  }, [activeTab, searchTerm]);

  const filteredLoans = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return loans.filter((l: Loan) => 
      l.status === activeTab &&
      (l.customerName.toLowerCase().includes(lowerSearch) || 
       l.customerPhone.includes(searchTerm) ||
       (l.notes && l.notes.toLowerCase().includes(lowerSearch)))
    ).sort((a: Loan, b: Loan) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [loans, activeTab, searchTerm]);

  const displayedLoans = useMemo(() => {
    return filteredLoans.slice(0, visibleCount);
  }, [filteredLoans, visibleCount]);

  const handleAddProductToLoan = () => {
    if (!selectedProductId) return;
    const product = products.find((p: Product) => p.id === selectedProductId);
    if (!product) return;

    if (productQuantity <= 0) {
      alert("Idadi lazima iwe zaidi ya 0.");
      return;
    }

    if (productQuantity > product.stockQuantity) {
      alert("Bidhaa haitoshi stoo!");
      return;
    }

    const existingIndex = selectedProducts.findIndex(p => p.product.id === selectedProductId);
    let newSelectedProducts = [...selectedProducts];

    if (existingIndex >= 0) {
      const newQuantity = newSelectedProducts[existingIndex].quantity + productQuantity;
      if (newQuantity > product.stockQuantity) {
        alert("Bidhaa haitoshi stoo!");
        return;
      }
      newSelectedProducts[existingIndex].quantity = newQuantity;
    } else {
      newSelectedProducts.push({
        product,
        quantity: productQuantity,
        unitPrice: product.sellingPrice
      });
    }

    setSelectedProducts(newSelectedProducts);
    
    // Auto-update loan amount
    const totalProductsValue = newSelectedProducts.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    setLoanAmount(totalProductsValue.toString());
    
    setSelectedProductId('');
    setProductQuantity(1);
  };

  const handleRemoveProductFromLoan = (productId: string) => {
    const newSelectedProducts = selectedProducts.filter(p => p.product.id !== productId);
    setSelectedProducts(newSelectedProducts);
    
    // Auto-update loan amount
    const totalProductsValue = newSelectedProducts.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    setLoanAmount(totalProductsValue.toString());
  };

  const handleAddProductToTopUp = () => {
    if (!topUpSelectedProductId) return;
    const product = products.find((p: Product) => p.id === topUpSelectedProductId);
    if (!product) return;

    if (topUpProductQuantity <= 0) {
      alert("Idadi lazima iwe zaidi ya 0.");
      return;
    }

    if (topUpProductQuantity > product.stockQuantity) {
      alert("Bidhaa haitoshi stoo!");
      return;
    }

    const existingIndex = topUpSelectedProducts.findIndex(p => p.product.id === topUpSelectedProductId);
    let newSelectedProducts = [...topUpSelectedProducts];

    if (existingIndex >= 0) {
      const newQuantity = newSelectedProducts[existingIndex].quantity + topUpProductQuantity;
      if (newQuantity > product.stockQuantity) {
        alert("Bidhaa haitoshi stoo!");
        return;
      }
      newSelectedProducts[existingIndex].quantity = newQuantity;
    } else {
      newSelectedProducts.push({
        product,
        quantity: topUpProductQuantity,
        unitPrice: product.sellingPrice
      });
    }

    setTopUpSelectedProducts(newSelectedProducts);
    
    // Auto-update top-up amount
    const totalProductsValue = newSelectedProducts.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    setTopUpAmount(totalProductsValue.toString());
    
    setTopUpSelectedProductId('');
    setTopUpProductQuantity(1);
  };

  const handleRemoveProductFromTopUp = (productId: string) => {
    const newSelectedProducts = topUpSelectedProducts.filter(p => p.product.id !== productId);
    setTopUpSelectedProducts(newSelectedProducts);
    
    // Auto-update top-up amount
    const totalProductsValue = newSelectedProducts.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    setTopUpAmount(totalProductsValue.toString());
  };

  const handleTopUpLoan = async () => {
    if (!selectedLoan) return;
    
    const addedAmount = Number(topUpAmount) || 0;
    if (addedAmount <= 0 && topUpSelectedProducts.length === 0) {
      alert("Tafadhali weka kiasi au chagua bidhaa.");
      return;
    }

    if (setSaveStatus) setSaveStatus('saving');

    // Deduct stock for selected products
    const updatedProducts = [...products];
    for (const item of topUpSelectedProducts) {
      const productIndex = updatedProducts.findIndex(p => p.id === item.product.id);
      if (productIndex >= 0) {
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          stockQuantity: updatedProducts[productIndex].stockQuantity - item.quantity
        };
        try {
          await db.put('products', updatedProducts[productIndex]);
        } catch (e) {
          console.error("Failed to update product stock", e);
        }
      }
    }
    if (setProducts) setProducts(updatedProducts);

    const newAmount = selectedLoan.amount + addedAmount;
    const newBalance = selectedLoan.remainingBalance + addedAmount;
    
    const newItems = selectedLoan.items ? [...selectedLoan.items] : [];
    topUpSelectedProducts.forEach(sp => {
      newItems.push({
        name: sp.product.name,
        quantity: sp.quantity,
        unitPrice: sp.unitPrice,
        unitCost: sp.product.costPrice
      });
    });

    const updatedNotes = selectedLoan.notes 
      ? `${selectedLoan.notes}\n[${new Date().toLocaleDateString()}] Nyongeza: ${settings.currency} ${addedAmount.toLocaleString()}. ${topUpNotes}`
      : `[${new Date().toLocaleDateString()}] Nyongeza: ${settings.currency} ${addedAmount.toLocaleString()}. ${topUpNotes}`;

    const updatedLoan = {
      ...selectedLoan,
      amount: newAmount,
      remainingBalance: newBalance,
      items: newItems,
      notes: updatedNotes
    };

    try {
      await db.put('loans', updatedLoan);
      setLoans((prev: any) => prev.map((l: Loan) => l.id === updatedLoan.id ? updatedLoan : l));
      
      setIsTopUpModalOpen(false);
      setSelectedLoan(null);
      setTopUpAmount('');
      setTopUpNotes('');
      setTopUpSelectedProducts([]);
      if (setSaveStatus) setSaveStatus('saved');
    } catch (e) {
      console.error(e);
      if (setSaveStatus) setSaveStatus('error');
    }
  };

  const handleCreateLoan = async () => {
    let customerName = '';
    let customerPhone = '';

    if (selectedCustomerId) {
      const customer = customers.find((c: Customer) => c.id === selectedCustomerId);
      if (customer) {
        customerName = customer.name;
        customerPhone = customer.phone;
      }
    } else {
      if (!newCustomerName) {
        alert("Tafadhali chagua mteja au sajili mteja mpya.");
        return;
      }
      customerName = newCustomerName;
      customerPhone = newCustomerPhone;
    }

    if (!loanAmount || Number(loanAmount) <= 0) {
      alert("Tafadhali weka kiasi sahihi cha mkopo.");
      return;
    }

    if (setSaveStatus) setSaveStatus('saving');

    const amount = Number(loanAmount);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDateDays);

    // Register new customer if needed
    if (!selectedCustomerId && newCustomerName) {
      const newCustomerId = `CUST-${Date.now()}`;
      const newCustomer: Customer = {
        id: newCustomerId,
        name: newCustomerName,
        email: '',
        phone: newCustomerPhone,
        address: newCustomerLocation,
        totalSpent: 0
      };
      try {
        await db.put('customers', newCustomer);
        if (setCustomers) setCustomers((prev: any) => [...prev, newCustomer]);
      } catch (e) {
        console.error("Failed to save new customer", e);
      }
    }

    // Deduct stock for selected products
    const updatedProducts = [...products];
    for (const item of selectedProducts) {
      const productIndex = updatedProducts.findIndex(p => p.id === item.product.id);
      if (productIndex >= 0) {
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          stockQuantity: updatedProducts[productIndex].stockQuantity - item.quantity
        };
        try {
          await db.put('products', updatedProducts[productIndex]);
        } catch (e) {
          console.error("Failed to update product stock", e);
        }
      }
    }
    if (setProducts) setProducts(updatedProducts);

    const newLoan: Loan = {
      id: `LOAN-${Date.now()}`,
      customerName: customerName,
      customerPhone: customerPhone,
      amount: amount,
      amountPaid: 0,
      remainingBalance: amount,
      payments: [],
      startDate: new Date().toISOString(),
      dueDate: dueDate.toISOString(),
      status: LoanStatus.ACTIVE,
      notes: loanNotes,
      items: selectedProducts.map(sp => ({
        name: sp.product.name,
        quantity: sp.quantity,
        unitPrice: sp.unitPrice,
        unitCost: sp.product.costPrice
      }))
    };

    try {
      await db.put('loans', newLoan);
      setLoans((prev: any) => [...prev, newLoan]);
      
      setIsNewModalOpen(false);
      if (setSaveStatus) setSaveStatus('saved');
      
      // Reset form
      setSelectedCustomerId('');
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerLocation('');
      setSelectedProducts([]);
      setLoanAmount('');
      setLoanNotes('');
      setDueDateDays(30);
    } catch (e) {
      console.error(e);
      if (setSaveStatus) setSaveStatus('error');
    }
  };

  const handleAddPayment = async () => {
    if (!selectedLoan || !paymentAmount) return;
    
    const amount = Number(paymentAmount);
    if (amount <= 0 || amount > selectedLoan.remainingBalance) {
      alert("Kiasi si sahihi.");
      return;
    }

    if (setSaveStatus) setSaveStatus('saving');

    const newPayment = {
      id: `PAY-${Date.now()}`,
      date: new Date().toISOString(),
      amount,
      method: paymentMethod
    };

    const newAmountPaid = selectedLoan.amountPaid + amount;
    const newBalance = selectedLoan.amount - newAmountPaid;
    
    const updatedLoan = {
      ...selectedLoan,
      amountPaid: newAmountPaid,
      remainingBalance: newBalance,
      payments: [...selectedLoan.payments, newPayment],
      status: newBalance <= 0 ? LoanStatus.PAID : selectedLoan.status
    };

    try {
      await db.put('loans', updatedLoan);
      setLoans((prev: any) => prev.map((l: Loan) => l.id === updatedLoan.id ? updatedLoan : l));
      
      setIsPaymentModalOpen(false);
      setSelectedLoan(null);
      setPaymentAmount('');
      if (setSaveStatus) setSaveStatus('saved');
    } catch (e) {
      console.error(e);
      if (setSaveStatus) setSaveStatus('error');
    }
  };

  const handleMarkDefaulted = async (loan: Loan) => {
    setConfirmDialog({
      isOpen: true,
      message: "Una uhakika unataka kuweka mkopo huu kama 'Umeshindikana' (Defaulted)?",
      onConfirm: async () => {
        if (setSaveStatus) setSaveStatus('saving');

        const updatedLoan = { ...loan, status: LoanStatus.DEFAULTED };
        
        try {
          await db.put('loans', updatedLoan);
          setLoans((prev: any) => prev.map((l: Loan) => l.id === loan.id ? updatedLoan : l));
          if (setSaveStatus) setSaveStatus('saved');
        } catch (e) {
          console.error(e);
          if (setSaveStatus) setSaveStatus('error');
        }
      }
    });
  };

  const handleDeleteLoan = async (loan: Loan) => {
    setConfirmDialog({
      isOpen: true,
      message: "Una uhakika unataka kufuta mkopo huu kabisa? Kitendo hiki hakiwezi kutenguliwa.",
      onConfirm: async () => {
        if (setSaveStatus) setSaveStatus('saving');
        
        try {
          await db.delete('loans', loan.id);
          setLoans((prev: any) => prev.filter((l: Loan) => l.id !== loan.id));
          if (setSaveStatus) setSaveStatus('saved');
        } catch (e) {
          console.error(e);
          if (setSaveStatus) setSaveStatus('error');
        }
      }
    });
  };

  const handleSaveNotes = async () => {
    if (!selectedLoan) return;
    if (setSaveStatus) setSaveStatus('saving');

    const updatedLoan = { ...selectedLoan, notes: editNotesText };

    try {
      await db.put('loans', updatedLoan);
      setLoans((prev: any) => prev.map((l: Loan) => l.id === updatedLoan.id ? updatedLoan : l));
      
      setIsEditNotesModalOpen(false);
      setSelectedLoan(null);
      setEditNotesText('');
      if (setSaveStatus) setSaveStatus('saved');
    } catch (e) {
      console.error(e);
      if (setSaveStatus) setSaveStatus('error');
    }
  };

  const handleCreateDelivery = async () => {
    if (!selectedLoan || !selectedLoan.items) return;
    
    // Check if any quantity is > 0
    const hasDelivery = Object.values(deliveryQuantities).some((q: number) => q > 0);
    if (!hasDelivery) {
      alert("Tafadhali weka idadi ya bidhaa zinazosafirishwa.");
      return;
    }

    if (setSaveStatus) setSaveStatus('saving');

    const deliveryItems = Object.entries(deliveryQuantities)
      .filter(([_, q]: [string, number]) => q > 0)
      .map(([name, q]) => ({ name, quantity: q }));

    const newDeliveryPhase = {
      id: `DEL-${Date.now()}`,
      date: new Date().toISOString(),
      items: deliveryItems,
      driverInfo: deliveryDriverInfo,
      notes: deliveryNotes
    };

    // Update delivered quantities in loan items
    const updatedItems = selectedLoan.items.map(item => {
      const deliveredNow = deliveryQuantities[item.name] || 0;
      return {
        ...item,
        delivered: (item.delivered || 0) + deliveredNow
      };
    });

    const updatedDeliveries = selectedLoan.deliveries ? [...selectedLoan.deliveries, newDeliveryPhase] : [newDeliveryPhase];

    const updatedLoan = {
      ...selectedLoan,
      items: updatedItems,
      deliveries: updatedDeliveries
    };

    try {
      await db.put('loans', updatedLoan);
      setLoans((prev: any) => prev.map((l: Loan) => l.id === updatedLoan.id ? updatedLoan : l));
      
      setIsDeliveryModalOpen(false);
      setSelectedLoan(null);
      setDeliveryQuantities({});
      setDeliveryDriverInfo('');
      setDeliveryNotes('');
      if (setSaveStatus) setSaveStatus('saved');
    } catch (e) {
      console.error(e);
      if (setSaveStatus) setSaveStatus('error');
    }
  };

  const handleResetDeliveries = async () => {
    if (!selectedLoan) return;
    
    setConfirmDialog({
      isOpen: true,
      message: "Una uhakika unataka kufuta historia yote ya usafirishaji kwa mkopo huu? Kitendo hiki hakiwezi kutenguliwa.",
      onConfirm: async () => {
        if (setSaveStatus) setSaveStatus('saving');

        // Reset items' delivered count
        const updatedItems = selectedLoan.items?.map(item => ({
          ...item,
          delivered: 0
        }));

        const updatedLoan = {
          ...selectedLoan,
          items: updatedItems,
          deliveries: []
        };

        try {
          await db.put('loans', updatedLoan);
          setLoans((prev: any) => prev.map((l: Loan) => l.id === updatedLoan.id ? updatedLoan : l));
          
          // Update selectedLoan so the modal reflects the changes immediately
          setSelectedLoan(updatedLoan);
          
          // Clear the form fields
          setDeliveryQuantities({});
          setDeliveryDriverInfo('');
          setDeliveryNotes('');
          
          if (setSaveStatus) setSaveStatus('saved');
        } catch (e) {
          console.error(e);
          if (setSaveStatus) setSaveStatus('error');
        }
      }
    });
  };

  const generatePDF = (loan: Loan) => {
    const doc = new jsPDF();
    
    // Header - Creative Design
    doc.setFillColor(41, 128, 185); // A nice blue header background
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    // Title requested by user
    doc.text("RIPOTI YA BIDHAA AMBAZO ZIMETOKA", 105, 18, { align: "center" });
    doc.text("LAKINI BADO HAZIJALIPIWA", 105, 26, { align: "center" });
    
    // Reset text color for body
    doc.setTextColor(50, 50, 50);
    
    // Customer Info Box
    doc.setFillColor(245, 247, 250);
    doc.rect(14, 45, 182, 35, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(14, 45, 182, 35, 'S');
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TAARIFA ZA MTEJA NA MKOPO", 18, 52);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Jina la Mteja: ${loan.customerName}`, 18, 60);
    doc.text(`Simu: ${loan.customerPhone || 'N/A'}`, 18, 67);
    doc.text(`Tarehe: ${new Date(loan.startDate).toLocaleDateString()}`, 110, 60);
    doc.text(`Kumbukumbu: ${loan.id}`, 110, 67);
    
    if (loan.notes) {
      doc.text(`Maelezo: ${loan.notes}`, 18, 74);
    }

    let startY = 90;

    // Items Table
    doc.setFont("helvetica", "bold");
    doc.text("ORODHA YA BIDHAA ZILIZOCHUKULIWA:", 14, startY);
    
    const tableBody = [];
    if (loan.items && loan.items.length > 0) {
      loan.items.forEach((item, index) => {
        tableBody.push([
          index + 1,
          item.name,
          item.quantity,
          `${settings.currency} ${item.unitPrice.toLocaleString()}`,
          `${settings.currency} ${(item.quantity * item.unitPrice).toLocaleString()}`
        ]);
      });
    } else {
      // Fallback if no items were specifically selected (just a cash loan)
      tableBody.push([
        1,
        "Mkopo wa Kawaida / Taslimu",
        "-",
        "-",
        `${settings.currency} ${loan.amount.toLocaleString()}`
      ]);
    }

    autoTable(doc, {
      startY: startY + 5,
      head: [['Na.', 'Bidhaa', 'Idadi', 'Bei', 'Jumla']],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });

    startY = (doc as any).lastAutoTable.finalY + 15;

    // Payments Table
    if (loan.payments && loan.payments.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("HISTORIA YA MALIPO:", 14, startY);
      
      autoTable(doc, {
        startY: startY + 5,
        head: [['Tarehe', 'Njia ya Malipo', 'Kiasi']],
        body: loan.payments.map(p => [
          new Date(p.date).toLocaleDateString(),
          p.method,
          `${settings.currency} ${p.amount.toLocaleString()}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [46, 204, 113], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 }
      });
      startY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Summary Box
    doc.setFillColor(245, 247, 250);
    doc.rect(110, startY, 86, 35, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(110, startY, 86, 35, 'S');

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Jumla ya Deni:", 115, startY + 10);
    doc.text("Kiasi Kilicholipwa:", 115, startY + 18);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(231, 76, 60); // Red for remaining balance
    doc.text("Salio Linalodaiwa:", 115, startY + 28);

    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text(`${settings.currency} ${loan.amount.toLocaleString()}`, 190, startY + 10, { align: "right" });
    doc.text(`${settings.currency} ${loan.amountPaid.toLocaleString()}`, 190, startY + 18, { align: "right" });
    
    doc.setTextColor(231, 76, 60);
    doc.text(`${settings.currency} ${loan.remainingBalance.toLocaleString()}`, 190, startY + 28, { align: "right" });

    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Asante kwa kufanya biashara na sisi. Tafadhali kamilisha malipo yako kwa wakati.", 105, 285, { align: "center" });

    doc.save(`Ripoti_Deni_${loan.customerName.replace(/\s+/g, '_')}_${loan.id}.pdf`);
  };

  const isOverdue = (dateStr: string) => new Date(dateStr) < new Date();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="text-blue-500" /> Mikopo na Madeni
          </h2>
          <p className="text-slate-500 text-xs font-medium mt-1">Dhibiti mikopo ya wateja na madeni yao.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsCalculatorOpen(true)}
            className={`px-4 py-2 bg-white border border-slate-200 text-slate-700 ${radiusClass} font-bold text-xs flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-colors`}
          >
            <Calculator size={16} /> Kikokotoo
          </button>
          <button 
            onClick={() => setIsNewModalOpen(true)}
            className={`px-4 py-2 ${theme.bg} text-white ${radiusClass} font-bold text-xs flex items-center gap-2 shadow-sm hover:opacity-90 transition-opacity`}
          >
            <Plus size={16} /> Mkopo Mpya
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        {[
          { id: LoanStatus.ACTIVE, label: 'Wanaodaiwa', icon: Clock },
          { id: LoanStatus.PAID, label: 'Waliolipa', icon: CheckCircle2 },
          { id: LoanStatus.DEFAULTED, label: 'Waliokwama', icon: AlertTriangle }
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
          placeholder="Tafuta kwa jina, simu, au maelezo..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-3 bg-white border border-slate-200 ${radiusClass} text-sm focus:outline-none focus:ring-2 focus:ring-${theme.color}-500/20 focus:border-${theme.color}-500`}
        />
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedLoans.map((loan: Loan) => (
          <div key={loan.id} className={`bg-white border border-slate-200 ${radiusClass} p-5 shadow-sm flex flex-col`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-1">
                  <User size={14} className="text-slate-400"/> {loan.customerName}
                </h3>
                {loan.customerPhone && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Phone size={12} /> {loan.customerPhone}
                  </p>
                )}
              </div>
              <span className={`px-2 py-1 text-[10px] font-black uppercase rounded ${
                loan.status === LoanStatus.ACTIVE ? (isOverdue(loan.dueDate) ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600') :
                loan.status === LoanStatus.PAID ? 'bg-emerald-100 text-emerald-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {loan.status === LoanStatus.ACTIVE && isOverdue(loan.dueDate) ? 'MUDA UMEPITA' : loan.status}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg mb-4 relative group">
              {loan.notes ? (
                <div className="flex justify-between items-start">
                  <p className="text-xs text-slate-600 italic mb-2 pr-6">"{loan.notes}"</p>
                  <button 
                    onClick={() => {
                      setSelectedLoan(loan);
                      setEditNotesText(loan.notes || '');
                      setIsEditNotesModalOpen(true);
                    }}
                    className="text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                    title="Badili Maelezo"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs text-slate-400 italic">Hakuna maelezo</p>
                  <button 
                    onClick={() => {
                      setSelectedLoan(loan);
                      setEditNotesText('');
                      setIsEditNotesModalOpen(true);
                    }}
                    className="text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                    title="Weka Maelezo"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              )}

              {/* Delivery Progress Summary */}
              {loan.items && loan.items.length > 0 && (
                <div className="mb-3 pt-2 border-t border-slate-200">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                    <span className="flex items-center gap-1"><Truck size={12}/> Usafirishaji Mzigo</span>
                    <span>
                      {loan.items.reduce((acc, item) => acc + (item.delivered || 0), 0)} / {loan.items.reduce((acc, item) => acc + item.quantity, 0)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1">
                    <div 
                      className="h-1 rounded-full bg-blue-500" 
                      style={{ 
                        width: `${Math.min(100, (loan.items.reduce((acc, item) => acc + (item.delivered || 0), 0) / Math.max(1, loan.items.reduce((acc, item) => acc + item.quantity, 0))) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                <span>Jumla: <strong className="text-slate-900">{settings.currency} {loan.amount.toLocaleString()}</strong></span>
                <span>Salio: <strong className="text-rose-600">{settings.currency} {loan.remainingBalance.toLocaleString()}</strong></span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                <div 
                  className={`h-1.5 rounded-full ${loan.status === LoanStatus.PAID ? 'bg-emerald-500' : theme.bg}`} 
                  style={{ width: `${(loan.amountPaid / loan.amount) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <CalendarDays size={12} /> Mwisho: {new Date(loan.dueDate).toLocaleDateString()}
              </div>
              
              {loan.status === LoanStatus.ACTIVE && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => generatePDF(loan)}
                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Chapisha Risiti"
                  >
                    <Printer size={16} />
                  </button>
                  {loan.items && loan.items.length > 0 && (
                    <button 
                      onClick={() => {
                        setSelectedLoan(loan);
                        setDeliveryQuantities({});
                        setIsDeliveryModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Fuatilia Usafirishaji (Delivery)"
                    >
                      <Truck size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => handleMarkDefaulted(loan)}
                    className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Weka kama Imeshindikana"
                  >
                    <AlertTriangle size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteLoan(loan)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Futa Mkopo"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedLoan(loan);
                      setIsTopUpModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-[10px] font-bold shadow-sm transition-colors"
                  >
                    Ongeza Mkopo
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedLoan(loan);
                      setIsPaymentModalOpen(true);
                    }}
                    className={`px-3 py-1.5 ${theme.bg} text-white rounded-lg text-[10px] font-bold shadow-sm hover:opacity-90`}
                  >
                    Weka Malipo
                  </button>
                </div>
              )}
              {loan.status !== LoanStatus.ACTIVE && (
                <button 
                  onClick={() => generatePDF(loan)}
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Chapisha Risiti"
                >
                  <Printer size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
        {displayedLoans.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 flex flex-col items-center">
            <CreditCard size={48} className="mb-4 opacity-20" />
            <p>Hakuna rekodi zilizopatikana.</p>
          </div>
        )}
      </div>

      {visibleCount < filteredLoans.length && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisibleCount(prev => prev + 20)}
            className={`px-6 py-3 bg-white border border-slate-200 ${radiusClass} text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm`}
          >
            <ChevronDown size={16} /> Onyesha Zaidi ({filteredLoans.length - visibleCount} zimebaki)
          </button>
        </div>
      )}

      {/* New Loan Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white w-full max-w-2xl ${radiusClass} shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 flex items-center gap-2"><Plus size={18} className={`text-${theme.color}-500`}/> Sajili Mkopo Mpya</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Customer Section */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Taarifa za Mteja</h4>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Mteja</label>
                  <select 
                    value={selectedCustomerId} 
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      if (e.target.value) {
                        setNewCustomerName('');
                        setNewCustomerPhone('');
                        setNewCustomerLocation('');
                      }
                    }}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">-- Mteja Mpya (Sajili Hapa Chini) --</option>
                    {customers.map((c: Customer) => (
                      <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                    ))}
                  </select>
                </div>

                {!selectedCustomerId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Jina Kamili (Mteja Mpya)</label>
                      <input type="text" placeholder="Mf. Juma Jux" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Namba ya Simu</label>
                      <input type="text" placeholder="Mf. 0700000000" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Eneo / Makazi</label>
                      <input type="text" placeholder="Mf. Kariakoo" value={newCustomerLocation} onChange={e => setNewCustomerLocation(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                    </div>
                  </div>
                )}
              </div>

              {/* Products Section */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Bidhaa za Mkopo (Kama zipo)</h4>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Bidhaa</label>
                    <select 
                      value={selectedProductId} 
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">-- Chagua Bidhaa --</option>
                      {products.filter((p: Product) => p.stockQuantity > 0).map((p: Product) => (
                        <option key={p.id} value={p.id}>{p.name} - {settings.currency} {p.sellingPrice.toLocaleString()} (Stoo: {p.stockQuantity})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Idadi</label>
                    <input type="number" min="1" value={productQuantity} onChange={e => setProductQuantity(Number(e.target.value))} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                  </div>
                  <button 
                    onClick={handleAddProductToLoan}
                    className={`p-3 ${theme.bg} text-white rounded-xl hover:opacity-90`}
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {selectedProducts.length > 0 && (
                  <div className="mt-3 bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="p-2 font-bold text-slate-600">Bidhaa</th>
                          <th className="p-2 font-bold text-slate-600">Idadi</th>
                          <th className="p-2 font-bold text-slate-600">Bei</th>
                          <th className="p-2 font-bold text-slate-600">Jumla</th>
                          <th className="p-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedProducts.map((sp, idx) => (
                          <tr key={idx}>
                            <td className="p-2 text-slate-800">{sp.product.name}</td>
                            <td className="p-2 text-slate-800">{sp.quantity}</td>
                            <td className="p-2 text-slate-800">{settings.currency} {sp.unitPrice.toLocaleString()}</td>
                            <td className="p-2 font-bold text-slate-900">{settings.currency} {(sp.quantity * sp.unitPrice).toLocaleString()}</td>
                            <td className="p-2 text-right">
                              <button onClick={() => handleRemoveProductFromLoan(sp.product.id)} className="text-rose-500 hover:text-rose-700">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Loan Details Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Kiasi cha Mkopo (Jumla)</label>
                  <input type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} placeholder="Kiasi" className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm font-bold outline-none focus:border-emerald-600 text-emerald-700" />
                  <p className="text-[9px] text-slate-400 mt-1">Unaweza kubadili kiasi hiki kama ni tofauti na thamani ya bidhaa.</p>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Muda wa Kulipa (Siku)</label>
                  <input type="number" value={dueDateDays} onChange={e => setDueDateDays(Number(e.target.value))} className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm outline-none focus:border-emerald-600 text-emerald-700" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Maelezo (Si lazima)</label>
                <textarea 
                  placeholder="Mfano: Mkopo wa bati 10..." 
                  value={loanNotes} 
                  onChange={e => setLoanNotes(e.target.value)} 
                  className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm outline-none focus:border-emerald-600 h-20 resize-none text-emerald-700" 
                />
              </div>

              <button 
                onClick={handleCreateLoan}
                className={`w-full py-3 ${theme.bg} text-white rounded-xl font-black uppercase text-xs shadow-md hover:opacity-90 transition-all`}
              >
                Hifadhi Mkopo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {isPaymentModalOpen && selectedLoan && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white w-full max-w-sm ${radiusClass} shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 flex items-center gap-2"><Receipt size={18} className={`text-${theme.color}-500`}/> Pokea Malipo ya Mkopo</h3>
              <button onClick={() => { setIsPaymentModalOpen(false); setSelectedLoan(null); }} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Salio Linalodaiwa</p>
                <p className="text-2xl font-black text-slate-900">{settings.currency} {selectedLoan.remainingBalance.toLocaleString()}</p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Kiasi Anacholipa Sasa</label>
                <input 
                  type="number" 
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                  placeholder="Kiasi" 
                  className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-lg font-bold outline-none focus:border-emerald-600 text-emerald-700" 
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Njia ya Malipo</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm outline-none focus:border-emerald-600 text-emerald-700"
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

      {/* Calculator Modal */}
      {isCalculatorOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white w-full max-w-md ${radiusClass} shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 flex items-center gap-2"><Calculator size={18} className={`text-${theme.color}-500`}/> Kikokotoo cha Mkopo</h3>
              <button onClick={() => setIsCalculatorOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Kiasi cha Mkopo</label>
                <input type="number" value={calcAmount} onChange={e => setCalcAmount(e.target.value)} placeholder="Mf. 1000000" className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm outline-none focus:border-emerald-600 text-emerald-700" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Riba (%)</label>
                  <input type="number" value={calcInterest} onChange={e => setCalcInterest(e.target.value)} placeholder="Mf. 10" className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm outline-none focus:border-emerald-600 text-emerald-700" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Muda (Miezi)</label>
                  <input type="number" value={calcDuration} onChange={e => setCalcDuration(e.target.value)} placeholder="Mf. 12" className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm outline-none focus:border-emerald-600 text-emerald-700" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Idadi ya Watu Wanaolipa</label>
                <select 
                  value={calcPeople} 
                  onChange={e => setCalcPeople(Number(e.target.value))}
                  className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm outline-none focus:border-emerald-600 text-emerald-700"
                >
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </div>

              {calcAmount && calcInterest && calcDuration && (
                <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Jumla ya Riba:</span>
                    <span className="font-bold text-slate-800">{settings.currency} {((Number(calcAmount) * Number(calcInterest)) / 100).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Jumla ya Kulipa:</span>
                    <span className="font-bold text-slate-800">{settings.currency} {(Number(calcAmount) + (Number(calcAmount) * Number(calcInterest)) / 100).toLocaleString()}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-slate-400">Kila Mwezi{calcPeople > 1 ? ' (Jumla)' : ''}:</span>
                    <span className="text-lg font-black text-blue-600">{settings.currency} {((Number(calcAmount) + (Number(calcAmount) * Number(calcInterest)) / 100) / Number(calcDuration)).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                  </div>
                  {calcPeople > 1 && (
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-slate-400">Kila Mwezi (Kwa Mtu Mmoja):</span>
                      <span className="text-lg font-black text-emerald-600">{settings.currency} {(((Number(calcAmount) + (Number(calcAmount) * Number(calcInterest)) / 100) / Number(calcDuration)) / calcPeople).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top-up Loan Modal */}
      {isTopUpModalOpen && selectedLoan && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white w-full max-w-2xl ${radiusClass} shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 flex items-center gap-2"><Plus size={18} className={`text-${theme.color}-500`}/> Ongeza Mkopo (Top-up)</h3>
              <button onClick={() => { setIsTopUpModalOpen(false); setSelectedLoan(null); }} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Mteja</p>
                  <p className="text-sm font-black text-slate-900">{selectedLoan.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Salio Linalodaiwa Sasa</p>
                  <p className="text-sm font-black text-rose-600">{settings.currency} {selectedLoan.remainingBalance.toLocaleString()}</p>
                </div>
              </div>

              {/* Products Section */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Bidhaa za Kuongeza (Kama zipo)</h4>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Bidhaa</label>
                    <select 
                      value={topUpSelectedProductId} 
                      onChange={(e) => setTopUpSelectedProductId(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">-- Chagua Bidhaa --</option>
                      {products.filter((p: Product) => p.stockQuantity > 0).map((p: Product) => (
                        <option key={p.id} value={p.id}>{p.name} - {settings.currency} {p.sellingPrice.toLocaleString()} (Stoo: {p.stockQuantity})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Idadi</label>
                    <input type="number" min="1" value={topUpProductQuantity} onChange={e => setTopUpProductQuantity(Number(e.target.value))} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                  </div>
                  <button 
                    onClick={handleAddProductToTopUp}
                    className={`p-3 ${theme.bg} text-white rounded-xl hover:opacity-90`}
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {topUpSelectedProducts.length > 0 && (
                  <div className="mt-3 bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="p-2 font-bold text-slate-600">Bidhaa</th>
                          <th className="p-2 font-bold text-slate-600">Idadi</th>
                          <th className="p-2 font-bold text-slate-600">Bei</th>
                          <th className="p-2 font-bold text-slate-600">Jumla</th>
                          <th className="p-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {topUpSelectedProducts.map((sp, idx) => (
                          <tr key={idx}>
                            <td className="p-2 text-slate-800">{sp.product.name}</td>
                            <td className="p-2 text-slate-800">{sp.quantity}</td>
                            <td className="p-2 text-slate-800">{settings.currency} {sp.unitPrice.toLocaleString()}</td>
                            <td className="p-2 font-bold text-slate-900">{settings.currency} {(sp.quantity * sp.unitPrice).toLocaleString()}</td>
                            <td className="p-2 text-right">
                              <button onClick={() => handleRemoveProductFromTopUp(sp.product.id)} className="text-rose-500 hover:text-rose-700">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Kiasi Kinachoongezwa (Jumla)</label>
                <input 
                  type="number" 
                  value={topUpAmount} 
                  onChange={e => setTopUpAmount(e.target.value)} 
                  placeholder="Kiasi" 
                  className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-lg font-bold outline-none focus:border-emerald-600 text-emerald-700" 
                />
                <p className="text-[9px] text-slate-400 mt-1">Unaweza kubadili kiasi hiki kama ni tofauti na thamani ya bidhaa (Mfano: Kama unampa pesa taslimu).</p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Maelezo ya Nyongeza</label>
                <textarea 
                  placeholder="Mfano: Ameongeza bati 5..." 
                  value={topUpNotes} 
                  onChange={e => setTopUpNotes(e.target.value)} 
                  className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm outline-none focus:border-emerald-600 h-20 resize-none text-emerald-700" 
                />
              </div>

              <button 
                onClick={handleTopUpLoan}
                className={`w-full py-3 ${theme.bg} text-white rounded-xl font-black uppercase text-xs shadow-md hover:opacity-90 transition-all`}
              >
                Hifadhi Nyongeza
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Notes Modal */}
      {isEditNotesModalOpen && selectedLoan && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white w-full max-w-sm ${radiusClass} shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 flex items-center gap-2"><Edit3 size={18} className={`text-${theme.color}-500`}/> Badili Maelezo</h3>
              <button onClick={() => { setIsEditNotesModalOpen(false); setSelectedLoan(null); }} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Maelezo ya Mkopo</label>
                <textarea 
                  value={editNotesText} 
                  onChange={e => setEditNotesText(e.target.value)} 
                  placeholder="Weka maelezo hapa..." 
                  className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-sm outline-none focus:border-emerald-600 h-32 resize-none text-emerald-700" 
                />
              </div>
              <button 
                onClick={handleSaveNotes}
                className={`w-full py-3 ${theme.bg} text-white rounded-xl font-black uppercase text-xs shadow-md hover:opacity-90 transition-all`}
              >
                Hifadhi Maelezo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Tracker Modal */}
      {isDeliveryModalOpen && selectedLoan && selectedLoan.items && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white w-full max-w-2xl ${radiusClass} shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-black text-slate-800 flex items-center gap-2"><Truck size={18} className="text-indigo-500"/> Usafirishaji Mzigo (Delivery)</h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleResetDeliveries}
                  className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition-colors"
                  title="Futa historia yote ya usafirishaji na anza upya"
                >
                  <RotateCcw size={12} /> Anza Upya
                </button>
                <button onClick={() => { setIsDeliveryModalOpen(false); setSelectedLoan(null); }} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Current Status */}
              <div>
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">Hali ya Mzigo</h4>
                <div className="space-y-3">
                  {selectedLoan.items.map((item, idx) => {
                    const delivered = item.delivered || 0;
                    const remaining = item.quantity - delivered;
                    const percent = Math.min(100, (delivered / item.quantity) * 100);
                    
                    return (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-sm text-slate-800">{item.name}</span>
                          <span className="text-xs font-bold text-slate-500">
                            {delivered} / {item.quantity} zimefika
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                          <div 
                            className={`h-2 rounded-full ${percent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        {remaining > 0 && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
                            <label className="text-xs font-bold text-slate-600">Peleka Sasa:</label>
                            <input 
                              type="number" 
                              min="0" 
                              max={remaining}
                              value={deliveryQuantities[item.name] || ''}
                              onChange={(e) => setDeliveryQuantities(prev => ({...prev, [item.name]: Number(e.target.value)}))}
                              className="w-24 p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                              placeholder={`Max ${remaining}`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Form */}
              {selectedLoan.items.some(item => (item.quantity - (item.delivered || 0)) > 0) && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3">
                  <h4 className="text-xs font-black uppercase text-indigo-800 tracking-wider">Taarifa za Usafiri</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase text-indigo-600/70 tracking-wider mb-1 block">Dereva / Gari</label>
                      <input 
                        type="text" 
                        value={deliveryDriverInfo} 
                        onChange={e => setDeliveryDriverInfo(e.target.value)} 
                        placeholder="Mf. Juma (T 123 ABC)" 
                        className="w-full p-3 bg-white border border-indigo-200 rounded-xl text-sm outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-indigo-600/70 tracking-wider mb-1 block">Maelezo</label>
                      <input 
                        type="text" 
                        value={deliveryNotes} 
                        onChange={e => setDeliveryNotes(e.target.value)} 
                        placeholder="Mf. Awamu ya kwanza" 
                        className="w-full p-3 bg-white border border-indigo-200 rounded-xl text-sm outline-none focus:border-indigo-500" 
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleCreateDelivery}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs shadow-md hover:bg-indigo-700 transition-all mt-2"
                  >
                    Rekodi Usafirishaji
                  </button>
                </div>
              )}

              {/* History */}
              {selectedLoan.deliveries && selectedLoan.deliveries.length > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">Historia ya Usafirishaji</h4>
                  <div className="space-y-3">
                    {selectedLoan.deliveries.slice().reverse().map((delivery, idx) => (
                      <div key={delivery.id} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{new Date(delivery.date).toLocaleDateString()} {new Date(delivery.date).toLocaleTimeString()}</p>
                            {delivery.driverInfo && <p className="text-[10px] text-slate-500 mt-0.5"><Truck size={10} className="inline mr-1"/> {delivery.driverInfo}</p>}
                          </div>
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded">Awamu #{selectedLoan.deliveries!.length - idx}</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2">
                          {delivery.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                              <span className="text-slate-600">{item.name}</span>
                              <span className="font-bold text-slate-900">{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        {delivery.notes && <p className="text-[10px] text-slate-500 italic mt-2">"{delivery.notes}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Generic Confirm Dialog */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className={`bg-white w-full max-w-sm ${radiusClass} shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 text-rose-500 mb-4 mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900 text-center mb-2">Thibitisha</h3>
              <p className="text-sm text-slate-500 text-center mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Ghairi
                </button>
                <button 
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  }}
                  className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition-colors shadow-sm"
                >
                  Ndio, Endelea
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
