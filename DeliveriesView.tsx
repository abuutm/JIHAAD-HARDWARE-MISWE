import React, { useState, useMemo } from 'react';
import { 
  Search, Truck, CheckCircle2, Clock, User, Phone, X, Edit3, RotateCcw, AlertTriangle, CalendarDays
} from 'lucide-react';
import { db } from './db';
import { Layaway, Loan, LoanStatus, DeliveryPhase } from './types';

type DeliveryEntity = Loan | Layaway;

type DeliveryRecord = {
  id: string;
  type: 'LOAN' | 'LAYAWAY';
  customerName: string;
  customerPhone: string;
  startDate: string;
  items: { name: string; quantity: number; delivered?: number }[];
  deliveries?: DeliveryPhase[];
  original: DeliveryEntity;
};

interface DeliveriesViewProps {
  loans: Loan[];
  setLoans: React.Dispatch<React.SetStateAction<Loan[]>>;
  layaways?: Layaway[];
  setLayaways?: React.Dispatch<React.SetStateAction<Layaway[]>>;
  theme: any;
  radiusClass: string;
  settings: any;
  setSaveStatus?: (status: 'saving' | 'saved' | 'error' | null) => void;
}

export function DeliveriesView({ loans, setLoans, layaways, setLayaways, theme, radiusClass, settings, setSaveStatus }: DeliveriesViewProps) {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');

  // Delivery Form State
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DeliveryRecord | null>(null);
  const [deliveryQuantities, setDeliveryQuantities] = useState<{[itemName: string]: number}>({});
  const [deliveryDriverInfo, setDeliveryDriverInfo] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Generic Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);

  const deliveryRecords = useMemo(() => {
    const loanRecords: DeliveryRecord[] = loans
      .filter(l => l.items && l.items.length > 0)
      .map(l => ({
        id: l.id,
        type: 'LOAN',
        customerName: l.customerName,
        customerPhone: l.customerPhone,
        startDate: l.startDate,
        items: l.items || [],
        deliveries: l.deliveries,
        original: l
      }));

    const layawayRecords: DeliveryRecord[] = (layaways || [])
      .filter(l => l.items && l.items.length > 0)
      .map(l => ({
        id: l.id,
        type: 'LAYAWAY',
        customerName: l.customerName,
        customerPhone: l.customerPhone,
        startDate: l.startDate,
        items: l.items || [],
        deliveries: l.deliveries,
        original: l
      }));

    return [...loanRecords, ...layawayRecords];
  }, [loans, layaways]);

  const filteredLoans = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return deliveryRecords.filter((record) => {
      const totalQuantity = record.items.reduce((acc, item) => acc + item.quantity, 0);
      const totalDelivered = record.items.reduce((acc, item) => acc + (item.delivered || 0), 0);
      const isCompleted = totalDelivered >= totalQuantity;

      const matchesTab = activeTab === 'COMPLETED' ? isCompleted : !isCompleted;
      const matchesSearch = record.customerName.toLowerCase().includes(lowerSearch) || 
                            record.customerPhone.includes(searchTerm);
      
      return matchesTab && matchesSearch;
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [deliveryRecords, activeTab, searchTerm]);

  const handleCreateDelivery = async () => {
    if (!selectedRecord || !selectedRecord.items) return;
    
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

    const updatedItems = selectedRecord.items.map(item => {
      const deliveredNow = deliveryQuantities[item.name] || 0;
      return {
        ...item,
        delivered: (item.delivered || 0) + deliveredNow
      };
    });

    const updatedDeliveries = selectedRecord.deliveries ? [...selectedRecord.deliveries, newDeliveryPhase] : [newDeliveryPhase];

    const updatedRecord = {
      ...selectedRecord.original,
      items: updatedItems,
      deliveries: updatedDeliveries
    } as DeliveryEntity;

    try {
      if (selectedRecord.type === 'LOAN') {
        await db.put('loans', updatedRecord as Loan);
        setLoans((prev: any) => prev.map((l: Loan) => l.id === updatedRecord.id ? updatedRecord as Loan : l));
      } else {
        await db.put('layaways', updatedRecord as Layaway);
        setLayaways?.((prev: any) => prev.map((l: Layaway) => l.id === updatedRecord.id ? updatedRecord as Layaway : l));
      }
      
      setIsDeliveryModalOpen(false);
      setSelectedRecord(null);
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
    if (!selectedRecord) return;
    
    setConfirmDialog({
      isOpen: true,
      message: "Una uhakika unataka kufuta historia yote ya usafirishaji kwa rekodi hii? Kitendo hiki hakiwezi kutenguliwa.",
      onConfirm: async () => {
        if (setSaveStatus) setSaveStatus('saving');

        const updatedItems = selectedRecord.items?.map(item => ({
          ...item,
          delivered: 0
        }));

        const updatedRecord = {
          ...selectedRecord.original,
          items: updatedItems,
          deliveries: []
        } as DeliveryEntity;

        try {
          if (selectedRecord.type === 'LOAN') {
            await db.put('loans', updatedRecord as Loan);
            setLoans((prev: any) => prev.map((l: Loan) => l.id === updatedRecord.id ? updatedRecord as Loan : l));
          } else {
            await db.put('layaways', updatedRecord as Layaway);
            setLayaways?.((prev: any) => prev.map((l: Layaway) => l.id === updatedRecord.id ? updatedRecord as Layaway : l));
          }
          
          setSelectedRecord({
            ...selectedRecord,
            items: updatedItems,
            deliveries: []
          });
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Truck className={`text-${theme.color}-500`} size={28} />
            Usafirishaji wa Mizigo
          </h2>
          <p className="text-slate-500 text-sm mt-1">Fuatilia na rekodi mizigo inayosafirishwa kwa awamu</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'PENDING'
              ? `bg-white text-${theme.color}-600 shadow-sm`
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          <Clock size={16} /> Inayosubiri Kufikishwa
        </button>
        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'COMPLETED'
              ? `bg-white text-${theme.color}-600 shadow-sm`
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          <CheckCircle2 size={16} /> Iliyokamilika
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Tafuta kwa jina la mteja au namba ya simu..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-3 bg-white border border-slate-200 ${radiusClass} text-sm focus:outline-none focus:ring-2 focus:ring-${theme.color}-500/20 focus:border-${theme.color}-500`}
        />
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLoans.map((record: DeliveryRecord) => {
          const totalQuantity = record.items!.reduce((acc, item) => acc + item.quantity, 0);
          const totalDelivered = record.items!.reduce((acc, item) => acc + (item.delivered || 0), 0);
          const percent = Math.min(100, (totalDelivered / Math.max(1, totalQuantity)) * 100);

          return (
            <div key={record.id} className={`bg-white border border-slate-200 ${radiusClass} p-5 shadow-sm flex flex-col`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 text-sm flex items-center gap-1">
                      <User size={14} className="text-slate-400"/> {record.customerName}
                    </h3>
                    <span className="text-[9px] bg-slate-100 text-slate-500 rounded-full px-2 py-1 uppercase font-black">
                      {record.type === 'LOAN' ? 'Mkopo' : 'Lipa Mdogo'}
                    </span>
                  </div>
                  {record.customerPhone && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Phone size={12} /> {record.customerPhone}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 text-[10px] font-black uppercase rounded ${
                  percent === 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {percent === 100 ? 'IMEKAMILIKA' : 'INASUBIRI'}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg mb-4">
                <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                  <span className="flex items-center gap-1"><Truck size={12}/> Usafirishaji Mzigo</span>
                  <span>{totalDelivered} / {totalQuantity}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-3">
                  <div 
                    className={`h-1.5 rounded-full ${percent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                
                <div className="space-y-1">
                  {record.items!.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[10px] text-slate-600">
                      <span>{item.name}</span>
                      <span className="font-bold">{item.delivered || 0} / {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <CalendarDays size={12} /> Tarehe: {new Date(record.startDate).toLocaleDateString()}
                </div>
                
                <button 
                  onClick={() => {
                    setSelectedRecord(record);
                    setDeliveryQuantities({});
                    setIsDeliveryModalOpen(true);
                  }}
                  className={`px-3 py-1.5 bg-${theme.color}-50 text-${theme.color}-600 hover:bg-${theme.color}-100 rounded-lg text-[10px] font-bold shadow-sm transition-colors flex items-center gap-1`}
                >
                  <Truck size={12} /> Fuatilia
                </button>
              </div>
            </div>
          );
        })}
        {filteredLoans.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-2xl border-dashed">
            <Truck size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-black text-slate-800 mb-1">Hakuna mizigo</h3>
            <p className="text-slate-500 text-sm">Hakuna mizigo {activeTab === 'PENDING' ? 'inayosubiri kufikishwa' : 'iliyokamilika'} kwa sasa.</p>
          </div>
        )}
      </div>

      {/* Delivery Tracker Modal */}
      {isDeliveryModalOpen && selectedRecord && selectedRecord.items && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white w-full max-w-2xl ${radiusClass} shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-black text-slate-800 flex items-center gap-2"><Truck size={18} className="text-indigo-500"/> Usafirishaji wa Rekodi ya {selectedRecord.type === 'LOAN' ? 'Mkopo' : 'Lipa Mdogo Mdogo'}</h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleResetDeliveries}
                  className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition-colors"
                  title="Futa historia yote ya usafirishaji na anza upya"
                >
                  <RotateCcw size={12} /> Anza Upya
                </button>
                <button onClick={() => { setIsDeliveryModalOpen(false); setSelectedRecord(null); }} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Current Status */}
              <div>
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">Hali ya Mizigo</h4>
                <div className="space-y-3">
                  {selectedRecord.items.map((item, idx) => {
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
              {selectedRecord.items.some(item => (item.quantity - (item.delivered || 0)) > 0) && (
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
              {selectedRecord.deliveries && selectedRecord.deliveries.length > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">Historia ya Usafirishaji</h4>
                  <div className="space-y-3">
                    {selectedRecord.deliveries.slice().reverse().map((delivery, idx) => (
                      <div key={delivery.id} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{new Date(delivery.date).toLocaleDateString()} {new Date(delivery.date).toLocaleTimeString()}</p>
                            {delivery.driverInfo && <p className="text-[10px] text-slate-500 mt-0.5"><Truck size={10} className="inline mr-1"/> {delivery.driverInfo}</p>}
                          </div>
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded">Awamu #{selectedRecord.deliveries!.length - idx}</span>
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
