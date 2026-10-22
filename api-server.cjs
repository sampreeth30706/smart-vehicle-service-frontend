const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = 8080;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'smart_vehicle_db.json');
const SQLITE_FILE = path.join(DATA_DIR, 'smart_vehicle.sqlite');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function hashPassword(plain) {
  return crypto.createHash('sha256').update(String(plain) + '_autopulse_salt').digest('hex');
}

// Initialize Real Relational SQLite Database
const sqliteDb = new DatabaseSync(SQLITE_FILE);
sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL,
    specialization TEXT,
    active INTEGER DEFAULT 1,
    createdAt TEXT
  );
`);

const DEFAULT_PASSWORD_HASH = hashPassword('password123');

const INITIAL_DB = {
  users: [
    {
      id: 1,
      fullName: 'Aarav Sharma',
      email: 'customer@autopulse.in',
      phone: '+91 98765 43210',
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: 'CUSTOMER',
      specialization: 'Vehicle Owner',
      active: true,
      createdAt: '2026-10-01T09:00:00Z',
    },
    {
      id: 2,
      fullName: 'Vikram Patel',
      email: 'mechanic@autopulse.in',
      phone: '+91 98201 55432',
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: 'MECHANIC',
      specialization: 'Master Technician • Powertrain & EV Diagnostics',
      active: true,
      createdAt: '2026-10-01T09:05:00Z',
    },
    {
      id: 3,
      fullName: 'Rohan Deshmukh',
      email: 'mechanic2@autopulse.in',
      phone: '+91 98201 77889',
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: 'MECHANIC',
      specialization: 'Brakes, Suspension & AC Specialist',
      active: true,
      createdAt: '2026-10-01T09:10:00Z',
    },
    {
      id: 4,
      fullName: 'Priya Nair',
      email: 'admin@autopulse.in',
      phone: '+91 98111 22334',
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: 'ADMIN',
      specialization: 'Service Center Operations Director',
      active: true,
      createdAt: '2026-10-01T09:15:00Z',
    },
  ],
  // Starts empty — populated in real-time as customers register vehicles & book services!
  vehicles: [],
  serviceRequests: [],
  invoices: [],
  notifications: [],
  // Workshop Spare Parts Catalog (for Mechanics & Admin to use during repairs)
  inventoryParts: [
    {
      id: 201,
      sku: 'OIL-SYN-5W30',
      partName: 'Castrol EDGE 5W-30 Full Synthetic Oil (4L)',
      category: 'Lubricants & Fluids',
      stockQuantity: 18,
      reorderLevel: 8,
      unitPrice: 2650,
      supplier: 'Castrol India Ltd',
    },
    {
      id: 202,
      sku: 'FLT-OIL-OEM',
      partName: 'OEM Spin-On Engine Oil Filter',
      category: 'Filters',
      stockQuantity: 24,
      reorderLevel: 10,
      unitPrice: 480,
      supplier: 'Mobis Genuine Parts',
    },
    {
      id: 203,
      sku: 'BRK-PAD-FRT',
      partName: 'Brembo Front Ceramic Brake Pad Set',
      category: 'Braking System',
      stockQuantity: 4,
      reorderLevel: 6,
      unitPrice: 3450,
      supplier: 'Brembo Auto Components',
    },
    {
      id: 204,
      sku: 'FLT-CAB-ACT',
      partName: 'Activated Carbon Cabin AC Microfilter',
      category: 'HVAC & Cooling',
      stockQuantity: 14,
      reorderLevel: 6,
      unitPrice: 890,
      supplier: 'Bosch Automotive',
    },
    {
      id: 205,
      sku: 'BAT-12V-60AH',
      partName: 'Amaron Pro 12V 60Ah AGM Battery',
      category: 'Electrical & Battery',
      stockQuantity: 3,
      reorderLevel: 5,
      unitPrice: 6200,
      supplier: 'Amara Raja Batteries',
    },
    {
      id: 206,
      sku: 'BRK-FLD-DOT4',
      partName: 'Bosch DOT-4 Synthetic Brake Fluid (500ml)',
      category: 'Lubricants & Fluids',
      stockQuantity: 15,
      reorderLevel: 5,
      unitPrice: 420,
      supplier: 'Bosch Automotive',
    },
    {
      id: 207,
      sku: 'SPK-IRID-SET',
      partName: 'NGK Laser Iridium Spark Plug Set (4 pcs)',
      category: 'Ignition & Engine',
      stockQuantity: 9,
      reorderLevel: 4,
      unitPrice: 2800,
      supplier: 'NGK Spark Plugs India',
    },
  ],
};

function syncUsersToSqlite(users) {
  const insertStmt = sqliteDb.prepare(`
    INSERT OR IGNORE INTO users (id, fullName, email, phone, passwordHash, role, specialization, active, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const u of users) {
    insertStmt.run(
      u.id,
      u.fullName,
      u.email.toLowerCase(),
      u.phone || '+91 90000 00000',
      u.passwordHash || DEFAULT_PASSWORD_HASH,
      u.role,
      u.specialization || u.role,
      u.active ? 1 : 0,
      u.createdAt || new Date().toISOString()
    );
  }
}

function getAllSqliteUsers() {
  const rows = sqliteDb.prepare('SELECT * FROM users ORDER BY id ASC').all();
  return rows.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    email: r.email,
    phone: r.phone,
    passwordHash: r.passwordHash,
    role: r.role,
    specialization: r.specialization,
    active: Boolean(r.active),
    createdAt: r.createdAt,
  }));
}

function loadDb() {
  let db;
  if (!fs.existsSync(DB_FILE)) {
    db = JSON.parse(JSON.stringify(INITIAL_DB));
  } else {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
      db = JSON.parse(JSON.stringify(INITIAL_DB));
    }
  }
  syncUsersToSqlite(INITIAL_DB.users);
  db.users = getAllSqliteUsers();
  db.vehicles = db.vehicles || [];
  db.serviceRequests = (db.serviceRequests || []).map((sr) => ({
    ...sr,
    repairTasks:
      Array.isArray(sr.repairTasks) && sr.repairTasks.length > 0
        ? sr.repairTasks
        : [
            { id: 1, title: `Inspect & resolve: ${sr.serviceType || 'Scheduled Service'}`, completed: false },
            { id: 2, title: 'Multi-point fluid, filter & brake safety inspection', completed: false },
          ],
    qcChecklist:
      Array.isArray(sr.qcChecklist) && sr.qcChecklist.length > 0
        ? sr.qcChecklist
        : [
            { id: 1, label: 'Engine / Motor fluid levels & zero-leak verification', passed: false },
            { id: 2, label: 'Braking performance & pedal pressure road test', passed: false },
            { id: 3, label: 'Wheel lug nut torque & tire pressure check', passed: false },
            { id: 4, label: 'Electrical systems, battery voltage & OBD-II fault code clear', passed: false },
            { id: 5, label: 'Exterior wash, interior vacuum & final safety sign-off', passed: false },
          ],
  }));
  db.invoices = db.invoices || [];
  db.notifications = db.notifications || [];
  db.inventoryParts = db.inventoryParts || INITIAL_DB.inventoryParts;
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  return db;
}

