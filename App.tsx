import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Truck, BarChart3, 
  Settings as SettingsIcon, LogOut, Menu, X, Plus, Search,
  AlertTriangle, TrendingUp, DollarSign, User as UserIcon,
  ChevronRight, Printer, FileText, Sparkles, RefreshCw,
  ImageIcon, Upload, Trash2, Edit3, CheckCircle2, Info,
  UserPlus, CreditCard, History, Coins, CloudLightning,
  Palette, Wallet, Save, Minus, ArrowUpDown, Clock as ClockIcon, Activity, 
  Briefcase, Target, Zap, Layers, Filter, ArrowUpRight, Crown,
  Building2, Phone, HandCoins, ExternalLink, ListFilter, MousePointer2, Code,
  Cpu, Database, Share2, Terminal, Monitor, HardDrive, Layout, Maximize2,
  Box, ShieldCheck, ZapOff, Fingerprint, Eye, EyeOff, Image as ImgIcon,
  CalendarDays, ClipboardList, PenTool, ArrowRightLeft, MessageSquarePlus, Check,
  Landmark, AlertCircle, Lightbulb, Trophy, Receipt, Tags, Gauge, Download,
  ChevronLeft, Cloud, CloudOff, Wind, TrendingDown
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend, ComposedChart, Line, PieChart, Pie } from 'recharts';
import { 
  Product, Customer, Supplier, Sale, ProductCategory, 
  PaymentMethod, User, UserRole, SaleItem, SaleStatus,
  AppSettings, StockAdjustment, Unit, OperatingCost, OperatingCostCategory,
  AirServiceRecord, Layaway, Loan, LoanStatus
} from './types';
import { 
  INITIAL_PRODUCTS, INITIAL_SUPPLIERS, INITIAL_CUSTOMERS, INITIAL_USERS
} from './constants';
import { getInventoryInsights, interpretSystemCommand, getCustomReport } from './services/geminiService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from './db';
import AirMachineView from './AirMachineView';
import LayawayView from './LayawayView';
import LoansView from './LoansView';
import { DeliveriesView } from './DeliveriesView';

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 500; // Limit for performance
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7)); 
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

// --- Helper: Date Check ---
const isToday = (dateString?: string) => {
  if (!dateString) return false;
  const d = new Date(dateString);
  const today = new Date();
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
};

// --- Motorcycle Speedometer Clock Component ---
const AnalogClock = () => {
  const [date, setDate] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const needleRotation = (seconds / 60) * 240 - 120; 

  return (
    <div className="flex items-center space-x-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-700 shadow-lg shadow-blue-900/20 group">
        <div className="relative w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center shadow-inner overflow-hidden">
             <div className="absolute inset-0 bg-[conic-gradient(from_210deg,transparent_0deg,transparent_60deg,#ef4444_300deg)] opacity-20"></div>
             {[...Array(9)].map((_, i) => (
                 <div key={i} className="absolute w-0.5 h-1 bg-slate-500" style={{ transform: `rotate(${210 + i * 30}deg) translateY(-14px)` }} />
             ))}
             {[...Array(3)].map((_, i) => (
                 <div key={i} className="absolute w-0.5 h-1 bg-rose-500" style={{ transform: `rotate(${60 + i * 20}deg) translateY(-14px)` }} />
             ))}
             <div className="absolute w-[2px] h-4 bg-rose-500 rounded-full origin-bottom bottom-1/2 left-[calc(50%-1px)] z-30 transition-transform duration-300 ease-out shadow-[0_0_4px_rgba(244,63,94,0.8)]" style={{transform: `rotate(${needleRotation}deg)`}} />
             <div className="w-1.5 h-1.5 bg-slate-300 rounded-full z-40 border border-slate-900" />
        </div>
        <div className="flex flex-col items-start">
            <span className="text-sm font-black tracking-widest leading-none text-white font-mono">{hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}</span>
            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-0.5 group-hover:text-rose-500 transition-colors">RPM x1000</span>
        </div>
    </div>
  );
};

