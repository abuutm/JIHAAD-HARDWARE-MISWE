
import { ProductCategory, Product, Supplier, Customer, User, UserRole, Unit } from './types';

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'sup1', name: 'Wasambazaji Vipuri Yamaha', contactName: 'John Yamaha', email: 'john@yamaha.com', phone: '0712-000111', address: 'Barabara ya Injini 123, Hamamatsu' },
  { id: 'sup2', name: 'Ulimwengu wa Kofia ngumu', contactName: 'Sarah Head', email: 'sales@helmetworld.com', phone: '0712-222333', address: 'Mtaa wa Usalama 45, Boston' },
  { id: 'sup3', name: 'Mabingwa wa Matairi', contactName: 'Rubber Mike', email: 'mike@tiremaster.com', phone: '0712-444555', address: 'Barabara ya Matairi 88, Akron' },
  { id: 'sup4', name: 'Honda Parts Central', contactName: 'David Honda', email: 'david@honda.com', phone: '0712-666777', address: 'Mtaa wa Nguvu, Tokyo' },
  { id: 'sup5', name: 'Bajaj Tanzania', contactName: 'Fatma Bajaj', email: 'fatma@bajaj.co.tz', phone: '0712-888999', address: 'Kariakoo, Dar es Salaam' },
];

export const INITIAL_PRODUCTS: Product[] = [
  // Motorcycles (Shop 1)
  { id: 'p1', name: 'MT-07', brand: 'Yamaha', model: '2024', category: ProductCategory.MOTORCYCLE, sku: 'YAM-MT07-24', costPrice: 6500000, sellingPrice: 8200000, stockQuantity: 3, reorderLevel: 2, supplierId: 'sup1', description: 'Pikipiki maarufu ya mitaani yenye nguvu kubwa.', unit: Unit.PIECE },
  { id: 'p4', name: 'R6 Race', brand: 'Yamaha', model: '2024', category: ProductCategory.MOTORCYCLE, sku: 'YAM-R6R-24', costPrice: 9000000, sellingPrice: 12500000, stockQuantity: 1, reorderLevel: 1, supplierId: 'sup1', description: 'Pikipiki ya mbio maalum kwa ajili ya uwanja wa mashindano.', unit: Unit.PIECE },
  { id: 'p5', name: 'Africa Twin', brand: 'Honda', model: 'Adventure Sports', category: ProductCategory.MOTORCYCLE, sku: 'HON-AT-AS', costPrice: 18000000, sellingPrice: 22500000, stockQuantity: 2, reorderLevel: 1, supplierId: 'sup4', description: 'Pikipiki ya safari ndefu na maeneo magumu.', unit: Unit.PIECE },
  { id: 'p6', name: 'Boxer BM150', brand: 'Bajaj', model: 'X', category: ProductCategory.MOTORCYCLE, sku: 'BAJ-BM150-X', costPrice: 1800000, sellingPrice: 2400000, stockQuantity: 25, reorderLevel: 10, supplierId: 'sup5', description: 'Pikipiki imara kwa ajili ya biashara na matumizi binafsi.', unit: Unit.PIECE },
  { id: 'p18', name: 'Tenere 700', brand: 'Yamaha', model: '2023', category: ProductCategory.MOTORCYCLE, sku: 'YAM-TEN700-23', costPrice: 15000000, sellingPrice: 18500000, stockQuantity: 2, reorderLevel: 1, supplierId: 'sup1', description: 'Pikipiki ya adventure yenye uwezo mkubwa.', unit: Unit.PIECE },

  // Accessories (Shop 1)
  { id: 'p2', name: 'RF-1400 Helmet', brand: 'Shoei', model: 'Nyeusi', category: ProductCategory.ACCESSORY, sku: 'SHO-RF14-BLK', costPrice: 450000, sellingPrice: 620000, stockQuantity: 12, reorderLevel: 5, supplierId: 'sup2', description: 'Kofia ngumu ya hali ya juu kwa ajili ya mashindano.', unit: Unit.PIECE },
  { id: 'p7', name: 'K-3 SV Helmet', brand: 'AGV', model: 'Rossi Replica', category: ProductCategory.ACCESSORY, sku: 'AGV-K3-ROS', costPrice: 280000, sellingPrice: 390000, stockQuantity: 8, reorderLevel: 4, supplierId: 'sup2', description: 'Kofia ngumu yenye muundo wa Valentino Rossi.', unit: Unit.PIECE },
  { id: 'p8', name: 'GP Plus R V2 Gloves', brand: 'Alpinestars', model: 'Nyeusi', category: ProductCategory.ACCESSORY, sku: 'ALP-GPPR-BLK', costPrice: 120000, sellingPrice: 180000, stockQuantity: 15, reorderLevel: 5, supplierId: 'sup2', description: 'Gloves za ngozi kwa ajili ya ulinzi.', unit: Unit.PIECE },
  { id: 'p19', name: 'Dainese Racing 4 Jacket', brand: 'Dainese', model: 'Leather', category: ProductCategory.ACCESSORY, sku: 'DAI-RAC4-LTH', costPrice: 550000, sellingPrice: 750000, stockQuantity: 6, reorderLevel: 3, supplierId: 'sup2', description: 'Jacket ya ngozi kwa ajili ya waendesha pikipiki.', unit: Unit.PIECE },
  { id: 'p20', name: 'Quad Lock Phone Mount', brand: 'Quad Lock', model: 'Universal', category: ProductCategory.ACCESSORY, sku: 'QLK-UNIV-MNT', costPrice: 80000, sellingPrice: 120000, stockQuantity: 30, reorderLevel: 10, supplierId: 'sup2', description: 'Holder ya simu imara kwa pikipiki.', unit: Unit.PIECE },

  // Spare Parts (Shop 1)
  { id: 'p3', name: 'Brake Pad Set', brand: 'EBC', model: 'HH Sintered', category: ProductCategory.SPARE_PART, sku: 'EBC-BP-990', costPrice: 25000, sellingPrice: 45000, stockQuantity: 50, reorderLevel: 10, supplierId: 'sup1', description: 'Vifaa vya breki vyenye uwezo mkubwa wa kusimama.', unit: Unit.PIECE },
  { id: 'p9', name: 'Oil Filter', brand: 'K&N', model: 'KN-204', category: ProductCategory.SPARE_PART, sku: 'KN-OF-204', costPrice: 15000, sellingPrice: 25000, stockQuantity: 100, reorderLevel: 25, supplierId: 'sup1', description: 'Chujio cha mafuta chenye ubora wa hali ya juu.', unit: Unit.PIECE },
  { id: 'p10', name: 'Spark Plug', brand: 'NGK', model: 'CR9EIA-9', category: ProductCategory.SPARE_PART, sku: 'NGK-SP-9EIA9', costPrice: 12000, sellingPrice: 20000, stockQuantity: 80, reorderLevel: 30, supplierId: 'sup4', description: 'Spark plug za Iridium kwa ufanisi zaidi.', unit: Unit.PIECE },
  { id: 'p11', name: 'Chain & Sprocket Kit', brand: 'DID', model: '525VX3', category: ProductCategory.SPARE_PART, sku: 'DID-CSK-525', costPrice: 180000, sellingPrice: 250000, stockQuantity: 10, reorderLevel: 4, supplierId: 'sup1', description: 'Seti kamili ya cheni na sproketi.', unit: Unit.PIECE },
  { id: 'p12', name: 'Air Filter', brand: 'BMC', model: 'FM812/04', category: ProductCategory.SPARE_PART, sku: 'BMC-AF-81204', costPrice: 65000, sellingPrice: 95000, stockQuantity: 20, reorderLevel: 8, supplierId: 'sup4', description: 'Chujio cha hewa kinachoweza kufuliwa na kutumika tena.', unit: Unit.PIECE },
  { id: 'p13', name: 'Motorcycle Battery', brand: 'Yuasa', model: 'YTZ10S', category: ProductCategory.SPARE_PART, sku: 'YUA-BAT-10S', costPrice: 90000, sellingPrice: 130000, stockQuantity: 18, reorderLevel: 5, supplierId: 'sup1', description: 'Betri imara isiyohitaji matunzo.', unit: Unit.PIECE },
  { id: 'p14', name: 'Engine Oil - 1L', brand: 'Motul', model: '7100 10W40', category: ProductCategory.SPARE_PART, sku: 'MOT-OIL-7100', costPrice: 22000, sellingPrice: 35000, stockQuantity: 60, reorderLevel: 20, supplierId: 'sup1', description: 'Mafuta ya injini ya Synthetic.', unit: Unit.LITRE },
  { id: 'p15', name: 'Michelin Road 6 (Rear)', brand: 'Michelin', model: '180/55-17', category: ProductCategory.SPARE_PART, sku: 'MIC-RD6-180', costPrice: 250000, sellingPrice: 350000, stockQuantity: 5, reorderLevel: 2, supplierId: 'sup3', description: 'Tairi ya nyuma kwa ajili ya barabara.', unit: Unit.PIECE },
  { id: 'p16', name: 'Brake Fluid DOT 4', brand: 'Brembo', model: '500ml', category: ProductCategory.SPARE_PART, sku: 'BRE-BF-DOT4', costPrice: 10000, sellingPrice: 18000, stockQuantity: 40, reorderLevel: 15, supplierId: 'sup1', description: 'Mafuta ya breki yenye kiwango cha juu.', unit: Unit.LITRE },
  { id: 'p17', name: 'Clutch Lever', brand: 'OEM', model: 'Universal', category: ProductCategory.SPARE_PART, sku: 'OEM-CL-UNIV', costPrice: 8000, sellingPrice: 15000, stockQuantity: 35, reorderLevel: 10, supplierId: 'sup4', description: 'Mkono wa klachi wa kawaida.', unit: Unit.PIECE },

  // Construction Materials (Stocko Store)
  { id: 'p21', name: 'Mbao 2x4 (Futi 12)', brand: 'Local', model: 'Pine', category: ProductCategory.TIMBER, sku: 'TIM-2X4-12', costPrice: 12000, sellingPrice: 18000, stockQuantity: 500, reorderLevel: 100, supplierId: 'sup5', description: 'Mbao za kuezekea nyumba, ngumu na imara.', unit: Unit.PIECE },
  { id: 'p22', name: 'Mbao 2x2 (Futi 12)', brand: 'Local', model: 'Cypress', category: ProductCategory.TIMBER, sku: 'TIM-2X2-12', costPrice: 6000, sellingPrice: 9000, stockQuantity: 800, reorderLevel: 150, supplierId: 'sup5', description: 'Mbao za fremu na matumizi mengine ya ujenzi.', unit: Unit.PIECE },
  { id: 'p23', name: 'Simba Cement (50kg)', brand: 'Simba', model: '42.5N', category: ProductCategory.CEMENT, sku: 'CEM-SIM-50', costPrice: 16500, sellingPrice: 18500, stockQuantity: 200, reorderLevel: 50, supplierId: 'sup5', description: 'Saruji imara kwa ujenzi wa kudumu.', unit: Unit.PIECE },
  { id: 'p24', name: 'Twiga Cement (50kg)', brand: 'Twiga', model: 'Ordinary', category: ProductCategory.CEMENT, sku: 'CEM-TWI-50', costPrice: 16000, sellingPrice: 18000, stockQuantity: 150, reorderLevel: 40, supplierId: 'sup5', description: 'Saruji ya kawaida kwa ujenzi wa nyumba.', unit: Unit.PIECE },
  { id: 'p25', name: 'Tofali 6 Inch', brand: 'Local', model: 'Solid Block', category: ProductCategory.BRICKS, sku: 'BLK-6IN-SOL', costPrice: 1100, sellingPrice: 1500, stockQuantity: 2000, reorderLevel: 500, supplierId: 'sup5', description: 'Matofali imara ya inchi 6 kwa kuta kuu.', unit: Unit.PIECE },
  { id: 'p26', name: 'Tofali 5 Inch', brand: 'Local', model: 'Solid Block', category: ProductCategory.BRICKS, sku: 'BLK-5IN-SOL', costPrice: 900, sellingPrice: 1300, stockQuantity: 2500, reorderLevel: 500, supplierId: 'sup5', description: 'Matofali ya inchi 5 kwa kuta za ndani.', unit: Unit.PIECE },
];