function saveDb(db) {
  db.users = getAllSqliteUsers();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function sanitizeUser(u) {
  const { passwordHash, ...safe } = u;
  return safe;
}

function createJwt(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.email,
      userId: user.id,
      role: user.role,
      name: user.fullName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', 'SmartVehicleServiceManagementSystemSecretKey2026')
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${sig}`;
}

function syncInvoiceForService(db, sr) {
  const partsSubtotal = (sr.usedParts || []).reduce(
    (sum, p) => sum + Number(p.quantity || 1) * Number(p.unitPrice || 0),
    0
  );
  const labourSubtotal =
    sr.customLabourCost !== undefined && sr.customLabourCost !== null
      ? Math.round(Number(sr.customLabourCost))
      : Math.round((Number(sr.labourHours) || 0) * (Number(sr.labourRate) || 450));

  const includeGst = sr.includeGst !== undefined ? Boolean(sr.includeGst) : true;
  const taxAmount = includeGst ? Math.round((partsSubtotal + labourSubtotal) * 0.18) : 0;

  const calculatedTotal = partsSubtotal + labourSubtotal + taxAmount;
  const grandTotal =
    sr.manualEstimateTotal !== undefined && sr.manualEstimateTotal !== null && Number(sr.manualEstimateTotal) > 0
      ? Math.round(Number(sr.manualEstimateTotal))
      : calculatedTotal;

  sr.partsSubtotal = partsSubtotal;
  sr.labourSubtotal = labourSubtotal;
  sr.taxAmount = taxAmount;
  sr.estimatedCost = grandTotal;

  let inv = db.invoices.find((i) => i.serviceRequestId === sr.id);
  if (!inv) {
    inv = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      serviceRequestId: sr.id,
      bookingCode: sr.bookingCode,
      customerId: sr.customerId,
      customerName: sr.customerName,
      vehicleReg: sr.vehicleReg,
      vehicleName: sr.vehicleName,
      partsSubtotal,
      labourSubtotal,
      taxAmount,
      discountAmount: 0,
      grandTotal,
      paymentStatus: 'PENDING',
      paymentMethod: 'Pending Customer Payment',
      issuedAt: new Date().toISOString(),
      paidAt: null,
    };
    db.invoices.unshift(inv);
  } else {
    inv.partsSubtotal = partsSubtotal;
    inv.labourSubtotal = labourSubtotal;
    inv.taxAmount = taxAmount;
    inv.grandTotal = grandTotal - (inv.discountAmount || 0);
  }
  return inv;
}

// ============================================================================
// COMPREHENSIVE 22-SYSTEM AUTOMOTIVE DIAGNOSTIC DATASET & MULTI-ISSUE ENGINE
// ============================================================================
const DIAGNOSTIC_KNOWLEDGE_BASE = [
  {
    id: 'BRAKE_PADS_ROTORS',
    system: 'Braking System',
    title: 'Worn Ceramic Brake Pads, Rotor Scoring & Caliper Service',
    severity: 'HIGH',
    keywords: ['brake', 'braking', 'squeak', 'squeaking', 'squeal', 'grind', 'grinding', 'screech', 'stopping', 'disc', 'rotor', 'pad', 'pads', 'caliper'],
    baseCostMin: 3400,
    baseCostMax: 5800,
    labourHours: 1.5,
    parts: [
      { name: 'Brembo Front Ceramic Brake Pad Set', estPrice: 2650 },
      { name: 'Bosch DOT-4 Synthetic Brake Fluid (500ml)', estPrice: 480 },
    ],
    repairSteps: [
      'Measure front & rear brake pad friction lining thickness (replace if < 3.0 mm)',
      'Inspect brake disc rotors for scoring/runout; skim or resurface discs if required',
      'Clean & lubricate floating caliper guide pins and bleed hydraulic DOT-4 brake lines',
    ],
  },
  {
    id: 'ABS_HYDRAULIC_BRAKE',
    system: 'ABS & Hydraulic Brake Control',
    title: 'ABS Wheel Speed Sensor Fault / Master Cylinder Pressure Loss',
    severity: 'HIGH',
    keywords: ['abs', 'spongy', 'soft pedal', 'pedal goes to floor', 'brake warning', 'brake fluid leak', 'master cylinder', 'skid'],
    baseCostMin: 3800,
    baseCostMax: 7900,
    labourHours: 2.0,
    parts: [
      { name: 'Bosch ABS Wheel Speed Sensor Module', estPrice: 2450 },
      { name: 'Bosch DOT-4 Synthetic Brake Fluid (1L Flush)', estPrice: 960 },
    ],
    repairSteps: [
      'Run OBD-II ABS module diagnostic scan to isolate faulty wheel speed sensor or tone ring',
      'Pressure-test brake master cylinder primary/secondary seals and hydraulic hoses for leaks',
      'Replace faulty ABS sensor, clear DTC fault codes & perform ABS calibration road test',
    ],
  },
  {
    id: 'PERIODIC_OIL_SERVICE',
    system: 'Engine Lubrication & Periodic Maintenance',
    title: 'Periodic Synthetic Engine Oil, Oil Filter & Multi-Filter Service',
    severity: 'LOW',
    keywords: ['oil change', 'periodic', 'routine', 'general service', 'regular service', 'engine oil', 'oil filter', 'maintenance', 'service due', '10000', 'lubrication'],
    baseCostMin: 2800,
    baseCostMax: 4600,
    labourHours: 1.5,
    parts: [
      { name: 'Castrol EDGE 5W-30 Full Synthetic Engine Oil (4L)', estPrice: 2850 },
      { name: 'OEM Spin-On Engine Oil Filter & Drain Plug Washer', estPrice: 520 },
      { name: 'Engine Air Intake Filter Element', estPrice: 680 },
    ],
    repairSteps: [
      'Drain old degraded engine oil at operating temperature & replace sump drain plug washer',
      'Install new OEM spin-on oil filter and refill with 5W-30 API SP Full Synthetic oil',
      'Clean/replace engine air intake filter, top up all under-bonnet fluids & reset service reminder',
    ],
  },
  {
    id: 'ENGINE_OIL_LEAK',
    system: 'Engine Seals & Gaskets',
    title: 'Engine Valve Cover Gasket / Oil Sump Seal Leak',
    severity: 'HIGH',
    keywords: ['oil leak', 'leaking oil', 'dripping oil', 'oil spot', 'burning oil', 'valve cover', 'tappet cover', 'sump', 'gasket', 'oil level low', 'blue smoke'],
    baseCostMin: 3200,
    baseCostMax: 6800,
    labourHours: 2.5,
    parts: [
      { name: 'OEM Viton Valve Cover Gasket & Grommet Kit', estPrice: 1650 },
      { name: 'High-Temp RTV Silicone Crankcase Sealant', estPrice: 450 },
      { name: 'Castrol EDGE 5W-30 Synthetic Oil Top-Up (1L)', estPrice: 750 },
    ],
    repairSteps: [
      'Degrease engine block and perform UV dye inspection to pinpoint exact oil leak source',
      'Replace hardened valve cover gasket / oil pan seal and torque bolts in criss-cross sequence',
      'Inspect PCV (Positive Crankcase Ventilation) valve for blockage causing excess crankcase pressure',
    ],
  },
  {
    id: 'ENGINE_OVERHEATING_COOLING',
    system: 'Engine Cooling & Thermal Management',
    title: 'Engine Overheating — Thermostat Valve, Radiator or Water Pump Fault',
    severity: 'HIGH',
    keywords: ['overheat', 'overheating', 'temperature', 'temp gauge', 'hot', 'coolant', 'radiator', 'water pump', 'thermostat', 'cooling fan', 'steam', 'white smoke', 'boiling'],
    baseCostMin: 3900,
    baseCostMax: 8500,
    labourHours: 2.5,
    parts: [
      { name: 'OEM Wax-Pellet Coolant Thermostat Assembly (82°C)', estPrice: 1450 },
      { name: 'Long-Life OAT Ethylene Glycol Coolant Concentrate (3L)', estPrice: 1350 },
      { name: 'Radiator Pressure Cap & EPDM Upper Hose Clamp', estPrice: 650 },
    ],
    repairSteps: [
      'Perform cooling system pressure test (1.1 bar) to detect radiator core, hose, or water pump leaks',
      'Test radiator electric cooling fan relay, temperature sensor (ECT) & thermostat opening temperature',
      'Replace faulty thermostat/hose, flush cooling jacket & vacuum-bleed fresh OAT coolant',
    ],
  },
  {
    id: 'ENGINE_MISFIRE_IGNITION',
    system: 'Ignition & Combustion System',
    title: 'Cylinder Misfire, Rough Idle & Ignition Coil / Spark Plug Degradation',
    severity: 'HIGH',
    keywords: ['misfire', 'misfiring', 'rough idle', 'idling rough', 'jerking', 'jerk', 'stalling', 'stall', 'spark plug', 'ignition coil', 'check engine', 'cel', 'engine light', 'hesitation', 'engine shaking'],
    baseCostMin: 3500,
    baseCostMax: 7400,
    labourHours: 1.5,
    parts: [
      { name: 'NGK Laser Iridium Spark Plug Set (4 pcs)', estPrice: 2800 },
      { name: 'OEM Direct Ignition Coil Pack', estPrice: 2200 },
    ],
    repairSteps: [
      'Read OBD-II live misfire counters (P0300–P0304) and fuel trim parameters via diagnostic scanner',
      'Inspect spark plug electrodes for carbon fouling/gap wear and test HV ignition coil resistance',
      'Replace worn Iridium spark plugs / faulty coil pack, clear ECU fault codes & verify smooth idle RPM',
    ],
  },
  {
    id: 'FUEL_INJECTOR_THROTTLE',
    system: 'Fuel Injection & Air Intake',
    title: 'Clogged Fuel Injectors, Carbonized Throttle Body & Low Fuel Economy',
    severity: 'MEDIUM',
    keywords: ['mileage drop', 'low mileage', 'poor pickup', 'loss of power', 'sluggish', 'black smoke', 'throttle', 'injector', 'fuel pump', 'acceleration', 'lag', 'rpm fluctuating', 'hunting idle'],
    baseCostMin: 2600,
    baseCostMax: 5900,
    labourHours: 2.0,
    parts: [
      { name: 'Ultrasonic Fuel Injector O-Ring & Microfilter Kit', estPrice: 1150 },
      { name: 'Electronic Throttle Body Cleaner & Intake Gasket', estPrice: 780 },
      { name: 'High-Pressure In-Line Fuel Filter', estPrice: 950 },
    ],
    repairSteps: [
      'Remove electronic throttle body, clean carbon deposits from butterfly valve & perform ECU idle relearn',
      'Ultrasonically clean & flow-test fuel injectors on test bench for spray pattern uniformity',
      'Check fuel rail pressure, clean MAF/MAP intake sensor & replace clogged fuel filter',
    ],
  },
  {
    id: 'CLUTCH_ASSEMBLY_WEAR',
    system: 'Clutch & Manual Transmission Coupling',
    title: 'Worn Clutch Friction Disc, Pressure Plate & Release Bearing',
    severity: 'HIGH',
    keywords: ['clutch', 'slipping', 'clutch hard', 'hard clutch', 'high biting', 'clutch pedal', 'flywheel', 'judder', 'burning smell uphill', 'rpm rises but speed'],
    baseCostMin: 6800,
    baseCostMax: 13500,
    labourHours: 4.5,
    parts: [
      { name: 'Valeo OEM Clutch Plate & Diaphragm Pressure Plate Kit', estPrice: 5400 },
      { name: 'Hydraulic Clutch Release Bearing / Slave Cylinder', estPrice: 2100 },
      { name: '75W-90 Synthetic Gear Oil (2.5L)', estPrice: 1450 },
    ],
    repairSteps: [
      'Road-test clutch engagement point and verify slippage under load in 3rd/4th gear',
      'Remove transaxle gearbox, inspect flywheel friction surface & replace clutch disc + pressure plate + release bearing',
      'Bleed hydraulic clutch master/slave cylinder actuator and refill fresh 75W-90 transmission oil',
    ],
  },
  {
    id: 'GEARBOX_TRANSMISSION_AXLE',
    system: 'Transmission, Gearbox & Drive Axles',
    title: 'Transmission Shift Stiffness / Synchronizer Wear or CV Axle Joint Noise',
    severity: 'HIGH',
    keywords: ['gear', 'gearbox', 'transmission', 'shifting', 'hard shift', 'grinding gear', 'cvt', 'automatic', 'dct', 'torque converter', 'axle', 'cv joint', 'clicking when turning', 'driveshaft'],
    baseCostMin: 4200,
    baseCostMax: 9800,
    labourHours: 3.0,
    parts: [
      { name: 'Synthetic ATF / CVT / 75W-90 Transmission Fluid (4L)', estPrice: 3200 },
      { name: 'Outer CV Joint Boot & Moly Grease Kit / Shift Cable Bush', estPrice: 1850 },
    ],
    repairSteps: [
      'Inspect transmission fluid level, color & metallic debris; scan TCU (Transmission Control Unit) for shift solenoid faults',
      'Lubricate/adjust gear shifter selector cables or perform automatic transmission clutch adaptive learning',
      'Inspect front drive axle constant-velocity (CV) joints and rubber boots for grease tears or clicking under full lock',
    ],
  },
  {
    id: 'BATTERY_STARTER_CRANK',
    system: '12V Starting & Battery System',
    title: 'Degraded 12V AGM Battery Cells or Starter Motor Solenoid Wear',
    severity: 'HIGH',
    keywords: ['battery', 'crank', 'cranking', 'slow start', 'wont start', 'won\'t start', 'no start', 'dead battery', 'jump start', 'starter', 'clicking start', 'morning start'],
    baseCostMin: 2200,
    baseCostMax: 7200,
    labourHours: 1.0,
    parts: [
      { name: 'Amaron Pro 12V 60Ah Maintenance-Free AGM Battery', estPrice: 5800 },
      { name: 'Anti-Corrosion Battery Terminal Clamp & Relay Kit', estPrice: 450 },
    ],
    repairSteps: [
      'Perform digital conductance & CCA (Cold Cranking Amps) load test on 12V battery',
      'Measure starter motor current draw and inspect starter Bendix drive & solenoid contacts',
      'Clean sulfated battery terminals, install replacement 12V AGM battery & verify parasitic sleep draw (< 50 mA)',
    ],
  },
  {
    id: 'ALTERNATOR_CHARGING',
    system: 'Alternator & Electrical Charging',
    title: 'Alternator Voltage Regulator / Rectifier Diode Failure',
    severity: 'HIGH',
    keywords: ['alternator', 'battery light', 'battery warning', 'charging', 'voltage drop', 'dimming', 'electrical drain', 'whining engine speed'],
    baseCostMin: 3600,
    baseCostMax: 8400,
    labourHours: 2.0,
    parts: [
      { name: 'Bosch Alternator Voltage Regulator & Brush Assembly', estPrice: 2650 },
      { name: 'EPDM 6PK Serpentine Alternator Drive Belt', estPrice: 1150 },
    ],
    repairSteps: [
      'Measure alternator charging voltage across battery terminals at 2,000 RPM with AC + headlights ON (target 13.9V–14.4V)',
      'Test alternator rectifier diode ripple and inspect carbon slip-ring brushes',
      'Service/replace alternator regulator assembly and adjust serpentine drive belt tension',
    ],
  },
  {
    id: 'AC_CLIMATE_CONTROL',
    system: 'HVAC & Cabin Air Conditioning',
    title: 'Low R134a Refrigerant Charge, Clogged Cabin Filter or AC Compressor Clutch',
    severity: 'MEDIUM',
    keywords: ['ac', 'a/c', 'air condition', 'cooling', 'not cooling', 'warm air', 'compressor', 'refrigerant', 'ac gas', 'blower', 'musty', 'foul smell', 'cabin filter', 'defogger'],
    baseCostMin: 2100,
    baseCostMax: 5400,
    labourHours: 1.5,
    parts: [
      { name: 'Activated Carbon Cabin AC Microfilter', estPrice: 780 },
      { name: 'Dupont Suva R134a Refrigerant Gas & PAG Compressor Oil', estPrice: 1650 },
      { name: 'AC High-Pressure Expansion Valve O-Ring Seal Kit', estPrice: 450 },
    ],
    repairSteps: [
      'Connect manifold gauges to measure low-side (28–38 PSI) and high-side (180–220 PSI) AC pressures',
      'Perform vacuum leak test, recharge R134a refrigerant with UV PAG oil & verify compressor electromagnetic clutch engagement',
      'Replace activated carbon cabin AC filter, clean blower fan wheel & antibacterial-sanitize evaporator coils',
    ],
  },
  {
    id: 'SUSPENSION_SHOCKS_BUSHINGS',
    system: 'Suspension, Struts & Chassis',
    title: 'Worn MacPherson Strut Mounts, Lower Control Arm Bushings & Link Rods',
    severity: 'MEDIUM',
    keywords: ['suspension', 'shock', 'strut', 'clunk', 'clunking', 'thud', 'rattling', 'pothole', 'bumpy', 'bouncy', 'lower arm', 'control arm', 'bushing', 'ball joint', 'stabilizer', 'link rod', 'squeak over bumps'],
    baseCostMin: 3800,
    baseCostMax: 8900,
    labourHours: 2.5,
    parts: [
      { name: 'Front Stabilizer Bar Link Rod Set (LH + RH)', estPrice: 1850 },
      { name: 'Lower Control Arm Hydro-Bushing & Ball Joint Kit', estPrice: 2950 },
      { name: 'MacPherson Strut Top Mounting Bearing', estPrice: 1450 },
    ],
    repairSteps: [
      'Raise vehicle on 2-post lift and inspect front/rear shock absorbers for hydraulic oil seepage',
      'Check play in lower control arm rubber bushings, ball joints, tie-rod ends & stabilizer link rods',
      'Replace worn suspension link rods/bushings, torque chassis bolts under ride-height load & road test over uneven terrain',
    ],
  },
  {
    id: 'WHEEL_ALIGNMENT_BALANCING',
    system: 'Steering Geometry & Wheel Balance',
    title: 'Wheel Alignment Toe/Camber Drift & Dynamic Wheel Imbalance',
    severity: 'MEDIUM',
    keywords: ['alignment', 'balancing', 'vibration', 'vibrating', 'steering shake', 'wobble', 'pull', 'pulling', 'drifting', 'left', 'right', 'highway', '60', '80', '100', 'uneven tire'],
    baseCostMin: 1600,
    baseCostMax: 3400,
    labourHours: 1.0,
    parts: [
      { name: 'Adhesive Alloy Wheel Balancing Counterweights (Set)', estPrice: 450 },
      { name: 'Tie-Rod Lock Nut & Camber Shim Adjustment Kit', estPrice: 550 },
    ],
    repairSteps: [
      'Perform 3D computerized 4-wheel laser alignment (adjust front/rear Toe, Camber & Caster to OEM spec)',
      'Mount all 4 wheels on high-speed dynamic balancer and apply precision gram counterweights',
      'Rotate tires front-to-rear, set cold tire inflation pressure & verify straight-line highway tracking',
    ],
  },
  {
    id: 'POWER_STEERING_RACK',
    system: 'Power Steering (EPS / Rack & Pinion)',
    title: 'Electric Power Steering (EPS) Torque Sensor or Steering Rack Play',
    severity: 'HIGH',
    keywords: ['steering hard', 'heavy steering', 'stiff steering', 'eps', 'steering light', 'steering rack', 'tie rod', 'steering noise', 'whining turning', 'steering play'],
    baseCostMin: 3500,
    baseCostMax: 8600,
    labourHours: 2.5,
    parts: [
      { name: 'OEM Outer Tie-Rod End & Rack Boot Bellows Pair', estPrice: 2450 },
      { name: 'Steering Column Intermediate Shaft U-Joint / Bush', estPrice: 1950 },
    ],
    repairSteps: [
      'Scan EPS (Electric Power Steering) control module for torque sensor or assist motor current fault codes',
      'Inspect rack-and-pinion inner/outer tie-rod ends and rubber dust boots for play or grease leakage',
      'Replace worn tie-rod ends/steering rack bush and perform zero-point steering angle sensor (SAS) calibration',
    ],
  },
  {
    id: 'EXHAUST_CATALYTIC_EMISSION',
    system: 'Exhaust, Catalytic Converter & Emissions',
    title: 'Oxygen (O2) Sensor Fouling, Catalytic Converter Efficiency or Exhaust Leak',
    severity: 'MEDIUM',
    keywords: ['exhaust', 'muffler', 'silencer', 'loud noise', 'roar', 'catalytic', 'dpf', 'emission', 'puc fail', 'o2 sensor', 'lambda', 'rotten egg', 'sulfur', 'fumes'],
    baseCostMin: 3200,
    baseCostMax: 7800,
    labourHours: 2.0,
    parts: [
      { name: 'Bosch Upstream Wideband Oxygen (O2 / Lambda) Sensor', estPrice: 3100 },
      { name: 'Multi-Layer Stainless Exhaust Flange Gasket & Clamp', estPrice: 680 },
    ],
    repairSteps: [
      'Analyze upstream & downstream O2 sensor voltage waveform and catalytic converter efficiency (P0420) via OBD-II',
      'Inspect exhaust manifold gasket, flex pipe, catalytic converter & rear muffler for pinhole leaks or rust',
      'Perform catalytic/DPF decarbonization cleaning or replace faulty O2 sensor & verify CO/HC emission levels for PUC',
    ],
  },
  {
    id: 'TIMING_SERPENTINE_BELT',
    system: 'Engine Timing & Accessory Drive',
    title: 'Serpentine Drive Belt Squeal / Tensioner Bearing or Timing Chain Rattle',
    severity: 'HIGH',
    keywords: ['belt', 'timing', 'chain', 'rattle', 'rattling cold', 'squealing engine', 'chirping', 'pulley', 'tensioner', 'whirring'],
    baseCostMin: 2900,
    baseCostMax: 7600,
    labourHours: 2.5,
    parts: [
      { name: 'Gates Micro-V EPDM Serpentine Drive Belt', estPrice: 1250 },
      { name: 'Automatic Belt Tensioner & Idler Pulley Bearing', estPrice: 2350 },
    ],
    repairSteps: [
      'Inspect accessory serpentine belt ribs for cracking, glazing, or fraying',
      'Check automatic belt tensioner pulley, idler bearing & timing chain hydraulic tensioner for play/noise',
      'Replace worn drive belt and tensioner pulley & verify quiet cold-start operation',
    ],
  },
  {
    id: 'TURBO_EGR_DIESEL',
    system: 'Turbocharger, Boost & EGR System',
    title: 'Clogged EGR Valve, Intercooler Boost Hose Leak or Turbo Actuator Fault',
    severity: 'HIGH',
    keywords: ['turbo', 'whistle', 'whistling', 'siren', 'boost', 'intercooler', 'egr', 'limp mode', 'diesel smoke', 'soot'],
    baseCostMin: 4200,
    baseCostMax: 9500,
    labourHours: 3.0,
    parts: [
      { name: 'Silicone Reinforced Turbo Intercooler Boost Hose', estPrice: 2150 },
      { name: 'EGR (Exhaust Gas Recirculation) Valve Gasket & Solvent Kit', estPrice: 1350 },
    ],
    repairSteps: [
      'Smoke-test turbocharger intercooler piping and hose clamps for boost pressure leaks',
      'Dismantle and decarbonize soot-clogged EGR valve, cooler passage & intake manifold',
      'Test turbo VGT (Variable Geometry) vacuum/electronic actuator travel and verify boost pressure curve',
    ],
  },
  {
    id: 'TIRES_WHEELS_TPMS',
    system: 'Tires, Wheels & TPMS',
    title: 'Tire Tread Wear / Puncture Repair or TPMS Pressure Sensor Service',
    severity: 'MEDIUM',
    keywords: ['tire', 'tyre', 'puncture', 'flat', 'tpms', 'air pressure', 'slow leak', 'sidewall', 'tread', 'rim', 'wheel bent'],
    baseCostMin: 1200,
    baseCostMax: 4800,
    labourHours: 1.0,
    parts: [
      { name: 'Tubeless Mushroom Plug-Patch & High-Pressure Valve Stem', estPrice: 650 },
      { name: 'TPMS Tire Pressure Sensor Battery / Valve Kit', estPrice: 1650 },
    ],
    repairSteps: [
      'Measure tire tread depth across inner, center, and outer grooves across all 4 wheels + spare',
      'Submerge wheel to locate slow bead/valve/nail leak and apply internal mushroom vulcanized patch',
      'Calibrate TPMS (Tire Pressure Monitoring System) wheel sensors and inflate to OEM door-placard PSI',
    ],
  },
  {
    id: 'LIGHTING_WIPERS_ELECTRICAL',
    system: 'Body Electricals, Lighting & Visibility',
    title: 'Headlight / Relay Circuit, Wiper Blade Set or Power Window Actuator Service',
    severity: 'LOW',
    keywords: ['wiper', 'windshield', 'washer', 'headlight', 'bulb', 'dim light', 'fog light', 'tail light', 'indicator', 'horn', 'window', 'power window', 'central lock', 'key fob', 'fuse', 'screen', 'camera', 'parking sensor'],
    baseCostMin: 1400,
    baseCostMax: 3800,
    labourHours: 1.0,
    parts: [
      { name: 'Bosch Aerotwin Frameless Silicone Wiper Blade Pair', estPrice: 1150 },
      { name: 'Osram Night Breaker Halogen / LED Headlamp Bulb & Relay', estPrice: 1450 },
    ],
    repairSteps: [
      'Test body control module (BCM) fuse box, relays, wiring harness & ground points with digital multimeter',
      'Replace worn silicone windshield wiper blades, refill washer reservoir & align headlamp beam pattern',
      'Lubricate power window glass run channels / test ultrasonic reverse parking sensors',
    ],
  },
  {
    id: 'HYBRID_EV_POWERTRAIN',
    system: 'Hybrid / EV High-Voltage System',
    title: 'Hybrid/EV Traction Battery Cooling Filter, Inverter Loop & Regen Calibration',
    severity: 'MEDIUM',
    keywords: ['hybrid', 'ev', 'electric', 'regen', 'regenerative', 'inverter', 'traction battery', 'smart hybrid', 'shvs', 'isg'],
    baseCostMin: 3400,
    baseCostMax: 7800,
    labourHours: 2.0,
    parts: [
      { name: 'Hybrid/EV Battery Cooling Blower Intake Filter', estPrice: 950 },
      { name: 'Dielectric Low-Conductivity Inverter Coolant (2L)', estPrice: 1850 },
      { name: 'ISG (Integrated Starter Generator) Dual-Battery Belt', estPrice: 1450 },
    ],
    repairSteps: [
      'Run hybrid/EV diagnostic health check on Li-Ion / Aux battery cell voltage balance & State of Health (SoH)',
      'Clean hybrid battery cooling fan air filter duct and check inverter coolant circulation pump',
      'Calibrate regenerative braking blending and test ISG auto start-stop energy recuperation',
    ],
  },
];

function getVehicleSegmentMultiplier(make = '', model = '') {
  const full = `${make} ${model}`.toLowerCase();
  if (
    full.includes('bmw') ||
    full.includes('mercedes') ||
    full.includes('audi') ||
    full.includes('volvo') ||
    full.includes('jaguar') ||
    full.includes('land rover') ||
    full.includes('porsche')
  ) {
    return { factor: 2.15, segmentLabel: 'Luxury / Premium European Segment (2.15x OEM Parts & Labour)' };
  }
  if (
    full.includes('fortuner') ||
    full.includes('innova') ||
    full.includes('xuv700') ||
    full.includes('scorpio') ||
    full.includes('safari') ||
    full.includes('harrier') ||
    full.includes('compass') ||
    full.includes('tucson') ||
    full.includes('hector') ||
    full.includes('octavia') ||
    full.includes('superb') ||
    full.includes('camry')
  ) {
    return { factor: 1.28, segmentLabel: 'D-Segment / Full-Size SUV & Executive (1.28x OEM Parts & Labour)' };
  }
  if (
    full.includes('alto') ||
    full.includes('wagon') ||
    full.includes('swift') ||
    full.includes('celerio') ||
    full.includes('tiago') ||
    full.includes('i10') ||
    full.includes('kwid') ||
    full.includes('ignis')
  ) {
    return { factor: 0.85, segmentLabel: 'Compact Hatchback Segment (0.85x Economy OEM Pricing)' };
  }
  return { factor: 1.0, segmentLabel: 'Mid-Size SUV / Sedan Segment (1.0x Standard OEM Pricing)' };
}

function runAiDiagnosis({ make = 'Vehicle', model = '', mileage = 25000, symptoms = '' }) {
  const lower = (symptoms || '').toLowerCase();
  const km = Number(mileage) || 0;
  const { factor, segmentLabel } = getVehicleSegmentMultiplier(make, model);

  // Score every module in our 21-system knowledge base against the user's symptoms
  const matchedModules = [];
  for (const mod of DIAGNOSTIC_KNOWLEDGE_BASE) {
    let matchCount = 0;
    const matchedKeywords = [];
    for (const kw of mod.keywords) {
      if (lower.includes(kw)) {
        matchCount += kw.includes(' ') ? 2 : 1;
        matchedKeywords.push(kw);
      }
    }
    if (matchCount > 0) {
      matchedModules.push({ ...mod, matchScore: matchCount, matchedKeywords });
    }
  }

  // Sort matched modules by relevance score (highest first)
  matchedModules.sort((a, b) => b.matchScore - a.matchScore);

  // If no specific symptom keywords matched, provide a smart mileage-calibrated multi-point diagnosis
  if (matchedModules.length === 0) {
    matchedModules.push({
      ...DIAGNOSTIC_KNOWLEDGE_BASE.find((m) => m.id === 'PERIODIC_OIL_SERVICE'),
      matchScore: 1,
      matchedKeywords: ['scheduled maintenance'],
    });
  }

  // Take up to 4 distinct matched systems so compound symptoms (e.g. Brakes + Oil Change + AC) are ALL diagnosed!
  const activeModules = matchedModules.slice(0, 4);

  // Compute dynamic severity
  const severityRank = { LOW: 1, MEDIUM: 2, HIGH: 3 };
  let highestSeverity = 'LOW';
  for (const m of activeModules) {
    if (severityRank[m.severity] > severityRank[highestSeverity]) {
      highestSeverity = m.severity;
    }
  }

  // Build combined title
  const probableCause =
    activeModules.length === 1
      ? activeModules[0].title
      : `${activeModules.length} Issues Detected: ${activeModules.map((m) => m.title.split('—')[0].split(',')[0].trim()).join(' + ')}`;

  // Calculate accurate itemized costs scaled by vehicle segment + 18% GST
  let totalMin = 0;
  let totalMax = 0;
  let totalLabourHours = 0;
  const recommendedParts = [];
  const itemizedBreakdown = [];
  const actionPlan = [];

  for (const mod of activeModules) {
    const scaledMin = Math.round((mod.baseCostMin * factor) / 50) * 50;
    const scaledMax = Math.round((mod.baseCostMax * factor) / 50) * 50;
    totalMin += scaledMin;
    totalMax += scaledMax;
    totalLabourHours += mod.labourHours;

    const scaledParts = mod.parts.map((pt) => {
      const price = Math.round((pt.estPrice * factor) / 10) * 10;
      const formatted = `${pt.name} (Est. ₹${price.toLocaleString('en-IN')})`;
      if (!recommendedParts.includes(formatted)) {
        recommendedParts.push(formatted);
      }
      return { name: pt.name, estPrice: price };
    });

    itemizedBreakdown.push({
      system: mod.system,
      issueTitle: mod.title,
      severity: mod.severity,
      matchedTriggers: mod.matchedKeywords,
      labourHours: mod.labourHours,
      costRangeMin: scaledMin,
      costRangeMax: scaledMax,
      parts: scaledParts,
    });

    for (const step of mod.repairSteps) {
      if (!actionPlan.includes(step)) {
        actionPlan.push(step);
      }
    }
  }

  // Mileage-based predictive maintenance recommendations
  const mileageRecommendations = [];
  if (km >= 80000) {
    mileageRecommendations.push(
      `80,000+ km High-Mileage Overhaul (${km.toLocaleString('en-IN')} km): Inspect timing chain/belt tensioner, suspension lower-arm bushings, alternator brushes & flush transmission + radiator coolant.`
    );
  }
  if (km >= 60000) {
    mileageRecommendations.push(
      '60,000+ km Major Service: Replace drive belt, transmission/gearbox oil, fuel filter & inspect water pump and brake rotors.'
    );
  }
  if (km >= 40000) {
    mileageRecommendations.push(
      '40,000+ km Interval: Replace Iridium Spark Plugs / Diesel Fuel Filter, flush Engine Coolant & inspect clutch/automatic shift adaptation.'
    );
  }
  if (km >= 20000) {
    mileageRecommendations.push(
      '20,000+ km Interval: Hydraulic DOT-4 brake fluid flush, Activated Carbon AC cabin filter replacement, throttle body cleaning & 3D 4-wheel alignment.'
    );
  }
  mileageRecommendations.push(
    'Every 10,000 km / 1 Year Interval: Full Synthetic 5W-30 Engine Oil + OEM Spin-On Oil Filter + 32-Point Multi-System Safety Inspection.'
  );

  const confidenceScore = Math.min(99, 89 + activeModules.reduce((acc, m) => acc + Math.min(3, m.matchScore), 0));

  return {
    vehicle: `${make} ${model}`.trim(),
    mileage: km,
    vehicleSegment: segmentLabel,
    detectedSystemsCount: activeModules.length,
    probableCause,
    severity: highestSeverity,
    estimatedCostMin: totalMin,
    estimatedCostMax: totalMax,
    estimatedLabourHours: Number(totalLabourHours.toFixed(1)),
    recommendedParts,
    itemizedBreakdown,
    actionPlan,
    mileageRecommendations,
    confidenceScore,
  };
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  const urlObj = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = urlObj.pathname;
  const db = loadDb();

  // --- ROOT / SWAGGER-STYLE API EXPLORER ---
  if ((pathname === '/' || pathname === '/api' || pathname === '/swagger-ui.html') && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Backend API & SQLite Database Explorer — Smart Vehicle Service System</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 p-8 font-sans">
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
      <div>
        <span class="text-xs font-bold uppercase px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">REST API + SQLite Relational DB Online • Port 8080</span>
        <h1 class="text-2xl font-bold text-white mt-2">Smart Vehicle Service — Backend REST API &amp; SQLite Inspector</h1>
        <p class="text-sm text-slate-400 mt-1">Connected to live SQLite relational database (<code>data/smart_vehicle.sqlite</code>) &amp; JSON store.</p>
      </div>
      <a href="http://localhost:5173" class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl">Open React Portal (:5173) →</a>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <a href="/api/users" target="_blank" class="block bg-slate-900 hover:border-blue-500 border border-slate-800 rounded-xl p-4 transition">
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">GET /api/users (SQLite Table)</span>
          <span class="text-xs text-slate-400">${db.users.length} users</span>
        </div>
        <p class="text-xs text-slate-300 mt-2">All registered users in SQLite <code>users</code> table (CUSTOMER, MECHANIC, ADMIN).</p>
      </a>

      <a href="/api/vehicles" target="_blank" class="block bg-slate-900 hover:border-blue-500 border border-slate-800 rounded-xl p-4 transition">
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">GET /api/vehicles</span>
          <span class="text-xs text-slate-400">${db.vehicles.length} records</span>
        </div>
        <p class="text-xs text-slate-300 mt-2">Registered customer vehicles, mileage, VIN, Insurance &amp; PUC expiry dates.</p>
      </a>

      <a href="/api/services" target="_blank" class="block bg-slate-900 hover:border-blue-500 border border-slate-800 rounded-xl p-4 transition">
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">GET /api/services</span>
          <span class="text-xs text-slate-400">${db.serviceRequests.length} records</span>
        </div>
        <p class="text-xs text-slate-300 mt-2">Service bookings, 9-stage lifecycle status, mechanic notes, used parts &amp; labour.</p>
      </a>

      <a href="/api/inventory" target="_blank" class="block bg-slate-900 hover:border-blue-500 border border-slate-800 rounded-xl p-4 transition">
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">GET /api/inventory</span>
          <span class="text-xs text-slate-400">${db.inventoryParts.length} SKUs</span>
        </div>
        <p class="text-xs text-slate-300 mt-2">OEM spare parts inventory, live stock quantities, reorder thresholds &amp; pricing.</p>
      </a>

      <a href="/api/invoices" target="_blank" class="block bg-slate-900 hover:border-blue-500 border border-slate-800 rounded-xl p-4 transition">
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">GET /api/invoices</span>
          <span class="text-xs text-slate-400">${db.invoices.length} invoices</span>
        </div>
        <p class="text-xs text-slate-300 mt-2">Digital GST invoices, parts &amp; labour subtotals, 18% tax &amp; payment status.</p>
      </a>

      <a href="/api/notifications" target="_blank" class="block bg-slate-900 hover:border-blue-500 border border-slate-800 rounded-xl p-4 transition">
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">GET /api/notifications</span>
          <span class="text-xs text-slate-400">${db.notifications.length} alerts</span>
        </div>
        <p class="text-xs text-slate-300 mt-2">Scheduled Insurance/PUC expiry alerts, Low-Stock warnings &amp; SMS/Email logs.</p>
      </a>
    </div>
  </div>
</body>
</html>`);
  }

  // --- AUTH: REGISTER (SQLite Relational DB Insert + Role Validation) ---
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    const body = await parseBody(req);
    const fullName = (body.fullName || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const phone = (body.phone || '').trim();
    const password = String(body.password || '');
    const role = (body.role || '').toUpperCase();
    const specialization = (body.specialization || '').trim();

    if (!fullName || fullName.length < 2) {
      return sendJson(res, 400, { error: 'Please enter your full name (at least 2 characters).' });
    }
    if (!email || !email.includes('@')) {
      return sendJson(res, 400, { error: 'Please enter a valid email address.' });
    }
    if (!phone || phone.length < 7) {
      return sendJson(res, 400, { error: 'Please enter a valid phone number.' });
    }
    if (password.length < 6) {
      return sendJson(res, 400, { error: 'Password must be at least 6 characters long.' });
    }
    if (!['CUSTOMER', 'MECHANIC'].includes(role)) {
      return sendJson(res, 403, { error: 'Registration is restricted to Customer and Mechanic accounts only.' });
    }

    const existing = sqliteDb.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(email);
    if (existing) {
      return sendJson(res, 409, { error: `An account with email "${email}" is already registered. Please log in instead.` });
    }

    const defaultSpec =
      role === 'CUSTOMER'
        ? 'Registered Vehicle Owner'
        : role === 'MECHANIC'
        ? 'Certified Service Technician'
        : 'System Administrator';

    const createdAt = new Date().toISOString();
    const pwHash = hashPassword(password);

    const info = sqliteDb
      .prepare(
        `INSERT INTO users (fullName, email, phone, passwordHash, role, specialization, active, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`
      )
      .run(fullName, email, phone, pwHash, role, specialization || defaultSpec, createdAt);

    const newUser = sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    saveDb(db);

    return sendJson(res, 201, {
      message: `Successfully registered as ${role}!`,
      token: createJwt(newUser),
      user: sanitizeUser(newUser),
    });
  }

  // --- AUTH: LOGIN (Validates Email, Password Hash & Selected Role against SQLite DB) ---
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await parseBody(req);
    const email = (body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const selectedRole = (body.role || '').toUpperCase();

    if (!email || !password) {
      return sendJson(res, 400, { error: 'Please enter both your email address and password.' });
    }
    if (!['CUSTOMER', 'MECHANIC', 'ADMIN'].includes(selectedRole)) {
      return sendJson(res, 400, { error: 'Please select whether you are logging in as Customer, Mechanic, or Admin.' });
    }

    const user = sqliteDb.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(email);
    if (!user) {
      return sendJson(res, 401, {
        error: `No account found for "${email}". Please click "Create New Account" to register first.`,
      });
    }

    const incomingHash = hashPassword(password);
    if (user.passwordHash !== incomingHash) {
      return sendJson(res, 401, {
        error: 'Incorrect password. Please check your credentials.',
      });
    }

    if (user.role !== selectedRole) {
      return sendJson(res, 403, {
        error: `Role Validation Error: "${user.email}" is registered as ${user.role}, not ${selectedRole}. Please select ${user.role} to sign in.`,
      });
    }

    return sendJson(res, 200, {
      message: `Authenticated as ${user.role}`,
      token: createJwt(user),
      user: sanitizeUser(user),
    });
  }

  // --- USERS ---
  if (pathname === '/api/users' && req.method === 'GET') {
    return sendJson(res, 200, db.users.map(sanitizeUser));
  }

  // --- VEHICLES ---
  if (pathname === '/api/vehicles' && req.method === 'GET') {
    const ownerId = urlObj.searchParams.get('ownerId');
    const list = ownerId ? db.vehicles.filter((v) => String(v.ownerId) === String(ownerId)) : db.vehicles;
    return sendJson(res, 200, list);
  }

  if (pathname === '/api/vehicles' && req.method === 'POST') {
    const body = await parseBody(req);
    const customers = db.users.filter((u) => u.role === 'CUSTOMER');
    const owner =
      db.users.find((u) => u.id === Number(body.ownerId)) ||
      customers[customers.length - 1] ||
      db.users[0];
    const resolvedOwnerName =
      body.customOwnerName && String(body.customOwnerName).trim() !== ''
        ? String(body.customOwnerName).trim()
        : owner.fullName;

    const newVehicle = {
      id: Date.now(),
      ownerId: owner.id,
      ownerName: resolvedOwnerName,
      ownerEmail: owner.email,
      registrationNumber: (body.registrationNumber || 'TS-08-AB-1234').toUpperCase(),
      make: body.make || 'Hyundai',
      model: body.model || 'Creta',
      manufacturingYear: Number(body.manufacturingYear) || 2024,
      fuelType: body.fuelType || 'PETROL',
      vin: body.vin || `MA3E${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      currentMileage: Number(body.currentMileage) || 15000,
      lastServiceMileage: Number(body.lastServiceMileage) || 10000,
      lastServiceDate: body.lastServiceDate || '2026-06-15',
      insurancePolicyNo: body.insurancePolicyNo || `POL-${Math.floor(100000 + Math.random() * 900000)}`,
      insuranceExpiry: body.insuranceExpiry || '2026-11-15',
      pucCertificateNo: body.pucCertificateNo || `PUC-${Math.floor(100000 + Math.random() * 900000)}`,
      pucExpiry: body.pucExpiry || '2026-11-02',
      createdAt: new Date().toISOString(),
    };
    db.vehicles.unshift(newVehicle);

    db.notifications.unshift({
      id: Date.now() + 1,
      recipientUserId: owner.id,
      channel: 'SYSTEM',
      alertType: 'SERVICE_STATUS',
      title: `Vehicle Registered: ${newVehicle.registrationNumber}`,
      message: `${newVehicle.make} ${newVehicle.model} (${newVehicle.registrationNumber}) registered for ${resolvedOwnerName}. Compliance tracking active.`,
      isRead: false,
      sentAt: new Date().toISOString(),
    });

    saveDb(db);
    return sendJson(res, 201, newVehicle);
  }

  // Update vehicle Insurance & PUC compliance / schedule renewal
  const vehicleCompMatch = pathname.match(/^\/api\/vehicles\/(\d+)\/compliance$/);
  if (vehicleCompMatch && (req.method === 'PATCH' || req.method === 'POST')) {
    const vid = Number(vehicleCompMatch[1]);
    const body = await parseBody(req);
    const vehicle = db.vehicles.find((v) => v.id === vid);
    if (!vehicle) return sendJson(res, 404, { error: 'Vehicle not found' });

    if (body.insurancePolicyNo !== undefined) vehicle.insurancePolicyNo = body.insurancePolicyNo;
    if (body.insuranceExpiry !== undefined && body.insuranceExpiry !== '') {
      vehicle.insuranceExpiry = body.insuranceExpiry;
    } else if (body.insuranceValidUntil !== undefined && body.insuranceValidUntil !== '') {
      vehicle.insuranceExpiry = body.insuranceValidUntil;
    }

    if (body.pucCertificateNo !== undefined) vehicle.pucCertificateNo = body.pucCertificateNo;
    if (body.pucExpiry !== undefined && body.pucExpiry !== '') {
      vehicle.pucExpiry = body.pucExpiry;
    } else if (body.pucValidUntil !== undefined && body.pucValidUntil !== '') {
      vehicle.pucExpiry = body.pucValidUntil;
    }

    if (body.insuranceRenewalScheduledDate !== undefined) {
      vehicle.insuranceRenewalScheduledDate = body.insuranceRenewalScheduledDate;
      if (body.insuranceRenewalScheduledDate) vehicle.insuranceRenewalScheduled = true;
    }
    if (body.pucRenewalScheduledDate !== undefined) {
      vehicle.pucRenewalScheduledDate = body.pucRenewalScheduledDate;
      if (body.pucRenewalScheduledDate) vehicle.pucRenewalScheduled = true;
    }

    if (body.insuranceRenewalScheduled !== undefined) {
      vehicle.insuranceRenewalScheduled = Boolean(body.insuranceRenewalScheduled);
    }
    if (body.pucRenewalScheduled !== undefined) {
      vehicle.pucRenewalScheduled = Boolean(body.pucRenewalScheduled);
    }

    db.notifications.unshift({
      id: Date.now(),
      recipientUserId: vehicle.ownerId,
      channel: 'SYSTEM',
      alertType: 'SERVICE_STATUS',
      title: `Compliance Updated (${vehicle.registrationNumber})`,
      message: `Insurance (${vehicle.insuranceExpiry}) & PUC (${vehicle.pucExpiry}) compliance records updated for ${vehicle.make} ${vehicle.model}.`,
      isRead: false,
      sentAt: new Date().toISOString(),
    });

    saveDb(db);
    return sendJson(res, 200, vehicle);
  }

  // --- SERVICES (BOOKINGS & 9-STAGE LIFECYCLE) ---
  if (pathname === '/api/services' && req.method === 'GET') {
    const customerId = urlObj.searchParams.get('customerId');
    const mechanicId = urlObj.searchParams.get('mechanicId');
    let list = db.serviceRequests;
    if (customerId) list = list.filter((s) => String(s.customerId) === String(customerId));
    if (mechanicId) list = list.filter((s) => String(s.mechanicId) === String(mechanicId));
    return sendJson(res, 200, list);
  }

  if (pathname === '/api/services' && req.method === 'POST') {
    const body = await parseBody(req);
    const requestedCustomer = db.users.find((u) => u.id === Number(body.customerId));
    const vehicle =
      db.vehicles.find((v) => v.id === Number(body.vehicleId)) ||
      (requestedCustomer ? db.vehicles.find((v) => v.ownerId === requestedCustomer.id) : null) ||
      db.vehicles[0];

    if (!vehicle) {
      return sendJson(res, 400, { error: 'Please register a vehicle first before booking a service appointment.' });
    }

    const customer =
      db.users.find((u) => u.id === Number(vehicle.ownerId)) ||
      requestedCustomer ||
      db.users[0];

    // Equal Load-Balanced Mechanic Assignment OR Optional Preferred Mechanic Selection
    const allMechanics = db.users.filter((u) => u.role === 'MECHANIC');
    let mechanic = null;
    let assignmentType = 'AUTO_BALANCED';

    if (body.mechanicId && body.mechanicId !== 'AUTO' && Number(body.mechanicId) > 0) {
      mechanic = allMechanics.find((m) => Number(m.id) === Number(body.mechanicId)) || null;
      if (mechanic) assignmentType = 'PREFERRED';
    }

    if (!mechanic) {
      if (allMechanics.length > 0) {
        const sortedByWorkload = [...allMechanics].sort((m1, m2) => {
          const active1 = db.serviceRequests.filter(
            (s) => Number(s.mechanicId) === Number(m1.id) && s.lifecycleStage !== 'DELIVERY'
          ).length;
          const active2 = db.serviceRequests.filter(
            (s) => Number(s.mechanicId) === Number(m2.id) && s.lifecycleStage !== 'DELIVERY'
          ).length;
          if (active1 !== active2) return active1 - active2;

          const total1 = db.serviceRequests.filter((s) => Number(s.mechanicId) === Number(m1.id)).length;
          const total2 = db.serviceRequests.filter((s) => Number(s.mechanicId) === Number(m2.id)).length;
          return total1 - total2;
        });
        mechanic = sortedByWorkload[0];
      } else {
        mechanic = { id: 2, fullName: 'Vikram Patel' };
      }
    }

    const aiDiag = runAiDiagnosis({
      make: vehicle.make,
      model: vehicle.model,
      mileage: vehicle.currentMileage,
      symptoms: body.customerSymptoms || body.serviceType,
    });

    const newSr = {
      id: Date.now(),
      bookingCode: `SRV-${Math.floor(1000 + Math.random() * 9000)}`,
      vehicleId: vehicle.id,
      vehicleReg: vehicle.registrationNumber,
      vehicleName: `${vehicle.make} ${vehicle.model}`,
      customerId: customer.id,
      customerName: vehicle.ownerName || customer.fullName,
      customerEmail: vehicle.ownerEmail || customer.email,
      mechanicId: mechanic.id,
      mechanicName: mechanic.fullName,
      mechanicAssignmentType: assignmentType,
      serviceType: body.serviceType || 'Comprehensive Periodic Service',
      customerSymptoms: body.customerSymptoms || 'Routine scheduled maintenance and multi-point checkup.',
      aiDiagnosisSummary: `${aiDiag.probableCause} (AI Est. ₹${aiDiag.estimatedCostMin} - ₹${aiDiag.estimatedCostMax})`,
      preferredDate: body.preferredDate || '2026-10-23',
      timeSlot: body.timeSlot || '10:00 AM - 12:00 PM',
      lifecycleStage: 'BOOKING',
      quotationApproved: false,
      inspectionNotes: 'Awaiting vehicle reception and technician multi-point inspection.',
      serviceReport: '',
      estimatedCost: aiDiag.estimatedCostMin,
      labourHours: aiDiag.estimatedLabourHours || 1.5,
      labourRate: 450,
      usedParts: [],
      repairTasks: (aiDiag.actionPlan || []).map((step, idx) => ({
        id: idx + 1,
        title: step,
        completed: false,
      })),
      qcChecklist: [
        { id: 1, label: 'Engine / Motor fluid levels & zero-leak verification', passed: false },
        { id: 2, label: 'Braking performance & pedal pressure road test', passed: false },
        { id: 3, label: 'Wheel lug nut torque & tire pressure check', passed: false },
        { id: 4, label: 'Electrical systems, battery voltage & OBD-II fault code clear', passed: false },
        { id: 5, label: 'Exterior wash, interior vacuum & final safety sign-off', passed: false },
      ],
      paymentRequested: false,
      deliveryReady: false,
      deliveryNote: '',
      customerRating: null,
      customerFeedback: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.serviceRequests.unshift(newSr);
    syncInvoiceForService(db, newSr);

    db.notifications.unshift({
      id: Date.now() + 2,
      recipientUserId: customer.id,
      channel: 'EMAIL',
      alertType: 'SERVICE_STATUS',
      title: `Booking Confirmed (${newSr.bookingCode})`,
      message: `${customer.fullName} booked ${newSr.serviceType} for ${newSr.vehicleName} (${newSr.vehicleReg}) on ${newSr.preferredDate} (${newSr.timeSlot}). Assigned Mechanic: ${newSr.mechanicName}.`,
      isRead: false,
      sentAt: new Date().toISOString(),
    });
    saveDb(db);
    return sendJson(res, 201, newSr);
  }

  // Update lifecycle stage, notes, mechanic assignment, approval, feedback
  const stageMatch = pathname.match(/^\/api\/services\/(\d+)\/stage$/);
  if (stageMatch && (req.method === 'PATCH' || req.method === 'POST')) {
    const id = Number(stageMatch[1]);
    const body = await parseBody(req);
    const sr = db.serviceRequests.find((s) => s.id === id);
    if (!sr) return sendJson(res, 404, { error: 'Service request not found' });

    if (body.lifecycleStage) sr.lifecycleStage = body.lifecycleStage;
    if (body.inspectionNotes !== undefined) sr.inspectionNotes = body.inspectionNotes;
    if (body.serviceReport !== undefined) sr.serviceReport = body.serviceReport;
    if (body.quotationApproved !== undefined) {
      sr.quotationApproved = Boolean(body.quotationApproved);
      if (sr.quotationApproved && sr.lifecycleStage === 'QUOTATION') {
        sr.lifecycleStage = 'APPROVAL';
      }
    }
    if (body.labourHours !== undefined) sr.labourHours = Number(body.labourHours);
    if (body.labourRate !== undefined) sr.labourRate = Number(body.labourRate);
    if (body.customLabourCost !== undefined) sr.customLabourCost = body.customLabourCost === '' ? null : Number(body.customLabourCost);
    if (body.includeGst !== undefined) sr.includeGst = Boolean(body.includeGst);
    if (body.manualEstimateTotal !== undefined) {
      sr.manualEstimateTotal = body.manualEstimateTotal === '' || body.manualEstimateTotal === null ? null : Number(body.manualEstimateTotal);
    }
    if (Array.isArray(body.usedParts)) {
      sr.usedParts = body.usedParts;
    }
    if (Array.isArray(body.repairTasks)) {
      sr.repairTasks = body.repairTasks;
    }
    if (Array.isArray(body.qcChecklist)) {
      sr.qcChecklist = body.qcChecklist;
    }
    if (body.paymentRequested !== undefined) {
      sr.paymentRequested = Boolean(body.paymentRequested);
    }
    if (body.deliveryReady !== undefined) {
      sr.deliveryReady = Boolean(body.deliveryReady);
    }
    if (body.deliveryNote !== undefined) {
      sr.deliveryNote = body.deliveryNote;
    }
    if (body.mechanicId !== undefined) {
      const m = db.users.find((u) => u.id === Number(body.mechanicId));
      if (m) {
        sr.mechanicId = m.id;
        sr.mechanicName = m.fullName;
      }
    }
    if (body.customerRating !== undefined) sr.customerRating = Number(body.customerRating);
    if (body.customerFeedback !== undefined) sr.customerFeedback = body.customerFeedback;

    sr.updatedAt = new Date().toISOString();
    syncInvoiceForService(db, sr);

    db.notifications.unshift({
      id: Date.now(),
      recipientUserId: sr.customerId,
      channel: 'PUSH',
      alertType: 'SERVICE_STATUS',
      title: `Service Update (${sr.bookingCode}): ${sr.lifecycleStage.replace('_', ' ')}`,
      message: `${sr.vehicleName} (${sr.vehicleReg}) is now at stage: ${sr.lifecycleStage.replace('_', ' ')}.`,
      isRead: false,
      sentAt: new Date().toISOString(),
    });

    saveDb(db);
    return sendJson(res, 200, sr);
  }

  // Add part (either from Inventory OR Custom Part & Price entered by Mechanic)
  const partsMatch = pathname.match(/^\/api\/services\/(\d+)\/parts$/);
  if (partsMatch && req.method === 'POST') {
    const id = Number(partsMatch[1]);
    const body = await parseBody(req);
    const sr = db.serviceRequests.find((s) => s.id === id);
    if (!sr) return sendJson(res, 404, { error: 'Service request not found' });

    sr.usedParts = sr.usedParts || [];
    const qty = Math.max(1, Number(body.quantity) || 1);

    // Case 1: Custom part & price entered directly by Mechanic
    if (body.customPartName && String(body.customPartName).trim() !== '') {
      const customName = String(body.customPartName).trim();
      const customPrice = Math.max(0, Number(body.unitPrice) || 0);
      const customSku = body.sku ? String(body.sku).toUpperCase() : `CUSTOM-${Math.floor(100 + Math.random() * 900)}`;

      sr.usedParts.push({
        partId: Date.now(),
        sku: customSku,
        partName: customName,
        quantity: qty,
        unitPrice: customPrice,
        isCustom: true,
      });
    } else {
      // Case 2: Selected from Inventory list (with optional price override by Mechanic)
      const part = db.inventoryParts.find((p) => p.id === Number(body.partId));
      if (!part) return sendJson(res, 404, { error: 'Inventory part not found' });

      const unitPrice =
        body.unitPrice !== undefined && body.unitPrice !== '' && !isNaN(Number(body.unitPrice))
          ? Number(body.unitPrice)
          : Number(part.unitPrice);

      const existing = sr.usedParts.find((up) => up.partId === part.id && up.unitPrice === unitPrice);
      if (existing) {
        existing.quantity += qty;
      } else {
        sr.usedParts.push({
          partId: part.id,
          sku: part.sku,
          partName: part.partName,
          quantity: qty,
          unitPrice,
          isCustom: false,
        });
      }

      part.stockQuantity = Math.max(0, part.stockQuantity - qty);
      if (part.stockQuantity <= part.reorderLevel) {
        db.notifications.unshift({
          id: Date.now(),
          recipientUserId: 4,
          channel: 'SYSTEM',
          alertType: 'LOW_STOCK',
          title: `Low Stock Alert: ${part.partName}`,
          message: `Inventory for ${part.sku} dropped to ${part.stockQuantity} units (Reorder threshold: ${part.reorderLevel}).`,
          isRead: false,
          sentAt: new Date().toISOString(),
        });
      }
    }

    // Clear manual override when parts are added so the sum updates automatically
    sr.manualEstimateTotal = null;
    sr.updatedAt = new Date().toISOString();
    syncInvoiceForService(db, sr);
    saveDb(db);
    return sendJson(res, 200, sr);
  }

  // --- INVENTORY ---
  if (pathname === '/api/inventory' && req.method === 'GET') {
    return sendJson(res, 200, db.inventoryParts);
  }

  if (pathname === '/api/inventory' && req.method === 'POST') {
    const body = await parseBody(req);
    if (body.id) {
      const existing = db.inventoryParts.find((p) => p.id === Number(body.id));
      if (existing) {
        Object.assign(existing, body, {
          stockQuantity: Number(body.stockQuantity),
          unitPrice: Number(body.unitPrice),
          reorderLevel: Number(body.reorderLevel || existing.reorderLevel),
        });
        saveDb(db);
        return sendJson(res, 200, existing);
      }
    }
    const newPart = {
      id: Date.now(),
      sku: (body.sku || `SKU-${Math.floor(100 + Math.random() * 900)}`).toUpperCase(),
      partName: body.partName || 'OEM Replacement Part',
      category: body.category || 'General Spares',
      stockQuantity: Number(body.stockQuantity) || 15,
      reorderLevel: Number(body.reorderLevel) || 5,
      unitPrice: Number(body.unitPrice) || 950,
      supplier: body.supplier || 'OEM Auto Supply',
    };
    db.inventoryParts.unshift(newPart);
    saveDb(db);
    return sendJson(res, 201, newPart);
  }

  // --- INVOICES & PAYMENT ---
  if (pathname === '/api/invoices' && req.method === 'GET') {
    return sendJson(res, 200, db.invoices);
  }

  const payMatch = pathname.match(/^\/api\/invoices\/(\d+)\/pay$/);
  if (payMatch && req.method === 'POST') {
    const id = Number(payMatch[1]);
    const body = await parseBody(req);
    const inv = db.invoices.find((i) => i.id === id);
    if (!inv) return sendJson(res, 404, { error: 'Invoice not found' });

    inv.paymentStatus = 'PAID';
    inv.paymentMethod = body.paymentMethod || 'UPI / Instant Pay';
    inv.paidAt = new Date().toISOString();

    const sr = db.serviceRequests.find((s) => s.id === inv.serviceRequestId);
    if (sr) {
      sr.lifecycleStage = 'DELIVERY';
      sr.updatedAt = new Date().toISOString();
    }

    db.notifications.unshift({
      id: Date.now(),
      recipientUserId: inv.customerId || 1,
      channel: 'EMAIL',
      alertType: 'SERVICE_STATUS',
      title: `Payment Received (${inv.invoiceNumber})`,
      message: `Digital Invoice ${inv.invoiceNumber} of ₹${inv.grandTotal.toLocaleString('en-IN')} paid via ${inv.paymentMethod}. Vehicle ready for delivery!`,
      isRead: false,
      sentAt: new Date().toISOString(),
    });

    saveDb(db);
    return sendJson(res, 200, inv);
  }

  // --- AI INTELLIGENCE LAYER ---
  if (pathname === '/api/ai/analyze' && req.method === 'POST') {
    const body = await parseBody(req);
    return sendJson(res, 200, runAiDiagnosis(body));
  }

  // --- NOTIFICATIONS & SCHEDULER ---
  if (pathname === '/api/notifications' && req.method === 'GET') {
    return sendJson(res, 200, db.notifications);
  }

  if (pathname === '/api/notifications/scan' && req.method === 'POST') {
    const today = new Date('2026-10-21');
    let generated = 0;

    db.vehicles.forEach((v) => {
      const insDays = Math.ceil((new Date(v.insuranceExpiry) - today) / (1000 * 60 * 60 * 24));
      const pucDays = Math.ceil((new Date(v.pucExpiry) - today) / (1000 * 60 * 60 * 24));

      if (insDays <= 30) {
        db.notifications.unshift({
          id: Date.now() + Math.floor(Math.random() * 1000),
          recipientUserId: v.ownerId,
          channel: 'EMAIL',
          alertType: 'INSURANCE_EXPIRY',
          title: `[Scheduler] Insurance Expiring in ${insDays} Days (${v.registrationNumber})`,
          message: `Automated scan detected policy ${v.insurancePolicyNo} for ${v.make} ${v.model} expires on ${v.insuranceExpiry}.`,
          isRead: false,
          sentAt: new Date().toISOString(),
        });
        generated++;
      }
      if (pucDays <= 15) {
        db.notifications.unshift({
          id: Date.now() + Math.floor(Math.random() * 1000) + 1,
          recipientUserId: v.ownerId,
          channel: 'SMS',
          alertType: 'PUC_EXPIRY',
          title: `[Scheduler] PUC Expiring in ${pucDays} Days (${v.registrationNumber})`,
          message: `Automated scan detected PUC ${v.pucCertificateNo} for ${v.registrationNumber} expires on ${v.pucExpiry}.`,
          isRead: false,
          sentAt: new Date().toISOString(),
        });
        generated++;
      }
    });

    db.inventoryParts.forEach((p) => {
      if (p.stockQuantity <= p.reorderLevel) {
        db.notifications.unshift({
          id: Date.now() + Math.floor(Math.random() * 1000) + 2,
          recipientUserId: 4,
          channel: 'SYSTEM',
          alertType: 'LOW_STOCK',
          title: `[Scheduler] Low Stock: ${p.partName} (${p.stockQuantity} left)`,
          message: `SKU ${p.sku} is below reorder level (${p.reorderLevel}). Supplier: ${p.supplier}.`,
          isRead: false,
          sentAt: new Date().toISOString(),
        });
        generated++;
      }
    });

    saveDb(db);
    return sendJson(res, 200, { alertsGenerated: generated, notifications: db.notifications });
  }

  return sendJson(res, 404, { error: 'Endpoint not found', path: pathname });
});

server.listen(PORT, () => {
  console.log(`Smart Vehicle Service REST API + SQLite Server running on http://localhost:${PORT}`);
});