// --- Add Request Modal ---
const ProductRequestModal = ({ isOpen, onClose, onSave, theme, radiusClass }: any) => {
    const [name, setName] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [note, setNote] = useState('');

    const handleSubmit = () => {
        if (!name) return;
        onSave({ id: Date.now().toString(), name, customerName, note, date: new Date().toISOString() });
        setName(''); setCustomerName(''); setNote('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
            <div className={`relative w-full max-w-sm bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300 ${radiusClass}`}>
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-black uppercase text-xs tracking-widest text-slate-700">Mpango wa Manunuzi</h3>
                    <button onClick={onClose} title="Funga dirisha">
             <X size={20} className="text-slate-500 hover:text-rose-500"/>
           </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-700">Jina la Bidhaa</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl font-bold text-xs outline-none focus:border-emerald-600 text-emerald-700" placeholder="Mfano: Side Mirror za BMW" autoFocus />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-700">Mteja / Matumizi (Hiari)</label>
                        <input value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl font-bold text-xs outline-none focus:border-emerald-600 text-emerald-700" placeholder="Jina la mteja au Matumizi ya duka" />
                    </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-700">Maelezo ya Ziada</label>
                        <textarea value={note} onChange={e => setNote(e.target.value)} className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl font-bold text-xs outline-none h-20 resize-none text-emerald-700" placeholder="Maelezo..." />
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                   <button onClick={handleSubmit} className={`px-6 py-3 ${theme.bg} text-white rounded-xl font-bold text-xs uppercase shadow-lg hover:opacity-90 active:scale-95 transition-all`}>Hifadhi Kwenye Mpango</button>
                </div>
            </div>
        </div>
    );
};

// --- Product Details Modal ---
const ProductDetailsModal = ({ product, isOpen, onClose, onDelete, theme, settings }: any) => {
  if (!isOpen || !product) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="aspect-video bg-slate-100 flex items-center justify-center relative shrink-0">
           {product.imageUrl ? <img src={product.imageUrl} alt={product.name} title={product.name} className="w-full h-full object-cover" /> : <Box size={64} className="text-slate-200" />}
           <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur shadow-xl rounded-full hover:bg-white" title="Funga maelezo ya bidhaa" aria-label="Funga maelezo ya bidhaa"><X size={20} /></button>
        </div>
        <div className="p-8 space-y-6 flex-1">
           <div>
              <span className={`px-3 py-1 rounded-full ${theme.light} ${theme.text} text-[9px] font-black uppercase tracking-widest`}>{product.category}</span>
              <h3 className="text-xl font-black text-slate-900 mt-2">{product.name}</h3>
              <p className="text-slate-600 text-xs font-bold uppercase">{product.brand} • {product.model}</p>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-3xl">
                 <p className="text-[9px] font-black text-slate-700 uppercase mb-1">Bei ya Kuuza</p>
                 <p className="text-base font-black text-blue-600">{settings.currency} {product.sellingPrice.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-3xl">
                 <p className="text-[9px] font-black text-slate-700 uppercase mb-1">Stoo Iliyobaki</p>
                 <p className="text-base font-black text-slate-900">{product.stockQuantity} <span className="text-xs text-slate-600 font-bold">{product.unit || 'PCS'}</span></p>
              </div>
           </div>
           <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-700 uppercase mb-1">Faida kwa Unit</p>
              <p className="text-sm font-black text-emerald-600">
                 {settings.currency} {(product.sellingPrice - product.costPrice).toLocaleString()}
                 <span className="text-[10px] text-slate-600 ml-2">({(((product.sellingPrice - product.costPrice) / product.costPrice) * 100).toFixed(1)}%)</span>
              </p>
           </div>
           <div>
              <p className="text-[9px] font-black text-slate-700 uppercase mb-2">Maelezo ya Bidhaa</p>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{product.description || "Hakuna maelezo ya ziada kwa bidhaa hii."}</p>
           </div>
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
            <button 
                onClick={() => {
                    if(window.confirm("Je, una uhakika unataka kufuta bidhaa hii kabisa?")) {
                        onDelete(product.id);
                        onClose();
                    }
                }}
                className="flex items-center space-x-2 text-rose-500 hover:text-rose-700 hover:bg-rose-100 px-4 py-2 rounded-xl transition-all"
            >
                <Trash2 size={18} />
                <span className="text-xs font-black uppercase">Futa Bidhaa</span>
            </button>
            <button onClick={onClose} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase shadow-lg hover:opacity-90">Funga</button>
        </div>
      </div>
    </div>
  );
};

// --- Advanced Stock Action Modal ---
const StockActionModal = ({ isOpen, onClose, product, onConfirm, onDelete, theme, radiusClass, settings }: any) => {
  const [actionType, setActionType] = useState<'restock' | 'adjustment'>('restock');
  const [qty, setQty] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (product) {
      setNewCostPrice(product.costPrice.toString());
      setQty('');
      setReason('');
      setActionType('restock');
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleSubmit = () => {
    const quantity = parseFloat(qty);
    if (isNaN(quantity) || quantity <= 0) return alert("Weka idadi sahihi");
    
    onConfirm({
        productId: product.id,
        type: actionType,
        quantity: quantity,
        newCostPrice: actionType === 'restock' ? Number(newCostPrice) : product.costPrice,
        reason: reason || (actionType === 'restock' ? 'Mzigo Mpya' : 'Marekebisho ya Stoo')
    });
    onClose();
  };

  const handleDelete = () => {
      if (window.confirm(`ONYO: Unakaribia kufuta "${product.name}" kabisa kwenye mfumo.\n\nHatua hii haiwezi kurudishwa. Je, una uhakika?`)) {
          onDelete(product.id);
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      <div className={`relative w-full max-w-md bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col ${radiusClass}`}>
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
           <div>
             <h3 className="font-black uppercase text-xs tracking-widest text-slate-700">Meneja wa Stoo</h3>
             <p className="text-base font-black text-slate-900 mt-1">{product.name}</p>
           </div>
           <button onClick={onClose} title="Funga dirisha la meneja wa stoo" aria-label="Funga dirisha la meneja wa stoo"><X size={20} className="text-slate-500 hover:text-rose-500"/></button>
        </div>
        
        <div className="p-6 space-y-6">
           {/* Tabs */}
           <div className="flex p-1 bg-slate-100 rounded-xl">
              <button 
                onClick={() => setActionType('restock')} 
                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center space-x-2 ${actionType === 'restock' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
              >
                <Truck size={14} /><span>Mzigo Mpya</span>
              </button>
              <button 
                onClick={() => setActionType('adjustment')} 
                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center space-x-2 ${actionType === 'adjustment' ? 'bg-white shadow text-amber-600' : 'text-slate-600 hover:text-slate-800'}`}
              >
                <ArrowRightLeft size={14} /><span>Marekebisho</span>
              </button>
           </div>

           <div className="space-y-4">
              <div className="flex space-x-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-700">Idadi ya {actionType === 'restock' ? 'Kuongeza' : 'Kurekebisha'}</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={qty} 
                            onChange={(e) => setQty(e.target.value)} 
                            className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl font-black text-lg outline-none focus:border-emerald-600 text-emerald-700"
                            placeholder="0"
                            step={product.unit === Unit.PIECE ? "1" : "0.01"}
                            autoFocus
                        />
                    </div>
                  </div>
                  {actionType === 'restock' && (
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-700">Bei ya Kununua (Mpya)</label>
                        <div className="relative">
                        <input 
                            type="number" 
                            value={newCostPrice} 
                            onChange={(e) => setNewCostPrice(e.target.value)} 
                            className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl font-bold text-lg outline-none focus:border-emerald-600 text-emerald-700"
                            title="Bei mpya ya kununua"
                            aria-label="Bei mpya ya kununua"
                            placeholder="0"
                        />
                            <span className="absolute right-3 top-3.5 text-xs font-black text-slate-600">{settings.currency}</span>
                        </div>
                      </div>
                  )}
              </div>

              {actionType === 'adjustment' && (
                 <div className="p-3 bg-amber-50 rounded-xl text-amber-800 text-xs font-medium border border-amber-100 flex items-start space-x-2">
                    <Info size={14} className="mt-0.5 shrink-0" />
                    <p>Tumia hasi (-) kupunguza stoo (mfano: kuharibika, wizi) na chanya (+) kuongeza (mfano: marejesho).</p>
                 </div>
              )}

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-700">Sababu / Maelezo</label>
                 <textarea 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                    className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl font-bold text-xs outline-none h-20 resize-none text-emerald-700"
                    placeholder={actionType === 'restock' ? "Mfano: Risiti #1234 kutoka Yamaha" : "Mfano: Imevunjika wakati wa kupanga"} 
                 />
              </div>

              <div className="flex justify-between items-center text-xs font-bold text-slate-700 pt-2 border-t border-slate-100">
                  <span>Stoo ya sasa:</span>
                  <span className="font-black text-slate-900">{product.stockQuantity}</span>
              </div>
           </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center space-x-3">
           <button 
                onClick={handleDelete}
                className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                title="Futa Bidhaa Kabisa"
           >
                <Trash2 size={18} />
           </button>
           <div className="flex space-x-3">
                <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-xs uppercase text-slate-500 hover:bg-slate-200 transition-colors">Ghairi</button>
                <button onClick={handleSubmit} className={`px-6 py-3 ${theme.bg} text-white rounded-xl font-bold text-xs uppercase shadow-lg hover:opacity-90 active:scale-95 transition-all`}>
                    Thibitisha
                </button>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Add Product Modal ---
const AddProductModal = ({ isOpen, onClose, onSave, theme, settings, radiusClass }: any) => {
    const [formData, setFormData] = useState({
        name: '', brand: '', model: '', category: 'Pikipiki',
        costPrice: '', sellingPrice: '', stockQuantity: '', reorderLevel: '3',
        description: '', imageUrl: '', unit: Unit.PIECE
    });
    
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                // Compress image before setting state
                const compressedUrl = await compressImage(file);
                setPreviewImage(compressedUrl);
                setFormData({ ...formData, imageUrl: compressedUrl });
            } catch (err) {
                console.error("Image processing error", err);
                alert("Hitilafu kwenye picha. Tafadhali jaribu nyingine.");
            }
        }
    };

    const handleSubmit = () => {
        if(!formData.name || !formData.sellingPrice) return alert("Jaza taarifa muhimu!");
        onSave({
            ...formData,
            costPrice: Number(formData.costPrice),
            sellingPrice: Number(formData.sellingPrice),
            stockQuantity: Number(formData.stockQuantity),
            reorderLevel: Number(formData.reorderLevel)
        });
        setFormData({ name: '', brand: '', model: '', category: 'Pikipiki', costPrice: '', sellingPrice: '', stockQuantity: '', reorderLevel: '3', description: '', imageUrl: '', unit: Unit.PIECE });
        setPreviewImage(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
            <div className={`relative w-full max-w-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] ${radiusClass}`}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="font-black uppercase text-sm tracking-widest text-slate-900">Ongeza Bidhaa Mpya</h3>
                    <button onClick={onClose} title="Funga dirisha">
                      <X size={20} className="text-slate-500 hover:text-rose-500" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-700 tracking-widest">Picha ya Bidhaa</label>
                                <div className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden hover:border-blue-400 transition-colors group">
                                    {previewImage ? (
                                        <img src={previewImage} alt="Preview ya picha ya bidhaa" title="Preview ya picha ya bidhaa" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-2 text-slate-600"><ImgIcon size={20} /></div>
                                            <p className="text-[10px] font-bold text-slate-600">Bonyeza kuweka picha</p>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" title="Pakia picha ya bidhaa" aria-label="Pakia picha ya bidhaa" />
                                    {previewImage && <button onClick={(e) => {e.stopPropagation(); setPreviewImage(null); setFormData({...formData, imageUrl: ''})}} className="absolute top-2 right-2 p-1 bg-white/80 rounded-full shadow hover:bg-rose-50 hover:text-rose-500" title="Ondoa picha">
                                      <X size={14} />
                                    </button>}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div><label className="text-[10px] font-black uppercase text-slate-700">Jina la Bidhaa</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-white rounded-xl font-bold text-xs border-2 border-emerald-400 focus:border-emerald-600 outline-none text-emerald-700" placeholder="Mfano: Boxer 150" /></div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[10px] font-black uppercase text-slate-700">Brand</label><input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full p-3 bg-white rounded-xl font-bold text-xs border-2 border-emerald-400 focus:border-emerald-600 outline-none text-emerald-700" placeholder="Bajaj" /></div>
                                <div><label className="text-[10px] font-black uppercase text-slate-700">Model</label><input value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full p-3 bg-white rounded-xl font-bold text-xs border-2 border-emerald-400 focus:border-emerald-600 outline-none text-emerald-700" placeholder="2024" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-700">Kundi (Category)</label>
                                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3 bg-white rounded-xl font-bold text-xs border-2 border-emerald-400 focus:border-emerald-600 outline-none text-emerald-700" title="Chagua kundi la bidhaa" aria-label="Chagua kundi la bidhaa">
                                        <option value="Pikipiki">Pikipiki</option>
                                        <option value="Vipuri">Vipuri</option>
                                        <option value="Vifaa vya Ziada">Vifaa vya Ziada</option>
                                        <option value="Mbao">Mbao</option>
                                        <option value="Saruji">Saruji</option>
                                        <option value="Matofali">Matofali</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-700">Kipimo (Unit)</label>
                                    <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value as Unit})} className="w-full p-3 bg-white rounded-xl font-bold text-xs border-2 border-emerald-400 focus:border-emerald-600 outline-none text-emerald-700" title="Chagua kipimo cha bidhaa" aria-label="Chagua kipimo cha bidhaa">
                                        {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[10px] font-black uppercase text-slate-700">Bei ya Kununua</label><input type="number" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} className="w-full p-3 bg-white rounded-xl font-bold text-xs border-2 border-emerald-400 focus:border-emerald-600 outline-none text-emerald-700" placeholder="0" /></div>
                                <div><label className="text-[10px] font-black uppercase text-slate-700">Bei ya Kuuza</label><input type="number" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} className="w-full p-3 bg-white rounded-xl font-bold text-xs border-2 border-emerald-400 focus:border-emerald-600 outline-none text-emerald-700" placeholder="0" /></div>
                            </div>
                             <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[10px] font-black uppercase text-slate-700">Idadi Stoo</label><input type="number" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: e.target.value})} className="w-full p-3 bg-white rounded-xl font-bold text-xs border-2 border-emerald-400 focus:border-emerald-600 outline-none text-emerald-700" placeholder="0" /></div>
                                <div><label className="text-[10px] font-black uppercase text-slate-700">Alert Level</label><input type="number" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: e.target.value})} className="w-full p-3 bg-white rounded-xl font-bold text-xs border-2 border-emerald-400 focus:border-emerald-600 outline-none text-emerald-700" placeholder="3" /></div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6">
                        <label className="text-[10px] font-black uppercase text-slate-700">Maelezo ya Ziada</label>
                        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-white rounded-xl font-bold text-xs border-2 border-emerald-400 outline-none h-24 resize-none text-emerald-700" placeholder="Maelezo kuhusu bidhaa..." />
                    </div>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button onClick={handleSubmit} className={`px-8 py-3 ${theme.bg} text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center space-x-2`}>
                        <Save size={16} /><span>Hifadhi Bidhaa</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Define THEME_COLORS and SidebarItem ---
const THEME_COLORS: Record<string, any> = {
  blue: { bg: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-600', shadow: 'shadow-blue-200', hex: '#2563eb' },
  indigo: { bg: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-600', shadow: 'shadow-indigo-200', hex: '#4f46e5' },
  emerald: { bg: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-600', shadow: 'shadow-emerald-200', hex: '#059669' },
  rose: { bg: 'bg-rose-600', light: 'bg-rose-50', text: 'text-rose-600', shadow: 'shadow-rose-200', hex: '#e11d48' },
  slate: { bg: 'bg-slate-800', light: 'bg-slate-100', text: 'text-slate-800', shadow: 'shadow-slate-200', hex: '#1e293b' }
};

const SidebarItem = ({ icon: Icon, label, active, onClick, isCollapsed, theme, isPulsing }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all group relative ${active ? `neumorphic-card text-slate-900 shadow-lg` : 'text-slate-600 hover:neumorphic-card hover:text-slate-900'} ${isPulsing && active ? 'pulse-card-bounce' : ''}`}
  >
    <Icon size={20} className={active ? 'text-slate-900' : 'group-hover:text-slate-900'} />
    {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300">{label}</span>}
    {active && <div className="absolute left-0 w-1 h-6 bg-slate-900 rounded-r-full" />}
  </button>
);

const OperatingCostsView = ({ costs, onAddCost, theme, radiusClass, settings }: any) => {
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<OperatingCostCategory>(OperatingCostCategory.ELECTRICITY);
    const [description, setDescription] = useState('');
    
    // Default to current month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const handleAdd = () => {
        if (!amount) return;
        onAddCost({
            amount: parseFloat(amount),
            category,
            description,
            date: new Date().toISOString()
        });
        setAmount('');
        setDescription('');
    };

    const filteredCosts = useMemo(() => {
        return costs.filter((c: OperatingCost) => {
            const costDate = c.date.split('T')[0];
            return costDate >= startDate && costDate <= endDate;
        });
    }, [costs, startDate, endDate]);

    const totalCosts = costs;

    const getCategoryTotal = (dataset: OperatingCost[], cat: OperatingCostCategory) => {
        return dataset.filter(c => c.category === cat).reduce((sum, c) => sum + c.amount, 0);
    };

    const categories = Object.values(OperatingCostCategory);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gharama za Uendeshaaji</h2>
                    <p className="text-slate-500 text-xs font-medium mt-1">Dhibiti matumizi ya umeme, maji, na wafanyakazi.</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        className={`p-2 bg-white font-bold text-xs outline-none text-emerald-700 border-2 border-emerald-400 rounded`}
                    />
                    <span className="text-slate-600 text-xs font-bold">-</span>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                        className={`p-2 bg-white font-bold text-xs outline-none text-emerald-700 border-2 border-emerald-400 rounded`}
                    />
                </div>
            </div>

            <div className={`bg-white p-6 ${radiusClass} border border-slate-200 shadow-sm`}>
                <h3 className="font-black uppercase text-sm tracking-widest text-slate-700 mb-4">Ongeza Gharama Mpya</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-700">Kundi (Category)</label>
                        <select 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value as OperatingCostCategory)} 
                            className={`w-full p-3 bg-white border-2 border-emerald-400 ${radiusClass} font-bold text-xs outline-none text-emerald-700`}
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-700">Kiasi ({settings.currency})</label>
                        <input 
                            type="number" 
                            value={amount} 
                            onChange={(e) => setAmount(e.target.value)} 
                            placeholder="0"
                            className={`w-full p-3 bg-white border-2 border-emerald-400 ${radiusClass} font-bold text-xs outline-none text-emerald-700`}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-700">Maelezo (Hiari)</label>
                        <input 
                            type="text" 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder="Mfano: LUKU ya mwezi"
                            className={`w-full p-3 bg-white border-2 border-emerald-400 ${radiusClass} font-bold text-xs outline-none text-emerald-700`}
                        />
                    </div>
                    <button 
                        onClick={handleAdd} 
                        className={`px-6 py-3 ${theme.bg} text-white ${radiusClass} font-black uppercase text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all`}
                    >
                        Hifadhi
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`bg-white p-6 ${radiusClass} border border-slate-200 shadow-sm`}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-black uppercase text-sm tracking-widest text-slate-700">Gharama (Kulingana na Tarehe)</h3>
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-black">
                            Total: {settings.currency} {filteredCosts.reduce((sum: number, c: OperatingCost) => sum + c.amount, 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="space-y-4">
                        {categories.map(cat => {
                            const total = getCategoryTotal(filteredCosts, cat);
                            return (
                                <div key={cat} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-600">{cat}</span>
                                    <span className="text-xs font-black text-slate-900">{settings.currency} {total.toLocaleString()}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className={`bg-white p-6 ${radiusClass} border border-slate-200 shadow-sm`}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-black uppercase text-sm tracking-widest text-slate-700">Gharama za Jumla (Total)</h3>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black">
                            Total: {settings.currency} {totalCosts.reduce((sum: number, c: OperatingCost) => sum + c.amount, 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="space-y-4">
                        {categories.map(cat => {
                            const total = getCategoryTotal(totalCosts, cat);
                            return (
                                <div key={cat} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-600">{cat}</span>
                                    <span className="text-xs font-black text-slate-900">{settings.currency} {total.toLocaleString()}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className={`bg-white border border-slate-200 ${radiusClass} overflow-hidden`}>
                <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-black uppercase text-sm tracking-widest text-slate-700">Rekodi za Gharama (Kulingana na Tarehe)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400">
                            <tr>
                                <th className="p-4">Tarehe</th>
                                <th className="p-4">Kundi</th>
                                <th className="p-4">Maelezo</th>
                                <th className="p-4 text-right">Kiasi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCosts.slice().reverse().map((cost: OperatingCost) => (
                                <tr key={cost.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-xs font-bold text-slate-600">{new Date(cost.date).toLocaleDateString()}</td>
                                    <td className="p-4"><span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black uppercase text-slate-500">{cost.category}</span></td>
                                    <td className="p-4 text-xs text-slate-500">{cost.description || '-'}</td>
                                    <td className="p-4 text-right text-xs font-black text-slate-900">{settings.currency} {cost.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Helper function to safely format currency
const formatCurrency = (amount: number, currency: string) => {
  const safeAmount = isNaN(amount) || !isFinite(amount) ? 0 : amount;
  return `${currency} ${safeAmount.toLocaleString()}`;
};

// --- Default User ---
const currentUser: User = {
  id: 'user-default',
  name: 'Admin',
  role: UserRole.ADMIN,
  email: 'admin@motostock.local'
};

export default function App() {

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const previewId = params.get('preview');
    if (previewId) {
      setPreviewLayawayId(previewId);
    }
  }, []);

  // Load Settings from LocalStorage initially for speed, then check DB
  const [settings, setSettings] = useState<AppSettings & { uiDensity: 'compact' | 'relaxed', cornerRadius: 'none' | 'md' | 'full', sidebarMode: 'expanded' | 'collapsed' }>(() => {
    const saved = localStorage.getItem('moto_settings');
    return saved ? JSON.parse(saved) : { 
      shopName: "MOTOSTOCK PRO", 
      currency: "TSh", 
      taxRate: 0, 
      lowStockAlertLevel: 3, 
      themeColor: 'blue', 
      uiDensity: 'relaxed',
      cornerRadius: 'full',
      sidebarMode: 'expanded'
    };
  });

  const [isDbReady, setIsDbReady] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [productRequests, setProductRequests] = useState<any[]>([]);
  const [operatingCosts, setOperatingCosts] = useState<OperatingCost[]>([]);
  const [airServices, setAirServices] = useState<AirServiceRecord[]>([]);
  const [layaways, setLayaways] = useState<Layaway[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  
  // UI States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [previewLayawayId, setPreviewLayawayId] = useState<string | null>(null);
  
  const theme = THEME_COLORS[settings.themeColor] || THEME_COLORS.blue;
  const radiusClass = settings.cornerRadius === 'full' ? 'rounded-[32px]' : settings.cornerRadius === 'md' ? 'rounded-xl' : 'rounded-none';

  // Load Data on Boot
  useEffect(() => {
    const loadData = async () => {
        try {
            // Load Settings from DB (Truth of Source)
            const dbSettings = await db.getAll('settings');
            if (dbSettings && dbSettings.length > 0) {
                setSettings(dbSettings[0]); // Overwrite localstorage if DB has newer
            }

            // Check if DB is empty (first run), if so, seed it
            const existingProds = await db.getAll('products');
            if (existingProds.length === 0) {
                await db.bulkPut('products', INITIAL_PRODUCTS);
                setProducts(INITIAL_PRODUCTS);
            } else {
                setProducts(existingProds);
            }

            const existingSales = await db.getAll('sales');
            setSales(existingSales);

            const existingCustomers = await db.getAll('customers');
            if(existingCustomers.length === 0) {
                 await db.bulkPut('customers', INITIAL_CUSTOMERS);
                 setCustomers(INITIAL_CUSTOMERS);
            } else {
                setCustomers(existingCustomers);
            }

            const existingReqs = await db.getAll('requests');
            setProductRequests(existingReqs);

            const existingCosts = await db.getAll('costs');
            setOperatingCosts(existingCosts);

            const existingAirServices = await db.getAll('air_services');
            setAirServices(existingAirServices);

            const existingLayaways = await db.getAll('layaways');
            setLayaways(existingLayaways);

            const existingLoans = await db.getAll('loans');
            setLoans(existingLoans);

            setIsDbReady(true);
        } catch (error) {
            console.error("Database load error:", error);
            // For debugging, set isDbReady to true even on error
            setIsDbReady(true);
        }
    };
    loadData();
  }, []);

  // Sync Settings to LocalStorage AND IndexedDB for redundancy
  useEffect(() => {
    const persistSettings = async () => {
        setSaveStatus('saving');
        localStorage.setItem('moto_settings', JSON.stringify(settings));
        try {
            // Save to 'settings' store with fixed ID 'main_settings'
            await db.put('settings', { ...settings, id: 'main_settings' });
            setTimeout(() => setSaveStatus('saved'), 500);
        } catch (e) {
            console.error(e);
            setSaveStatus('error');
        }
    };
    persistSettings();
  }, [settings]);

  // --- Handlers (Persist to DB + State) ---
  
  const handleCreateSale = async (saleData: any) => {
    setSaveStatus('saving');
    const newSale: Sale = { 
        ...saleData, 
        id: `S${Date.now()}`, 
        userId: currentUser.id, 
        status: SaleStatus.PAID,
        date: saleData.date || new Date().toISOString(),
        paidAt: saleData.date || new Date().toISOString()
    };

    let newLoan: Loan | null = null;
    if (saleData.paymentMethod === PaymentMethod.LOAN) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // Default 30 days
        newLoan = {
            id: `LOAN-${Date.now()}`,
            customerName: saleData.customerName,
            customerPhone: '',
            amount: saleData.grandTotal,
            amountPaid: 0,
            remainingBalance: saleData.grandTotal,
            payments: [],
            startDate: new Date().toISOString(),
            dueDate: dueDate.toISOString(),
            status: LoanStatus.ACTIVE,
            notes: `Kutokana na mauzo #${newSale.id}`,
            items: saleData.items.map((i: any) => ({
                name: i.name,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                unitCost: i.unitCost
            }))
        };
    }
    
    try {
        // ATOMIC TRANSACTION: Update Sale AND Inventory together
        const storesToUpdate = ['sales', 'products'];
        if (newLoan) storesToUpdate.push('loans');

        await db.transaction(storesToUpdate, 'readwrite', (stores) => {
            // 1. Save Sale
            stores['sales'].put(newSale);
            
            // 2. Save Loan if applicable
            if (newLoan) {
                stores['loans'].put(newLoan);
            }

            // 3. Update Inventory
            saleData.items.forEach((item: any) => {
                // We need to fetch the current product state from the store inside the transaction if we want strict consistency
                // But since we have state, we can trust state for optimistic UI, but for DB we overwrite with calculating logic?
                // For simplicity in this non-server env, we update the object we have and put it back.
                const product = products.find(p => p.id === item.productId);
                if(product) {
                    const updatedProduct = { ...product, stockQuantity: Math.max(0, product.stockQuantity - item.quantity) };
                    stores['products'].put(updatedProduct);
                }
            });
        });

        // Update UI State after successful DB write
        setProducts(prev => prev.map(p => {
          const soldItem = saleData.items.find((item: any) => item.productId === p.id);
          if (soldItem) return { ...p, stockQuantity: Math.max(0, p.stockQuantity - soldItem.quantity) };
          return p;
        }));
        setSales(prev => [newSale, ...prev]);
        if (newLoan) {
            setLoans(prev => [newLoan!, ...prev]);
        }
        setActiveTab('sales-history');
        setSaveStatus('saved');

    } catch (error) {
        console.error("Transaction failed", error);
        alert("Hitilafu: Muamala umeshindikana kuhifadhiwa.");
        setSaveStatus('error');
    }
  };
  
  const [stockActionProduct, setStockActionProduct] = useState<Product | null>(null);

  const handleStockActionRequest = (productId: string) => {
      const product = products.find(p => p.id === productId);
      if (product) setStockActionProduct(product);
  };

  const handleStockActionConfirm = async (data: { productId: string, type: 'restock' | 'adjustment', quantity: number, newCostPrice: number, reason: string }) => {
      if (data.quantity === 0) {
          alert('Weka idadi ya kuongeza au kurekebisha stoo.');
          return;
      }

      setSaveStatus('saving');
      let updatedProduct: Product | null = null;

      const newProducts = products.map(p => {
          if (p.id === data.productId) {
              const changeValue = data.type === 'restock' ? Math.abs(data.quantity) : data.quantity;
              const newQty = p.stockQuantity + changeValue;
              updatedProduct = {
                  ...p,
                  stockQuantity: Math.max(0, newQty),
                  costPrice: data.type === 'restock' && data.newCostPrice > 0 ? data.newCostPrice : p.costPrice
              };
              return updatedProduct;
          }
          return p;
      });

      if (!updatedProduct) {
          setSaveStatus('error');
          alert('Bidhaa haikupatikana.');
          setStockActionProduct(null);
          return;
      }

      try {
          await db.put('products', updatedProduct);
          setProducts(newProducts);
          setSaveStatus('saved');
      } catch (e) {
          console.error('Failed to update stock:', e);
          setSaveStatus('error');
      }
      setStockActionProduct(null);
  };

  const handleProductUpdate = async (updatedProduct: Product) => {
      setSaveStatus('saving');
      try {
          await db.put('products', updatedProduct);
          setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
          setSaveStatus('saved');
      } catch (e) { setSaveStatus('error'); }
  };

  const handleDeleteProduct = async (productId: string) => {
      setSaveStatus('saving');
      try {
          await db.delete('products', productId);
          setProducts(prev => prev.filter(p => p.id !== productId));
          setSaveStatus('saved');
      } catch (e) { setSaveStatus('error'); }
  };

  const handleAddProduct = async (productData: any) => {
      setSaveStatus('saving');
      const newProduct: Product = {
          id: `p${Date.now()}`,
          sku: `SKU-${Math.floor(Math.random() * 10000)}`,
          supplierId: 'sup1', // Default
          ...productData
      };
      try {
          await db.put('products', newProduct);
          setProducts(prev => [newProduct, ...prev]);
          setSaveStatus('saved');
      } catch (e) { setSaveStatus('error'); }
  };
  
  const handleAddRequest = async (request: any) => {
      setSaveStatus('saving');
      try {
          await db.put('requests', request);
          setProductRequests(prev => [request, ...prev]);
          setSaveStatus('saved');
      } catch (e) { setSaveStatus('error'); }
  };
  
  const handleDeleteRequest = async (id: string) => {
      setSaveStatus('saving');
      try {
          await db.delete('requests', id);
          setProductRequests(prev => prev.filter(r => r.id !== id));
          setSaveStatus('saved');
      } catch (e) { setSaveStatus('error'); }
  };

  const handleAddCost = async (costData: any) => {
      setSaveStatus('saving');
      const newCost: OperatingCost = {
          id: `cost-${Date.now()}`,
          userId: currentUser.id,
          ...costData
      };
      try {
          await db.put('costs', newCost);
          setOperatingCosts(prev => [...prev, newCost]);
          setSaveStatus('saved');
      } catch (e) { setSaveStatus('error'); }
  };

  // --- Derived Stats ---

  const todaySales = useMemo(() => {
    const today = new Date().toLocaleDateString();
    return sales.filter(s => new Date(s.date).toLocaleDateString() === today);
  }, [sales]);

  const todayStats = useMemo(() => {
    const revenueSales = sales.filter(s => {
        return s.status === SaleStatus.PAID && (isToday(s.date) || (s.paidAt && isToday(s.paidAt)));
    });

    const revenue = revenueSales.reduce((acc, s) => acc + s.grandTotal, 0);

    const salesProfit = revenueSales.reduce((total, sale) => {
        const saleProfit = sale.items.reduce((acc, item) => {
            const itemProfit = (item.unitPrice - item.unitCost) * item.quantity;
            return acc + itemProfit;
        }, 0);
        return total + saleProfit - (sale.discountTotal || 0);
    }, 0);

    // Malipo ya madeni ya leo na faida halisi
    const todayLoanProfit = loans.reduce((totalProfit: number, loan: any) => {
      if (!loan.items || loan.items.length === 0) return totalProfit;

      // Malipo ya leo kutoka kwa mkopo huu
      const todayPayments = loan.payments?.filter((p: any) => isToday(p.date)) || [];
      const todayPaymentAmount = todayPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

      if (todayPaymentAmount === 0) return totalProfit;

      // Hesabu faida inayowezekana kutoka kwa bidhaa zote za mkopo
      const totalPossibleProfit = loan.items.reduce((itemProfit: number, item: any) => {
        const profitPerItem = (item.unitPrice - item.unitCost) * item.quantity;
        return itemProfit + profitPerItem;
      }, 0);

      // Faida ya leo ni sehemu ya malipo ya leo kulingana na kiasi cha mkopo
      const todayPaymentRatio = loan.amount > 0 ? todayPaymentAmount / loan.amount : 0;
      const todayProfit = totalPossibleProfit * todayPaymentRatio;

      return totalProfit + todayProfit;
    }, 0);

    const totalProfit = salesProfit + todayLoanProfit; // Faida halisi ya mauzo + faida halisi ya malipo ya madeni

    return { revenue, profit: totalProfit, count: todaySales.length };
  }, [todaySales, sales, loans]);

  const inventoryStats = useMemo(() => {
    const value = products.reduce((acc, p) => {
      const costPrice = isNaN(p.costPrice) || !isFinite(p.costPrice) ? 0 : p.costPrice;
      const stockQuantity = isNaN(p.stockQuantity) || !isFinite(p.stockQuantity) ? 0 : p.stockQuantity;
      return acc + (costPrice * stockQuantity);
    }, 0);
    const lowStock = products.filter(p => {
      const stockQty = isNaN(p.stockQuantity) || !isFinite(p.stockQuantity) ? 0 : p.stockQuantity;
      const reorderLevel = p.reorderLevel || settings.lowStockAlertLevel;
      return stockQty <= reorderLevel;
    });
    return { value, lowCount: lowStock.length, lowStock };
  }, [products, settings.lowStockAlertLevel]);

  const previewLayaway = previewLayawayId ? layaways.find(l => l.id === previewLayawayId) : null;

  const LayawayCustomerPreview = ({ layaway }: { layaway: Layaway | null }) => {
    return (
      <div className="min-h-screen bg-gray-100 text-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-[40px] neumorphic-card p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase font-black tracking-[0.35em] text-cyan-300">Lipa Mdogo Mdogo</p>
              <h1 className="text-2xl font-black text-white mt-2">Ukurasa wa Kuangalia tu</h1>
            </div>
            <button
              onClick={() => window.location.assign(window.location.origin + window.location.pathname)}
              className="rounded-full neumorphic-button px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-slate-900 hover:bg-gray-200"
            >
              Toka
            </button>
          </div>

          {!layaway ? (
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-5 text-center">
              <p className="text-sm text-rose-300 font-bold">Layaway haipatikani au link si sahihi.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-3xl neumorphic-card p-5 shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-600">Mteja</p>
                <h2 className="text-xl font-black text-slate-900 mt-2">{layaway.customerName}</h2>
                <p className="text-sm text-slate-600 mt-1">{layaway.customerPhone}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl neumorphic-card p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-600">Jumla</p>
                  <p className="text-2xl font-black text-slate-900 mt-2">{settings.currency} {layaway.totalAmount.toLocaleString()}</p>
                </div>
                <div className="rounded-3xl neumorphic-card p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-600">Inabaki</p>
                  <p className="text-2xl font-black text-cyan-600 text-glow mt-2">{settings.currency} {layaway.remainingBalance.toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-[32px] neumorphic-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-600">Bidhaa</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-600">Uliyopewa</p>
                </div>
                <div className="space-y-3">
                  {layaway.items.map(item => (
                    <div key={item.productId} className="flex items-center justify-between gap-3 rounded-3xl neumorphic-card p-4">
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-[11px] text-slate-600 mt-1">Kwa kila mmoja: {settings.currency} {item.unitPrice.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">{item.quantity}</p>
                        <p className="text-[10px] text-slate-600">{item.delivered || 0} imefika</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl neumorphic-card p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-600">Hali ya Mfumo</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="status-pill bg-gray-200 text-cyan-600">{layaway.status}</span>
                  <span className="status-pill bg-gray-200 text-slate-700">Tangu: {new Date(layaway.startDate).toLocaleDateString()}</span>
                  <span className="status-pill bg-gray-200 text-slate-700">Mwisho: {new Date(layaway.deadlineDate).toLocaleDateString()}</span>
                </div>
                <p className="mt-4 text-[11px] text-slate-600">Hii ni sehemu ya kuangalia tu. Mabadiliko yanafanywa na admin pekee.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isDbReady) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-gray-100 text-slate-900 flex-col space-y-4">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="font-bold animate-pulse">Inapakia Data...</p>
          </div>
      );
  }

  if (previewLayawayId) {
    return <LayawayCustomerPreview layaway={previewLayaway || null} />;
  }

  return (
    <div className={`app-shell flex h-screen bg-slate-900 text-slate-100 overflow-hidden ${settings.uiDensity === 'compact' ? 'text-[12px]' : 'text-[13px]'}`}>
      
      <StockActionModal 
        isOpen={!!stockActionProduct} 
        onClose={() => setStockActionProduct(null)} 
        product={stockActionProduct} 
        onConfirm={handleStockActionConfirm}
        onDelete={handleDeleteProduct}
        theme={theme} 
        radiusClass={radiusClass} 
        settings={settings}
      />

      <aside className={`neumorphic-sidebar text-slate-900 transition-all duration-300 h-full flex flex-col z-50 ${isSidebarOpen ? 'w-60' : 'w-20'} no-print`}>
        <div className="p-6 flex items-center space-x-3">
          <div className={`neumorphic-card p-2.5 rounded-xl shrink-0`}><Layers size={22} className="text-slate-900" /></div>
          {isSidebarOpen && <div className="animate-in fade-in duration-500"><h1 className="text-lg font-black tracking-tighter uppercase">{settings.shopName.split(' ')[0]} <span className="text-slate-900">PRO</span></h1></div>}
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          <SidebarItem theme={theme} icon={LayoutDashboard} label="DASHIBODI" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} isCollapsed={!isSidebarOpen} />
          <SidebarItem theme={theme} icon={Package} label="STOO" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} isCollapsed={!isSidebarOpen} />
          <SidebarItem theme={theme} icon={ShoppingCart} label="MAUZO" active={activeTab === 'new-sale'} onClick={() => setActiveTab('new-sale')} isCollapsed={!isSidebarOpen} />
          <SidebarItem theme={theme} icon={FileText} label="REKODI" active={activeTab === 'sales-history'} onClick={() => setActiveTab('sales-history')} isCollapsed={!isSidebarOpen} />
          <SidebarItem theme={theme} icon={HandCoins} label="LIPA MDOGO MDOGO" active={activeTab === 'layaway'} onClick={() => setActiveTab('layaway')} isCollapsed={!isSidebarOpen} />
          <SidebarItem theme={theme} icon={CreditCard} label="MIKOPO / MADENI" active={activeTab === 'loans'} onClick={() => setActiveTab('loans')} isCollapsed={!isSidebarOpen} />
          <SidebarItem theme={theme} icon={Truck} label="USAFIRISHAJI" active={activeTab === 'deliveries'} onClick={() => setActiveTab('deliveries')} isCollapsed={!isSidebarOpen} />
          <SidebarItem theme={theme} icon={Coins} label="GHARAMA" active={activeTab === 'costs'} onClick={() => setActiveTab('costs')} isCollapsed={!isSidebarOpen} />
          <SidebarItem theme={theme} icon={Wind} label="MASHINE YA UPEPO" active={activeTab === 'air-machines'} onClick={() => setActiveTab('air-machines')} isCollapsed={!isSidebarOpen} />
          <SidebarItem theme={theme} icon={BarChart3} label="RIPOTI" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} isCollapsed={!isSidebarOpen} />
          <div className="py-2"><div className="h-px bg-white/5 mx-2" /></div>
          <SidebarItem theme={theme} icon={SettingsIcon} label="MIPANGILIO" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} isCollapsed={!isSidebarOpen} />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-20 neumorphic-card border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100" title="Fungua au funga menu" aria-label="Fungua au funga menu"><Menu size={20} /></button>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">{activeTab.replace('-', ' ')}</h2>
            
            {/* Save Status Indicator */}
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${saveStatus === 'saving' ? 'bg-blue-50 text-blue-600' : saveStatus === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {saveStatus === 'saving' ? <RefreshCw size={12} className="animate-spin" /> : saveStatus === 'error' ? <CloudOff size={12} /> : <Cloud size={12} />}
                <span>{saveStatus === 'saving' ? 'Inahifadhi...' : saveStatus === 'error' ? 'Imeshindikana' : 'Imehifadhiwa'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <AnalogClock />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === 'dashboard' && <DashboardView stats={todayStats} invStats={inventoryStats} lowStock={inventoryStats.lowStock} onStockAction={handleStockActionRequest} settings={settings} theme={theme} radiusClass={radiusClass} sales={sales} productRequests={productRequests} onRequestAdd={handleAddRequest} onRequestDelete={handleDeleteRequest} products={products} layaways={layaways} loans={loans} operatingCosts={operatingCosts} airServices={airServices} />}
          {activeTab === 'inventory' && <InventoryView products={products} onAddProduct={handleAddProduct} onStockAction={handleStockActionRequest} onDeleteProduct={handleDeleteProduct} settings={settings} theme={theme} radiusClass={radiusClass} />}
          {activeTab === 'new-sale' && <SalePOS products={products} customers={customers} settings={settings} theme={theme} onCreateSale={handleCreateSale} radiusClass={radiusClass} />}
          {activeTab === 'sales-history' && <SalesHistoryView sales={sales} settings={settings} theme={theme} radiusClass={radiusClass} />}
          {activeTab === 'layaway' && <LayawayView products={products} setProducts={setProducts} customers={customers} setCustomers={setCustomers} theme={theme} radiusClass={radiusClass} settings={settings} setSaveStatus={setSaveStatus} />}
          {activeTab === 'loans' && <LoansView loans={loans} setLoans={setLoans} products={products} setProducts={setProducts} customers={customers} setCustomers={setCustomers} theme={theme} radiusClass={radiusClass} settings={settings} setSaveStatus={setSaveStatus} />}
          {activeTab === 'deliveries' && <DeliveriesView loans={loans} setLoans={setLoans} layaways={layaways} setLayaways={setLayaways} theme={theme} radiusClass={radiusClass} settings={settings} setSaveStatus={(status) => setSaveStatus(status as 'saved' | 'saving' | 'error')} />}
          {activeTab === 'costs' && <OperatingCostsView costs={operatingCosts} onAddCost={handleAddCost} theme={theme} radiusClass={radiusClass} settings={settings} />}
          {activeTab === 'air-machines' && <AirMachineView theme={theme} radiusClass={radiusClass} settings={settings} setSaveStatus={setSaveStatus} />}
          {activeTab === 'reports' && <ReportsView sales={sales} products={products} settings={settings} theme={theme} radiusClass={radiusClass} onProductUpdate={handleProductUpdate} />}
          {activeTab === 'settings' && <SettingsView 
            settings={settings}  
            setSettings={setSettings} 
            theme={theme} 
            radiusClass={radiusClass} 
            exportData={{settings, products, sales, customers, productRequests, operatingCosts, airServices, layaways, loans}}
            onImportData={async (data: any) => {
                // Restore logic for Manual Import
                setSettings(data.settings);
                setProducts(data.products);
                setSales(data.sales);
                setCustomers(data.customers);
                setProductRequests(data.productRequests);
                if (data.operatingCosts) setOperatingCosts(data.operatingCosts);
                if (data.airServices) setAirServices(data.airServices);
                if (data.layaways) setLayaways(data.layaways);
                if (data.loans) setLoans(data.loans);
                
                await db.clear('products'); await db.bulkPut('products', data.products);
                await db.clear('sales'); await db.bulkPut('sales', data.sales);
                await db.clear('customers'); await db.bulkPut('customers', data.customers);
                await db.clear('requests'); await db.bulkPut('requests', data.productRequests);
                if (data.operatingCosts) { await db.clear('costs'); await db.bulkPut('costs', data.operatingCosts); }
                if (data.airServices) { await db.clear('air_services'); await db.bulkPut('air_services', data.airServices); }
                if (data.layaways) { await db.clear('layaways'); await db.bulkPut('layaways', data.layaways); }
                if (data.loans) { await db.clear('loans'); await db.bulkPut('loans', data.loans); }
                await db.put('settings', { ...data.settings, id: 'main_settings' });
            }}
          />}
        </div>
      </main>
    </div>
  );
}

function InventoryView({ products, onAddProduct, onStockAction, onDeleteProduct, settings, theme, radiusClass }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredProducts = products.filter((p: Product) => 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterCategory === 'All' || p.category === filterCategory)
  );
  
  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Stoo & Bidhaa <span className="text-slate-600 text-sm ml-2 font-bold">({products.length})</span></h2>
            <p className="text-slate-600 text-xs font-medium mt-1">Dhibiti bidhaa, bei, na idadi stoo.</p>
         </div>
         <button onClick={() => setAddModalOpen(true)} className={`px-6 py-3 ${theme.bg} text-white ${radiusClass} shadow-lg shadow-blue-200 hover:opacity-90 active:scale-95 transition-all flex items-center space-x-2`}>
            <Plus size={18} /> <span className="text-xs font-black uppercase tracking-widest">Ongeza Bidhaa</span>
         </button>
      </div>

      <div className={`neumorphic-card p-4 ${radiusClass} border border-slate-200 flex flex-col md:flex-row gap-4 items-center`}>
         <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tafuta kwa jina au SKU..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className={`w-full pl-12 pr-4 py-3 bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-100 ${radiusClass} font-bold text-slate-700 placeholder:text-slate-400`}
            />
         </div>
         <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {['All', 'Pikipiki', 'Vipuri', 'Vifaa vya Ziada', 'Mbao', 'Saruji', 'Matofali'].map(cat => (
               <button 
                 key={cat} 
                 onClick={() => { setFilterCategory(cat); setCurrentPage(1); }}
                 className={`px-4 py-2 whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${filterCategory === cat ? `${theme.bg} text-white shadow-md` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} ${radiusClass}`}
               >
                 {cat}
               </button>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {paginatedProducts.map((product: Product) => (
            <div key={product.id} className={`group bg-white p-5 border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 ${radiusClass} relative flex flex-col`}>
               {/* Header Actions - Always Visible */}
               <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center space-x-2">
                       <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${product.stockQuantity <= (product.reorderLevel || 3) ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                           {product.stockQuantity <= (product.reorderLevel || 3) ? 'Low Stock' : 'In Stock'}
                       </span>
                   </div>
                   <div className="flex space-x-1">
                       <button onClick={(e) => {e.stopPropagation(); setSelectedProduct(product);}} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Angalia maelezo ya bidhaa">
                         <Eye size={16} />
                       </button>
                       <button 
                            onClick={(e) => {
                                e.stopPropagation(); 
                                onDeleteProduct(product.id);
                            }} 
                            className="p-2 bg-rose-50 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition-colors shadow-sm"
                            title="Futa Bidhaa (Mandate)"
                       >
                            <Trash2 size={16} />
                       </button>
                   </div>
               </div>
               
               {/* Content */}
               <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                     {product.imageUrl ? <img src={product.imageUrl} alt={product.name} title={product.name} className="w-full h-full object-cover rounded-xl" /> : <Package size={24} className="text-slate-300" />}
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">{product.brand}</p>
                     <h3 className="font-black text-slate-800 text-sm truncate">{product.name}</h3>
                     <p className="font-black text-blue-600 mt-1">{settings.currency} {product.sellingPrice.toLocaleString()}</p>
                  </div>
               </div>

               {/* Footer Action */}
               <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex flex-col">
                       <span className="text-[9px] font-bold text-slate-400 uppercase">Stoo</span>
                       <span className="font-black text-slate-900">{product.stockQuantity} <span className="text-[9px] text-slate-400">{product.unit || 'Pcs'}</span></span>
                   </div>
                   <button onClick={() => onStockAction(product.id)} className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wide rounded-lg hover:bg-slate-800 flex items-center space-x-2">
                      <Truck size={12} /><span>Dhibiti</span>
                   </button>
               </div>
            </div>
         ))}
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 pt-4">
            <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
            >
                <ChevronLeft size={20} />
            </button>
            <span className="text-xs font-bold text-slate-500">Ukurasa {currentPage} wa {totalPages}</span>
            <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
            >
                <ChevronRight size={20} />
            </button>
        </div>
      )}

      <AddProductModal 
        isOpen={isAddModalOpen} 
        onClose={() => setAddModalOpen(false)} 
        onSave={onAddProduct} 
        theme={theme} 
        settings={settings}
        radiusClass={radiusClass}
      />

      <ProductDetailsModal 
         product={selectedProduct} 
         isOpen={!!selectedProduct} 
         onClose={() => setSelectedProduct(null)} 
         onDelete={onDeleteProduct}
         theme={theme}
         settings={settings}
      />
    </div>
  );
}

const addPdfPageNumbers = (doc: jsPDF, footerLabel?: string) => {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);

    if (footerLabel) {
      doc.text(footerLabel, 14, pageHeight - 10);
    }

    if (totalPages > 1) {
      doc.text(`Page ${page} of ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    }
  }

  doc.setTextColor(0, 0, 0);
};

function DashboardView({ invStats, lowStock, onStockAction, settings, theme, radiusClass, sales, productRequests, onRequestAdd, onRequestDelete, products, layaways = [], loans = [], operatingCosts = [], airServices = [] }: any) {
  const [isRequestModalOpen, setRequestModalOpen] = useState(false);

  // Helper to check if a date is today
  const isToday = (dateString: string) => {
      const d = new Date(dateString);
      const today = new Date();
      return d.getDate() === today.getDate() &&
             d.getMonth() === today.getMonth() &&
             d.getFullYear() === today.getFullYear();
  };

  // Comprehensive Total Stats
  const totalStats = useMemo(() => {
      // 1. Sales
      const salesRevenue = sales.reduce((acc: number, s: Sale) => {
        const grandTotal = isNaN(s.grandTotal) || !isFinite(s.grandTotal) ? 0 : s.grandTotal;
        return acc + grandTotal;
      }, 0);
      const salesProfit = sales.reduce((acc: number, s: Sale) => {
          const cost = s.items.reduce((c: number, i: SaleItem) => {
            const unitCost = isNaN(i.unitCost) || !isFinite(i.unitCost) ? 0 : i.unitCost;
            const quantity = isNaN(i.quantity) || !isFinite(i.quantity) ? 0 : i.quantity;
            return c + (unitCost * quantity);
          }, 0);
          const grandTotal = isNaN(s.grandTotal) || !isFinite(s.grandTotal) ? 0 : s.grandTotal;
          return acc + (grandTotal - cost);
      }, 0);

      // 2. Air Services
      const airRevenue = airServices.reduce((acc: number, a: any) => {
        const total = isNaN(a.total) || !isFinite(a.total) ? 0 : a.total;
        return acc + total;
      }, 0);
      const airProfit = airRevenue; // Assuming 100% profit for air services

      // 3. Layaways (Lipa Mdogo Mdogo)
      const layawayRevenue = layaways.reduce((acc: number, l: any) => {
        const amountPaid = isNaN(l.amountPaid) || !isFinite(l.amountPaid) ? 0 : l.amountPaid;
        return acc + amountPaid;
      }, 0);
      const layawayReceivables = layaways.reduce((acc: number, l: any) => {
        const remainingBalance = isNaN(l.remainingBalance) || !isFinite(l.remainingBalance) ? 0 : l.remainingBalance;
        return acc + remainingBalance;
      }, 0);

      // 4. Loans (Mikopo)
      const loanRevenue = loans.reduce((acc: number, l: any) => {
        const amountPaid = isNaN(l.amountPaid) || !isFinite(l.amountPaid) ? 0 : l.amountPaid;
        return acc + amountPaid;
      }, 0);

      // Faida ya mkopo itahesabiwa TU deni likishalipwa lote
      const loanProfit = loans.reduce((totalProfit: number, loan: any) => {
        if (!loan.items || loan.items.length === 0) return totalProfit;
        if ((loan.remainingBalance || 0) > 0) return totalProfit;

        const completedLoanProfit = loan.items.reduce((itemProfit: number, item: any) => {
          const unitPrice = isNaN(item.unitPrice) || !isFinite(item.unitPrice) ? 0 : item.unitPrice;
          const unitCost = isNaN(item.unitCost) || !isFinite(item.unitCost) ? 0 : item.unitCost;
          const quantity = isNaN(item.quantity) || !isFinite(item.quantity) ? 0 : item.quantity;
          const profitPerItem = (unitPrice - unitCost) * quantity;
          return itemProfit + profitPerItem;
        }, 0);

        return totalProfit + completedLoanProfit;
      }, 0);

      const loanReceivables = loans.reduce((acc: number, l: any) => {
        const remainingBalance = isNaN(l.remainingBalance) || !isFinite(l.remainingBalance) ? 0 : l.remainingBalance;
        return acc + remainingBalance;
      }, 0);

      // 5. Operating Costs (Gharama za Uendeshaji)
      const totalCosts = operatingCosts.reduce((acc: number, c: any) => {
        const amount = isNaN(c.amount) || !isFinite(c.amount) ? 0 : c.amount;
        return acc + amount;
      }, 0);

      // Aggregates
      const totalRevenue = salesRevenue + airRevenue + layawayRevenue + loanRevenue;
      const grossProfit = salesProfit + airProfit + loanProfit;
      const netProfit = grossProfit - totalCosts;
      const totalReceivables = layawayReceivables + loanReceivables;

      return { 
          revenue: totalRevenue, 
          grossProfit, 
          netProfit, 
          costs: totalCosts, 
          receivables: totalReceivables,
          salesCount: sales.length
      };
  }, [sales, airServices, layaways, loans, operatingCosts]);

  // Comprehensive Today Stats
  const todayStats = useMemo(() => {
      // Sales Today
      const todaySales = sales.filter((s: Sale) => isToday(s.date));
      const salesRevenue = todaySales.reduce((acc: number, s: Sale) => {
        const grandTotal = isNaN(s.grandTotal) || !isFinite(s.grandTotal) ? 0 : s.grandTotal;
        return acc + grandTotal;
      }, 0);
      const salesProfit = todaySales.reduce((acc: number, s: Sale) => {
          const cost = s.items.reduce((c: number, i: SaleItem) => {
            const unitCost = isNaN(i.unitCost) || !isFinite(i.unitCost) ? 0 : i.unitCost;
            const quantity = isNaN(i.quantity) || !isFinite(i.quantity) ? 0 : i.quantity;
            return c + (unitCost * quantity);
          }, 0);
          const grandTotal = isNaN(s.grandTotal) || !isFinite(s.grandTotal) ? 0 : s.grandTotal;
          return acc + (grandTotal - cost);
      }, 0);

      // Air Services Today
      const todayAir = airServices.filter((a: any) => isToday(a.date));
      const airRevenue = todayAir.reduce((acc: number, a: any) => {
        const total = isNaN(a.total) || !isFinite(a.total) ? 0 : a.total;
        return acc + total;
      }, 0);

      // Layaway Payments Today
      let layawayRevenue = 0;
      layaways.forEach((l: any) => {
          if (l.payments && Array.isArray(l.payments)) {
              l.payments.forEach((p: any) => {
                  if (isToday(p.date)) {
                      const amount = isNaN(p.amount) || !isFinite(p.amount) ? 0 : p.amount;
                      layawayRevenue += amount;
                  }
              });
          }
      });

      // Loan profit today: itokee siku ambayo deni limekamilika kulipwa
      let loanProfit = 0;
      loans.forEach((l: any) => {
          if (!l.items || l.items.length === 0) return;
          if ((l.remainingBalance || 0) > 0) return;

          const todayPayments = l.payments?.filter((p: any) => isToday(p.date)) || [];
          if (todayPayments.length === 0) return;

          const completedTodayProfit = l.items.reduce((itemProfit: number, item: any) => {
            const unitPrice = isNaN(item.unitPrice) || !isFinite(item.unitPrice) ? 0 : item.unitPrice;
            const unitCost = isNaN(item.unitCost) || !isFinite(item.unitCost) ? 0 : item.unitCost;
            const quantity = isNaN(item.quantity) || !isFinite(item.quantity) ? 0 : item.quantity;
            const profitPerItem = (unitPrice - unitCost) * quantity;
            return itemProfit + profitPerItem;
          }, 0);

          loanProfit += completedTodayProfit;
      });

      // Operating Costs Today
      const todayCosts = operatingCosts.filter((c: any) => isToday(c.date));
      const costs = todayCosts.reduce((acc: number, c: any) => {
        const amount = isNaN(c.amount) || !isFinite(c.amount) ? 0 : c.amount;
        return acc + amount;
      }, 0);

      const totalRevenue = salesRevenue + airRevenue + layawayRevenue + loanProfit;
      const grossProfit = salesProfit + airRevenue + loanProfit; // Faida halisi ya malipo ya madeni
      const netProfit = grossProfit - costs;

      return {
          revenue: totalRevenue,
          netProfit,
          costs,
          salesCount: todaySales.length
      };
  }, [sales, airServices, layaways, loans, operatingCosts]);

  // Derive Top Products
  const topProducts = useMemo(() => {
      const productSales: Record<string, {name: string, quantity: number, total: number}> = {};
      sales.forEach((s: Sale) => {
          s.items.forEach((item: SaleItem) => {
              if (productSales[item.productId]) {
                  productSales[item.productId].quantity += item.quantity;
                  productSales[item.productId].total += item.total;
              } else {
                  productSales[item.productId] = { name: item.name, quantity: item.quantity, total: item.total };
              }
          });
      });
      return Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [sales]);

  // Recent Activity (Combined Sales, Layaways, Loans, Costs)
  const recentActivity = useMemo(() => {
      const activities: any[] = [];
      
      sales.forEach((s: Sale) => {
          activities.push({ id: s.id, type: 'Sale', title: 'Mauzo', amount: s.grandTotal, date: s.date, icon: ShoppingCart, color: 'blue' });
      });
      
      layaways.forEach((l: any) => {
          l.payments.forEach((p: any) => {
              activities.push({ id: p.id, type: 'Layaway', title: 'Malipo (Lipa Mdogo Mdogo)', amount: p.amount, date: p.date, icon: HandCoins, color: 'emerald' });
          });
      });

      loans.forEach((l: any) => {
          l.payments.forEach((p: any) => {
              activities.push({ id: p.id, type: 'Loan', title: 'Malipo (Mkopo)', amount: p.amount, date: p.date, icon: HandCoins, color: 'emerald' });
          });
      });

      operatingCosts.forEach((c: any) => {
          activities.push({ id: c.id, type: 'Cost', title: `Matumizi (${c.category})`, amount: -c.amount, date: c.date, icon: TrendingDown, color: 'rose' });
      });

      airServices.forEach((a: any) => {
          activities.push({ id: a.id, type: 'Air', title: `Upepo (${a.vehicleType})`, amount: a.total, date: a.date, icon: Wind, color: 'indigo' });
      });

      return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
  }, [sales, layaways, loans, operatingCosts, airServices]);

  // AI Insight State
  const [aiInsight, setAiInsight] = useState<any | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [customRequest, setCustomRequest] = useState('');

  const formatAiHtml = (text: string) =>
      text
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-slate-900">$1</strong>')
          .replace(/\n\n/g, '</p><p>')
          .replace(/\n/g, '<br/>');

  const generateDashboardReport = async () => {
      setLoadingAi(true);
      try {
          let insight;
          if (customRequest.trim()) {
              insight = await getCustomReport(products, sales, customRequest);
          } else {
              const textInsight = await getInventoryInsights(products, sales);
              insight = { summary: textInsight, hasTable: false };
          }
          setAiInsight(insight);
      } catch (e) {
          setAiInsight({ summary: "Error loading insights.", hasTable: false });
      }
      setLoadingAi(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       {/* Top Stats - Total (Jumla) */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Mapato Jumla (Inflows)" value={formatCurrency(totalStats.revenue, settings.currency)} icon={DollarSign} theme={theme} />
          <StatCard title="Faida Halisi (Net Profit)" value={formatCurrency(totalStats.netProfit, settings.currency)} icon={TrendingUp} theme={theme} color="emerald" />
          <StatCard title="Pesa Nje (Madeni)" value={formatCurrency(totalStats.receivables, settings.currency)} icon={AlertCircle} theme={theme} color="rose" />
          <StatCard title="Thamani ya Stoo" value={formatCurrency(invStats.value, settings.currency)} icon={Package} theme={theme} color="indigo" />
       </div>

       {/* Top Stats - Today (Leo) */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Mapato Leo" value={`${settings.currency} ${todayStats.revenue.toLocaleString()}`} icon={DollarSign} theme={theme} color="slate" />
          <StatCard title="Faida Halisi Leo" value={`${settings.currency} ${todayStats.netProfit.toLocaleString()}`} icon={TrendingUp} theme={theme} color="emerald" />
          <StatCard title="Matumizi Leo" value={`${settings.currency} ${todayStats.costs.toLocaleString()}`} icon={TrendingDown} theme={theme} color="rose" />
          <StatCard title="Mauzo Leo (Idadi)" value={todayStats.salesCount} icon={ShoppingCart} theme={theme} color="blue" />
       </div>

       {/* Middle Row: AI Assistant */}
       <div className="grid grid-cols-1 gap-6">
           {/* AI Shop Assistant */}
           <div className={`bg-white border border-slate-200 p-6 ${radiusClass} shadow-sm flex flex-col min-h-[300px]`}>
               <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center space-x-2 text-blue-600">
                       <Sparkles size={20} />
                       <h3 className="font-black uppercase text-sm tracking-widest bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">MotoStock AI Pro</h3>
                   </div>
                   <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-black uppercase rounded-full">BETA</span>
               </div>
               
               <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 bg-slate-50 rounded-xl p-4 border border-slate-100 min-h-[200px]">
                   {loadingAi ? (
                       <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                           <div className="relative">
                               <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin"></div>
                               <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                               <Sparkles size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 animate-pulse" />
                           </div>
                           <p className="text-xs font-bold text-blue-600 animate-pulse">Analyzing Business Data...</p>
                       </div>
                   ) : aiInsight ? (
                       <div className="flex flex-col h-full space-y-4">
                           {/* Summary Section */}
                           {aiInsight.summary && (
                               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                   <div className="mb-3 flex items-center gap-2">
                                       <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                       <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700">Muhtasari wa AI</h4>
                                   </div>
                                   <div
                                       className="text-[14px] leading-7 text-slate-700 font-medium break-words [&_p]:mb-4 [&_strong]:font-black [&_br]:leading-8"
                                       dangerouslySetInnerHTML={{ __html: `<p>${formatAiHtml(aiInsight.summary)}</p>` }}
                                   />
                               </div>
                           )}

                           {/* Excel-like Table Section */}
                           {aiInsight.hasTable && aiInsight.table && (
                               <div className="border border-slate-300 rounded-lg overflow-hidden shadow-sm">
                                   <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 flex justify-between items-center">
                                       <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{aiInsight.table.title || 'Data Table'}</span>
                                       <div className="flex gap-1">
                                           <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                                           <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                           <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                       </div>
                                   </div>
                                   <div className="overflow-x-auto">
                                       <table className="w-full text-xs text-left border-collapse">
                                           <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                               <tr>
                                                   {aiInsight.table.headers.map((header: string, idx: number) => (
                                                       <th key={idx} className="px-3 py-2 border-b border-r border-slate-200 last:border-r-0 whitespace-nowrap">{header}</th>
                                                   ))}
                                               </tr>
                                           </thead>
                                           <tbody className="divide-y divide-slate-100">
                                               {aiInsight.table.rows.map((row: any[], rIdx: number) => (
                                                   <tr key={rIdx} className="hover:bg-blue-50 transition-colors group">
                                                       {row.map((cell: any, cIdx: number) => (
                                                           <td key={cIdx} className="px-3 py-2 border-r border-slate-100 last:border-r-0 text-slate-700 group-hover:text-blue-700 whitespace-nowrap">
                                                               {typeof cell === 'number' ? cell.toLocaleString() : cell}
                                                           </td>
                                                       ))}
                                                   </tr>
                                               ))}
                                           </tbody>
                                       </table>
                                   </div>
                               </div>
                           )}

                           {/* Recommendation Section */}
                           {aiInsight.recommendation && (
                               <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                                   <div className="mb-2 flex items-center gap-2">
                                       <Lightbulb size={16} className="text-emerald-700" />
                                       <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-800">Pendekezo</h4>
                                   </div>
                                   <p className="text-[14px] leading-7 text-emerald-900 font-semibold break-words">{aiInsight.recommendation}</p>
                               </div>
                           )}

                           <button 
                                onClick={() => {
                                    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
                                    const pageWidth = doc.internal.pageSize.getWidth();
                                    const pageHeight = doc.internal.pageSize.getHeight();
                                    const marginX = 14;
                                    const printableWidth = pageWidth - marginX * 2;

                                    doc.setFontSize(16);
                                    doc.text(aiInsight.table?.title || "Ripoti ya AI Shop Assistant", marginX, 20);
                                    doc.setFontSize(10);
                                    doc.text(`Tarehe: ${new Date().toLocaleString()}`, marginX, 28);

                                    let contentY = 36;

                                    if (aiInsight.summary) {
                                        const cleanSummary = aiInsight.summary.replace(/<[^>]*>?/gm, '');
                                        const splitSummary = doc.splitTextToSize(cleanSummary, printableWidth);
                                        doc.text(splitSummary, marginX, contentY);
                                        contentY += splitSummary.length * 5 + 4;
                                    }

                                    if (aiInsight.hasTable && aiInsight.table) {
                                        autoTable(doc, {
                                            head: [aiInsight.table.headers],
                                            body: aiInsight.table.rows,
                                            startY: contentY,
                                            margin: { top: 18, right: marginX, bottom: 18, left: marginX },
                                            theme: 'grid',
                                            styles: { fontSize: 8.5, cellPadding: 3, overflow: 'linebreak' },
                                            headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold' },
                                            alternateRowStyles: { fillColor: [248, 250, 252] },
                                        });
                                    }

                                    addPdfPageNumbers(doc, "AI Shop Assistant Report");
                                    doc.save(`ai_report_${Date.now()}.pdf`);
                                }}
                                className="mt-3 w-full py-2 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase hover:bg-slate-300 flex items-center justify-center gap-2"
                           >
                                <Download size={14} /> Pakua Ripoti (PDF)
                           </button>
                       </div>
                   ) : (
                       <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
                           <Sparkles size={32} className="mb-2 opacity-50" />
                           <p className="text-xs font-bold">Andika swali lako hapa chini au<br/>bonyeza "Chambua" kwa ripoti ya jumla.</p>
                       </div>
                   )}
               </div>

               <div className="space-y-2">
                   <input 
                        type="text" 
                        value={customRequest}
                        onChange={(e) => setCustomRequest(e.target.value)}
                        placeholder="Mfano: Nipe mbinu za kuuza zaidi..."
                        className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl text-xs font-bold outline-none focus:border-emerald-600 text-emerald-700"
                   />
                   <button 
                       onClick={generateDashboardReport}
                       disabled={loadingAi}
                       className={`w-full py-3 ${theme.bg} text-white rounded-xl font-black uppercase text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50`}
                   >
                       {loadingAi ? 'Inachambua...' : customRequest ? 'Tuma Ombi' : 'Chambua Jumla'}
                   </button>
               </div>
           </div>
       </div>


       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Top Products & Low Stock */}
          <div className="space-y-6">
             {/* Top Products */}
             <div className={`bg-white border border-slate-200 p-6 ${radiusClass}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black uppercase text-sm tracking-widest text-slate-700">Bidhaa Zinazouzika Sana</h3>
                    <Crown size={18} className="text-yellow-500" />
                </div>
                <div className="space-y-3">
                    {topProducts.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">Data haitoshi</p> : topProducts.map((p: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                             <div className="flex items-center space-x-3">
                                 <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-slate-200 text-slate-500'}`}>{idx + 1}</div>
                                 <span className="text-xs font-bold text-slate-800">{p.name}</span>
                             </div>
                             <span className="text-xs font-black text-slate-600">{p.quantity} Sold</span>
                        </div>
                    ))}
                </div>
             </div>

             {/* Low Stock Alert */}
             <div className={`bg-white border border-rose-100 p-6 ${radiusClass} h-fit`}>
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center space-x-2 text-rose-600">
                      <AlertTriangle size={20} />
                      <h3 className="font-black uppercase text-sm tracking-widest">Bidhaa Zinaisha</h3>
                   </div>
                   <span className="bg-rose-100 text-rose-600 px-2 py-1 rounded text-[10px] font-black">{lowStock.length} Items</span>
                </div>
                {lowStock.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">Stoo ipo vizuri!</div>
                ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {lowStock
                            .sort((a: any, b: any) => {
                                const ratioA = a.stockQuantity / (a.reorderLevel || 1);
                                const ratioB = b.stockQuantity / (b.reorderLevel || 1);
                                return ratioA - ratioB;
                            })
                            .slice(0, 30)
                            .map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-rose-50 rounded-xl">
                                <div>
                                    <p className="font-bold text-xs text-slate-800 line-clamp-1">{p.name}</p>
                                    <p className="text-[10px] text-slate-500">Baki: {p.stockQuantity} (Reorder: {p.reorderLevel})</p>
                                </div>
                                <button onClick={() => onStockAction(p.id)} className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 text-[10px] font-black uppercase rounded-lg hover:bg-rose-600 hover:text-white transition-colors">Agiza</button>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          </div>

          {/* Middle Column: Recent Activity (Unified) */}
          <div className={`bg-white border border-slate-200 p-6 ${radiusClass}`}>
             <div className="flex items-center justify-between mb-4">
                <h3 className="font-black uppercase text-sm tracking-widest text-slate-700">Miamala ya Hivi Punde</h3>
                <Activity size={18} className="text-slate-400"/>
             </div>
             <div className="space-y-3">
                {recentActivity.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">Hakuna miamala bado</p> : recentActivity.map((act: any, idx: number) => {
                   const ActIcon = act.icon;
                   return (
                   <div key={`${act.id}-${idx}`} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-${act.color}-100 text-${act.color}-600`}>
                              <ActIcon size={14} />
                          </div>
                          <div>
                              <p className="font-bold text-xs text-slate-800">{act.title}</p>
                              <p className="text-[10px] text-slate-500">{new Date(act.date).toLocaleDateString()} • {new Date(act.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                      </div>
                      <span className={`font-black text-xs ${act.amount < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {act.amount < 0 ? '-' : '+'}{settings.currency} {Math.abs(act.amount).toLocaleString()}
                      </span>
                   </div>
                )})}
             </div>
          </div>

          {/* Right Column: Shop Plan / Requests */}
          <div className={`bg-white border border-slate-200 p-6 ${radiusClass} h-full`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-black uppercase text-sm tracking-widest text-slate-700">Mpango wa Manunuzi</h3>
                <button onClick={() => setRequestModalOpen(true)} className={`p-2 ${theme.bg} text-white rounded-lg hover:opacity-90`} title="Ongeza ombi la manunuzi">
                  <Plus size={16}/>
                </button>
            </div>
            <div className="space-y-3">
                {productRequests.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">Orodha ni tupu</p> : productRequests.map((req: any) => (
                <div key={req.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl relative group flex justify-between items-center">
                    <div>
                        <p className="font-bold text-xs text-slate-800">{req.name}</p>
                        <p className="text-[10px] text-slate-500">{req.customerName ? `Kwa: ${req.customerName}` : 'Duka'} • {new Date(req.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                         <button 
                            onClick={() => onRequestDelete(req.id)} 
                            className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors"
                            title="Imefika / Weka Stoo"
                         >
                            <Check size={14}/>
                         </button>
                         <button onClick={() => onRequestDelete(req.id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors" title="Futa ombi">
                           <X size={14}/>
                         </button>
                    </div>
                </div>
                ))}
            </div>
          </div>
       </div>
       <ProductRequestModal isOpen={isRequestModalOpen} onClose={() => setRequestModalOpen(false)} onSave={onRequestAdd} theme={theme} radiusClass={radiusClass} />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, theme, color }: any) {
  const colorMap: any = {
    emerald: 'text-emerald-600 bg-emerald-50',
    blue: 'text-blue-600 bg-blue-50',
    indigo: 'text-indigo-600 bg-indigo-50',
    slate: 'text-slate-600 bg-slate-50'
  };
  const colorClass = color ? (colorMap[color] || colorMap.slate) : `${theme.text} ${theme.light}`;
  
  return (
    <div className={`bg-white p-6 rounded-[24px] shadow-sm border border-slate-200 flex items-center space-x-4`}>
       <div className={`p-4 rounded-2xl ${colorClass}`}>
          <Icon size={24} />
       </div>
       <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
          <h3 className="text-2xl font-black text-slate-900 mt-0.5">{value}</h3>
       </div>
    </div>
  );
}

function SalePOS({ products, customers, settings, theme, onCreateSale, radiusClass }: any) {
  const [cart, setCart] = useState<any[]>([]);
  // Removed selectedCustomer state as customer selection is no longer required
  const [paymentMethod, setPaymentMethod] = useState(PaymentMethod.CASH);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOwnerMode, setIsOwnerMode] = useState(false);

  const filteredProducts = products.filter((p: Product) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
          productId: product.id, 
          name: product.name, 
          quantity: 1, 
          unitPrice: product.sellingPrice, 
          unitCost: product.costPrice, 
          discount: 0,
          unit: product.unit || Unit.PIECE
      }];
    });
  };

  const updateCartQuantity = (productId: string, newQty: number) => {
    if (newQty < 0) return; // Allow 0 to remove? No, use trash icon.
    setCart(prev => prev.map(item => item.productId === productId ? { ...item, quantity: newQty } : item));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const getLineTotal = (item: any) => {
      const price = isOwnerMode ? item.unitCost : item.unitPrice;
      return price * item.quantity;
  };

  const subtotal = cart.reduce((sum, item) => sum + getLineTotal(item), 0);
  const tax = subtotal * settings.taxRate;
  const totalAmount = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Default to 'walk-in' / 'Mteja wa Rejareja' since selection is removed
    let finalCustomerId = 'walk-in';
    let finalCustomerName = 'Mteja wa Rejareja';

    if (isOwnerMode) {
        finalCustomerId = 'OWNER';
        finalCustomerName = 'Matumizi ya Mmiliki';
    }

    const finalizedItems = cart.map(item => ({
        ...item,
        unitPrice: isOwnerMode ? item.unitCost : item.unitPrice,
        total: getLineTotal(item)
    }));

    onCreateSale({
      customerId: finalCustomerId,
      customerName: finalCustomerName,
      items: finalizedItems,
      subtotal: subtotal,
      tax: tax,
      discountTotal: 0,
      grandTotal: totalAmount,
      paymentMethod,
      date: new Date().toISOString()
    });
    setCart([]);
    setIsOwnerMode(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`flex-1 flex flex-col neumorphic-card ${radiusClass} border border-slate-200 overflow-hidden`}>
         <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Tafuta bidhaa..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 p-3 bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-100 ${radiusClass} font-bold`}
                />
            </div>
         </div>
         <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 xl:grid-cols-3 gap-4 content-start">
            {filteredProducts.map((product: Product) => (
                <button 
                  key={product.id} 
                  onClick={() => addToCart(product)}
                  disabled={product.stockQuantity === 0}
                  className={`p-4 bg-white border border-slate-100 hover:border-blue-400 hover:shadow-md transition-all text-left group ${radiusClass} relative overflow-hidden`}
                >
                    <div className="mb-2">
                        <p className="text-[9px] font-black uppercase text-slate-400">{product.brand}</p>
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{product.name}</h4>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="font-black text-blue-600 text-sm">{settings.currency} {product.sellingPrice.toLocaleString()} <span className="text-[9px] text-slate-400">/{product.unit || 'Pcs'}</span></span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${product.stockQuantity > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {product.stockQuantity > 0 ? `${product.stockQuantity} ${product.unit || 'Pcs'}` : 'Out'}
                        </span>
                    </div>
                </button>
            ))}
         </div>
      </div>
      <div className={`w-full lg:w-96 bg-white shadow-2xl flex flex-col ${radiusClass} overflow-hidden border border-slate-200`}>
         <div className="p-5 bg-slate-50 border-b border-slate-100">
            <h3 className="font-black uppercase text-sm tracking-widest text-slate-800 flex items-center gap-2"><ShoppingCart size={18}/> Kapu la Manunuzi</h3>
         </div>
         
         <div className="px-5 pt-4 pb-0">
             <div className="flex items-center justify-between bg-slate-100 p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2"><Gauge size={14}/> Bei ya Mmiliki</span>
                <button 
                    onClick={() => setIsOwnerMode(!isOwnerMode)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${isOwnerMode ? theme.bg : 'bg-slate-300'}`}
                    title="Washa au zima bei ya mmiliki"
                >
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all shadow-sm ${isOwnerMode ? 'left-6' : 'left-1'}`} />
                </button>
             </div>
             {isOwnerMode && <p className="text-[9px] text-emerald-600 font-bold bg-emerald-50 p-2 mt-2 rounded border border-emerald-100 text-center">Bei zimebadilishwa kuwa gharama halisi</p>}
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {cart.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-50">
                     <ShoppingCart size={48} />
                     <p className="text-xs font-bold text-center">Chagua bidhaa kuongeza</p>
                 </div>
             ) : cart.map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                     <div className="flex-1">
                         <p className="font-bold text-xs text-slate-900 line-clamp-1">{item.name}</p>
                         <div className="flex items-center gap-2 mt-1">
                             <input 
                                type="number" 
                                value={item.quantity} 
                                onChange={(e) => updateCartQuantity(item.productId, parseFloat(e.target.value))}
                                className="w-16 p-1 text-xs font-bold border border-slate-200 rounded bg-white outline-none focus:border-blue-400"
                                step={item.unit === Unit.PIECE ? 1 : 0.1}
                                min="0.1"
                                title={`Idadi ya ${item.name}`}
                                aria-label={`Idadi ya ${item.name}`}
                             />
                             <span className="text-[10px] font-black text-slate-400 uppercase">{item.unit || 'Pcs'}</span>
                             <span className="text-[10px] text-slate-400">x {(isOwnerMode ? item.unitCost : item.unitPrice).toLocaleString()}</span>
                         </div>
                         {item.unit === Unit.KILOGRAM && (
                            <div className="flex gap-1 mt-1.5">
                                {[0.25, 0.5, 0.75, 1].map(qty => (
                                    <button 
                                        key={qty}
                                        onClick={() => updateCartQuantity(item.productId, qty)}
                                        className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-colors ${item.quantity === qty ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        {qty === 0.25 ? '¼' : qty === 0.5 ? '½' : qty === 0.75 ? '¾' : '1'}
                                    </button>
                                ))}
                            </div>
                         )}
                     </div>
                     <div className="flex items-center space-x-3">
                        <span className="font-black text-xs text-slate-700">{settings.currency} {getLineTotal(item).toLocaleString()}</span>
                        <button onClick={() => removeFromCart(item.productId)} className="p-1.5 text-rose-400 hover:bg-rose-100 hover:text-rose-600 rounded-lg" title={`Ondoa ${item.name} kwenye kapu`}>
                          <Trash2 size={14}/>
                        </button>
                     </div>
                 </div>
             ))}
         </div>
         <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-4">
             {/* Replaced Customer Select with Date Display */}
             {!isOwnerMode && (
                 <div>
                     <label className="text-[10px] font-black uppercase text-slate-700 mb-1 block">Tarehe ya Mauzo</label>
                     <div className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-2">
                        <ClockIcon size={14} className="text-slate-600" />
                        {new Date().toLocaleDateString('sw-TZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                     </div>
                 </div>
             )}
             <div>
                 <label className="text-[10px] font-black uppercase text-slate-700 mb-1 block">Malipo</label>
                 <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                     {[PaymentMethod.CASH, PaymentMethod.MOBILE, PaymentMethod.CARD, PaymentMethod.LOAN].map(m => (
                         <button key={m} onClick={() => setPaymentMethod(m)} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${paymentMethod === m ? `${theme.bg} text-white shadow` : 'text-slate-400 hover:bg-slate-50'}`}>{m.split(' ')[0]}</button>
                     ))}
                 </div>
             </div>
             <div className="flex justify-between items-center pt-2">
                 <span className="font-black text-slate-500 uppercase text-xs">Jumla Kuu</span>
                 <span className="font-black text-2xl text-slate-900">{settings.currency} {totalAmount.toLocaleString()}</span>
             </div>
             <button onClick={handleCheckout} disabled={cart.length === 0} className={`w-full py-4 ${theme.bg} text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100`}>
                 {isOwnerMode ? 'Rekodi Matumizi' : 'Thibitisha Mauzo'}
             </button>
         </div>
      </div>
    </div>
  );
}

function SalesHistoryView({ sales, settings, theme, radiusClass }: any) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const totalPages = Math.ceil(sales.length / itemsPerPage);
  const paginatedSales = sales.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Rekodi ya Mauzo <span className="text-slate-400 text-sm ml-2">({sales.length})</span></h2>
        <div className={`bg-white border border-slate-200 overflow-hidden ${radiusClass} shadow-sm`}>
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th className="p-4 text-[10px] font-black uppercase text-slate-700 tracking-widest">ID</th>
                        <th className="p-4 text-[10px] font-black uppercase text-slate-700 tracking-widest">Tarehe</th>
                        <th className="p-4 text-[10px] font-black uppercase text-slate-700 tracking-widest">Mteja</th>
                        <th className="p-4 text-[10px] font-black uppercase text-slate-700 tracking-widest">Bidhaa</th>
                        <th className="p-4 text-[10px] font-black uppercase text-slate-700 tracking-widest text-right">Jumla</th>
                        <th className="p-4 text-[10px] font-black uppercase text-slate-700 tracking-widest text-center">Malipo</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {paginatedSales.map((sale: Sale) => (
                        <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="p-4 text-xs font-bold text-slate-500 font-mono">#{sale.id.slice(-6)}</td>
                            <td className="p-4 text-xs font-medium text-slate-600">
                                {new Date(sale.date).toLocaleDateString()}
                                <span className="block text-[10px] text-slate-400">{new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </td>
                            <td className="p-4 text-xs font-bold text-slate-800">{sale.customerName}</td>
                            <td className="p-4 text-xs text-slate-600">{sale.items.length} items</td>
                            <td className="p-4 text-xs font-black text-slate-900 text-right">{settings.currency} {sale.grandTotal.toLocaleString()}</td>
                            <td className="p-4 text-center">
                                <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-500 text-[9px] font-black uppercase">{sale.paymentMethod}</span>
                            </td>
                        </tr>
                    ))}
                    {sales.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-xs text-slate-400">Hakuna rekodi za mauzo.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 pt-2">
                <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="text-xs font-bold text-slate-500">Ukurasa {currentPage} wa {totalPages}</span>
                <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        )}
    </div>
  );
}



function ReportsView({ sales, products, settings, theme, radiusClass, onProductUpdate }: any) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // AI Command State
  const [command, setCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandResult, setCommandResult] = useState<any>(null);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
        const result = await getInventoryInsights(products, sales);
        setInsight(result);
    } catch (e) {
        setInsight("Error loading insights.");
    }
    setLoading(false);
  };

  const handleGeneratePDF = () => {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 14;
      const printableWidth = pageWidth - marginX * 2;

      doc.setFontSize(18);
      doc.text(`${settings.shopName} - Sales Report`, marginX, 20);
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, marginX, 28);

      const summaryLines = [
          `Total sales records: ${sales.length}`,
          `Total revenue: ${settings.currency} ${sales.reduce((sum: number, sale: Sale) => sum + sale.grandTotal, 0).toLocaleString()}`
      ];

      let currentY = 36;
      doc.setFontSize(10);
      summaryLines.forEach((line) => {
          const wrapped = doc.splitTextToSize(line, printableWidth);
          doc.text(wrapped, marginX, currentY);
          currentY += wrapped.length * 5;
      });

      const tableColumn = ["Date", "Customer", "Items", "Total", "Payment"];
      const tableRows: any[] = [];

      sales.forEach((sale: Sale) => {
          const saleData = [
              new Date(sale.date).toLocaleDateString(),
              sale.customerName,
              sale.items.length,
              `${settings.currency} ${sale.grandTotal.toLocaleString()}`,
              sale.paymentMethod
          ];
          tableRows.push(saleData);
      });

      autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: currentY + 4,
          margin: { top: 18, right: marginX, bottom: 18, left: marginX },
          theme: 'grid',
          styles: {
              fontSize: 9,
              cellPadding: 3,
              overflow: 'linebreak',
              valign: 'middle'
          },
          headStyles: {
              fillColor: [15, 23, 42],
              textColor: [255, 255, 255],
              fontStyle: 'bold'
          },
          alternateRowStyles: {
              fillColor: [248, 250, 252]
          },
      });

      addPdfPageNumbers(doc, settings.shopName);
      doc.save(`sales_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExecuteCommand = async () => {
      if (!command) return;
      setIsExecuting(true);
      const result = await interpretSystemCommand(command, products);
      setCommandResult(result);
      setIsExecuting(false);
  };

  const confirmCommand = () => {
      if (!commandResult) return;
      
      if (commandResult.action === 'UPDATE_PRICE') {
          const product = products.find((p: Product) => p.id === commandResult.targetId);
          if (product) {
              const newValue = commandResult.valueType === 'add' ? product.sellingPrice + commandResult.value : 
                               commandResult.valueType === 'subtract' ? product.sellingPrice - commandResult.value :
                               commandResult.value;
              onProductUpdate({ ...product, sellingPrice: newValue });
          }
      } else if (commandResult.action === 'UPDATE_STOCK') {
           const product = products.find((p: Product) => p.id === commandResult.targetId);
           if (product) {
               const newValue = commandResult.valueType === 'add' ? product.stockQuantity + commandResult.value : 
                                commandResult.valueType === 'subtract' ? product.stockQuantity - commandResult.value :
                                commandResult.value;
               onProductUpdate({ ...product, stockQuantity: newValue });
           }
      } else if (commandResult.action === 'BULK_UPDATE_PRICE') {
          products.forEach((p: Product) => {
              const newValue = p.sellingPrice * (1 + (commandResult.value / 100));
              onProductUpdate({ ...p, sellingPrice: Math.round(newValue) });
          });
      }

      setCommandResult(null);
      setCommand('');
      alert("Action completed successfully!");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ripoti & Uchambuzi (AI)</h2>
            <div className="flex gap-3">
                <button 
                    onClick={handleGeneratePDF} 
                    className={`px-6 py-3 bg-slate-900 text-white ${radiusClass} shadow-lg hover:bg-slate-800 active:scale-95 transition-all flex items-center space-x-2`}
                    title="Pakua ripoti ya PDF"
                    aria-label="Pakua ripoti ya PDF"
                >
                    <Download size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Pakua PDF</span>
                </button>
                <button 
                    onClick={handleGenerateReport} 
                    disabled={loading}
                    className={`px-6 py-3 ${theme.bg} text-white ${radiusClass} shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center space-x-2 disabled:opacity-50`}
                    title="Chambua biashara kwa AI"
                    aria-label="Chambua biashara kwa AI"
                >
                    {loading ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    <span className="text-xs font-black uppercase tracking-widest">Chambua Biashara</span>
                </button>
            </div>
        </div>

        {/* AI Command Center */}
        <div className={`bg-white border border-slate-200 p-6 ${radiusClass} shadow-sm`}>
            <div className="flex items-center space-x-2 mb-4">
                <div className={`p-2 rounded-lg ${theme.light} ${theme.text}`}>
                    <Code size={20} />
                </div>
                <h3 className="font-black uppercase text-sm tracking-widest text-slate-700">AI Command Center</h3>
            </div>
            
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExecuteCommand()}
                    placeholder="Andika amri (mfano: 'Ongeza bei ya Boxer kwa 5000' au 'Punguza bei zote kwa 10%')" 
                    className={`flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-400 placeholder:font-normal`}
                />
                <button 
                    onClick={handleExecuteCommand}
                    disabled={isExecuting || !command}
                    className={`px-6 py-3 ${theme.bg} text-white rounded-xl font-black uppercase text-xs shadow-lg hover:opacity-90 disabled:opacity-50`}
                >
                    {isExecuting ? <RefreshCw size={16} className="animate-spin" /> : 'Tekeleza'}
                </button>
            </div>

            {/* Command Confirmation Modal/Area */}
            {commandResult && (
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-3">
                        <Info size={20} className="text-blue-500 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-bold text-sm text-slate-800 mb-1">AI Imependekeza:</p>
                            <p className="text-xs text-slate-600 mb-3">{commandResult.reason}</p>
                            
                            <div className="flex items-center gap-2 text-xs font-mono bg-slate-200 p-2 rounded-lg w-fit mb-3">
                                <span className="text-slate-500">ACTION:</span>
                                <span className="font-bold text-slate-900">{commandResult.action}</span>
                                {commandResult.targetName && <span className="text-blue-600">({commandResult.targetName})</span>}
                                <span className="text-emerald-600">VAL: {commandResult.value}</span>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setCommandResult(null)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50">Ghairi</button>
                                <button onClick={confirmCommand} className={`px-4 py-2 ${theme.bg} text-white rounded-lg text-xs font-bold hover:opacity-90`}>Thibitisha</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        
        {insight && (
            <div className={`bg-white border border-slate-200 p-8 ${radiusClass} shadow-sm`}>
                <div className="flex items-center space-x-2 mb-6 text-blue-600">
                    <Sparkles size={24} />
                    <h3 className="text-lg font-black uppercase tracking-widest m-0">AI Business Insight</h3>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <div
                        className="text-[15px] leading-8 text-slate-800 font-medium break-words [&_p]:mb-4 [&_strong]:font-black [&_br]:leading-8"
                        dangerouslySetInnerHTML={{
                            __html: `<p>${insight
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-slate-900">$1</strong>')
                                .replace(/\n\n/g, '</p><p>')
                                .replace(/\n/g, '<br/>')}</p>`,
                        }}
                    />
                </div>
            </div>
        )}

        <div className={`p-12 text-center border-2 border-dashed border-slate-200 ${radiusClass} text-slate-400`}>
            <BarChart3 size={48} className="mx-auto mb-4 opacity-50"/>
            <p className="text-sm font-bold">Ripoti za kina zitaonekana hapa.</p>
        </div>
    </div>
  );
}


const DataPreviewModal = ({ data, isOpen, onClose, onConfirm, theme, radiusClass }: any) => {
    if (!isOpen || !data) return null;

    const stats = [
        { label: 'Bidhaa', value: data.products?.length || 0, icon: Package, color: 'blue' },
        { label: 'Mauzo', value: data.sales?.length || 0, icon: ShoppingCart, color: 'emerald' },
        { label: 'Wateja', value: data.customers?.length || 0, icon: Users, color: 'indigo' },
        { label: 'Maombi', value: data.productRequests?.length || 0, icon: ClipboardList, color: 'rose' },
    ];

    return (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
            <div className={`relative w-full max-w-md bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300 ${radiusClass}`}>
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="font-black uppercase text-xs tracking-widest text-slate-500">Hakiki Data (Preview)</h3>
                        <p className="font-bold text-slate-900 text-sm mt-1">Faili: Backup Data</p>
                    </div>
                    <button onClick={onClose} title="Funga preview ya data">
                      <X size={20} className="text-slate-400 hover:text-rose-500"/>
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-xs font-medium flex items-start gap-3">
                        <Info size={16} className="shrink-0 mt-0.5" />
                        <p>Hizi ndizo data zilizopatikana kwenye faili uliyopakia. Ukithibitisha, data hizi zitachukua nafasi ya data za sasa.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
                                <div className={`p-2 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}>
                                    <stat.icon size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400">{stat.label}</p>
                                    <p className="text-lg font-black text-slate-900">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-slate-400">Taarifa za Duka (Kwenye Faili)</p>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="font-bold text-xs text-slate-700">{data.settings?.shopName || 'Haijulikani'}</p>
                            <p className="text-[10px] text-slate-500">Sarafu: {data.settings?.currency || '-'}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-xs uppercase text-slate-500 hover:bg-slate-200 transition-colors">Ghairi</button>
                    <button onClick={onConfirm} className={`px-6 py-3 ${theme.bg} text-white rounded-xl font-bold text-xs uppercase shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center space-x-2`}>
                        <CheckCircle2 size={16} />
                        <span>Thibitisha na Rudisha</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

function SettingsView({ settings, setSettings, theme, radiusClass, exportData, onImportData }: any) {
  const [previewData, setPreviewData] = useState<any>(null);

  const handleChange = (key: keyof AppSettings, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    const data = {
        ...exportData,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `motostock_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            const data = JSON.parse(content);
            
            // Basic validation
            if (data.settings && data.products && data.sales) {
                setPreviewData(data);
            } else {
                alert("Faili hili sio sahihi au limeharibika.");
            }
        } catch (error) {
            console.error(error);
            alert("Imeshindikana kusoma faili.");
        }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = ''; 
  };

  const confirmImport = () => {
      if (previewData) {
          onImportData(previewData);
          setPreviewData(null);
          alert("Data zimerudishwa kikamilifu!");
      }
  };

  const handleReset = async () => {
    if(window.confirm("ONYO: Hii itafuta data zote na kurudi mwanzo. Je, una uhakika?")) {
        localStorage.clear();
        await db.clear('products');
        await db.clear('sales');
        await db.clear('customers');
        await db.clear('requests');
        window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
        <DataPreviewModal 
            data={previewData} 
            isOpen={!!previewData} 
            onClose={() => setPreviewData(null)} 
            onConfirm={confirmImport}
            theme={theme}
            radiusClass={radiusClass}
        />

        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Mipangilio ya Mfumo</h2>
        
        <div className={`bg-white border border-slate-200 p-6 ${radiusClass} shadow-sm space-y-8`}>
            {/* General Settings */}
            <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Taarifa za Duka</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Jina la Biashara</label>
                            <input type="text" value={settings.shopName} onChange={e => handleChange('shopName', e.target.value)} className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl font-bold text-sm outline-none focus:border-emerald-600 text-emerald-700" title="Jina la biashara" />
                    </div>
                     <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Sarafu (Currency)</label>
                        <input type="text" value={settings.currency} onChange={e => handleChange('currency', e.target.value)} className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl font-bold text-sm outline-none focus:border-emerald-600 text-emerald-700" title="Sarafu ya mfumo" />
                    </div>
                </div>
            </div>

            {/* Appearance */}
            <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Muonekano</h3>
                <div>
                     <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Rangi Kuu</label>
                     <div className="flex space-x-3">
                         {['blue', 'indigo', 'emerald', 'rose', 'slate'].map(color => (
                             <button 
                                key={color} 
                                onClick={() => handleChange('themeColor', color)}
                                className={`w-10 h-10 rounded-full bg-${color}-600 border-4 ${settings.themeColor === color ? 'border-white ring-2 ring-slate-300 shadow-lg scale-110' : 'border-transparent opacity-60 hover:opacity-100'} transition-all`}
                             />
                         ))}
                     </div>
                </div>
                <div>
                     <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Muundo (Radius)</label>
                     <div className="flex bg-slate-50 p-1 rounded-xl w-fit border border-slate-200">
                         {['none', 'md', 'full'].map(r => (
                             <button key={r} onClick={() => handleChange('cornerRadius', r)} className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${settings.cornerRadius === r ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
                                 {r === 'none' ? 'Square' : r === 'md' ? 'Soft' : 'Round'}
                             </button>
                         ))}
                     </div>
                </div>
            </div>

             {/* Inventory Config */}
             <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Stoo</h3>
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Kiwango cha Tahadhari (Low Stock Alert)</label>
                    <input type="number" value={settings.lowStockAlertLevel} onChange={e => handleChange('lowStockAlertLevel', parseInt(e.target.value))} className="w-full p-3 bg-white border-2 border-emerald-400 rounded-xl font-bold text-sm outline-none focus:border-emerald-600 text-emerald-700" title="Kiwango cha tahadhari ya stoo" aria-label="Kiwango cha tahadhari ya stoo" placeholder="3" />
                </div>
             </div>
        </div>

        {/* Data Management Section */}
        <div className={`bg-white border border-slate-200 p-6 ${radiusClass} shadow-sm space-y-4`}>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Database size={14}/> Hifadhi Data (Backup & Restore)
            </h3>
            <p className="text-xs text-slate-500">
                Hifadhi data zako kwenye faili ili usipoteze kumbukumbu. Unaweza kurudisha data hizi wakati wowote au kuhamishia kwenye kompyuta nyingine.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={handleExport} className={`flex items-center justify-center space-x-2 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all group`}>
                    <Download size={20} className="text-slate-400 group-hover:text-blue-600"/>
                    <div className="text-left">
                        <p className="font-bold text-xs text-slate-700 group-hover:text-blue-700">Pakua (Backup)</p>
                        <p className="text-[9px] text-slate-400">Save data kwa faili</p>
                    </div>
                </button>

                <label className={`cursor-pointer flex items-center justify-center space-x-2 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all group relative`}>
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                    <Upload size={20} className="text-slate-400 group-hover:text-emerald-600"/>
                    <div className="text-left">
                        <p className="font-bold text-xs text-slate-700 group-hover:text-emerald-700">Rudisha (Restore)</p>
                        <p className="text-[9px] text-slate-400">Pakia faili la backup</p>
                    </div>
                </label>

                <button onClick={handleReset} className={`flex items-center justify-center space-x-2 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all group`}>
                    <Trash2 size={20} className="text-slate-400 group-hover:text-rose-600"/>
                    <div className="text-left">
                        <p className="font-bold text-xs text-slate-700 group-hover:text-rose-700">Futa Zote (Reset)</p>
                        <p className="text-[9px] text-slate-400">Anza upya kabisa</p>
                    </div>
                </button>
            </div>
        </div>
    </div>
  );
}