export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Alex Mwendesha', email: 'alex@mfano.com', phone: '0754-987654', address: 'Mtaa wa Kasi 10, Dar es Salaam', totalSpent: 8200000, lastPurchaseDate: '2024-03-01' },
  { id: 'c2', name: 'Casey Stoner', email: 'casey@motogp.com', phone: '0754-272727', address: 'Njia ya Ushindi 27, Arusha', totalSpent: 620000, lastPurchaseDate: '2024-03-10' },
  { id: 'c3', name: 'Asha Fundi', email: 'asha.fundi@garage.com', phone: '0711-123456', address: 'Garage ya Kisasa, Mwanza', totalSpent: 250000, lastPurchaseDate: '2024-03-15' },
  { id: 'c4', name: 'BodaBoda Express', email: 'info@bodaboda.co.tz', phone: '0788-555000', address: 'Makao Makuu, Dodoma', totalSpent: 2400000, lastPurchaseDate: '2024-02-28' },
  { id: 'c5', name: 'Safari Bikers Club', email: 'tours@safari.com', phone: '0766-999888', address: 'Kilimanjaro Rd, Moshi', totalSpent: 22500000, lastPurchaseDate: '2024-01-20' },
];


export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Msimamizi Mkuu', email: 'admin@motostock.pro', role: UserRole.ADMIN },
  { id: 'u2', name: 'Mfanyakazi wa Duka', email: 'staff@motostock.pro', role: UserRole.STAFF },
];

export const TAX_RATE = 0.18; // Kodi ya Ongezeko la Thamani (VAT) 18% nchini Tanzania
