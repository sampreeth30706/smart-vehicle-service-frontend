// Cloud / GitHub Pages Serverless API Adapter
// Automatically activates when deployed on static cloud hosts (e.g. GitHub Pages / Vercel / Netlify)
// while passing through to the local port 8080 SQLite server when running on localhost.

import initialDbSeed from '../data/smart_vehicle_db.json';

const STORAGE_KEY = 'SMART_VEHICLE_CLOUD_DB_V2';

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
    id: 'CLUTCH_ASSEMBLY_WEAR',
    system: 'Clutch & Manual Transmission Coupling',
    title: 'Worn Clutch Friction Disc, Pressure Plate & Release Bearing',
    severity: 'HIGH',
    keywords: ['clutch', 'slipping', 'clutch hard', 'hard clutch', 'high biting', 'clutch pedal', 'flywheel', 'judder', 'burning smell uphill'],
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
    keywords: ['gear', 'gearbox', 'transmission', 'shifting', 'hard shift', 'grinding gear', 'cvt', 'automatic', 'dct', 'axle', 'cv joint', 'clicking when turning'],
    baseCostMin: 4200,
    baseCostMax: 9800,
    labourHours: 3.0,
    parts: [
      { name: 'Synthetic ATF / CVT / 75W-90 Transmission Fluid (4L)', estPrice: 3200 },
      { name: 'Outer CV Joint Boot & Moly Grease Kit / Shift Cable Bush', estPrice: 1850 },
    ],
    repairSteps: [
      'Inspect transmission fluid level, color & metallic debris; scan TCU for shift solenoid faults',
      'Lubricate/adjust gear shifter selector cables or perform automatic transmission clutch adaptive learning',
      'Inspect front drive axle constant-velocity (CV) joints and rubber boots for grease tears',
    ],
  },
  {
    id: 'AC_CLIMATE_CONTROL',
    system: 'HVAC & Cabin Air Conditioning',
    title: 'Low R134a Refrigerant Charge, Clogged Cabin Filter or AC Compressor Clutch',
    severity: 'MEDIUM',
    keywords: ['ac', 'a/c', 'air condition', 'cooling', 'not cooling', 'warm air', 'compressor', 'refrigerant', 'ac gas', 'blower', 'musty', 'smell', 'cabin filter'],
    baseCostMin: 2100,
    baseCostMax: 5400,
    labourHours: 1.5,
    parts: [
      { name: 'Activated Carbon Cabin AC Microfilter', estPrice: 780 },
      { name: 'Dupont Suva R134a Refrigerant Gas & PAG Compressor Oil', estPrice: 1650 },
    ],
    repairSteps: [
      'Connect manifold gauges to measure low-side (28–38 PSI) and high-side (180–220 PSI) AC pressures',
      'Perform vacuum leak test, recharge R134a refrigerant with UV PAG oil & verify compressor clutch engagement',
      'Replace activated carbon cabin AC filter & antibacterial-sanitize evaporator coils',
    ],
  },
  {
    id: 'BATTERY_STARTER_CRANK',
    system: '12V Starting & Battery System',
    title: 'Degraded 12V AGM Battery Cells or Starter Motor Solenoid Wear',
    severity: 'HIGH',
    keywords: ['battery', 'crank', 'cranking', 'slow start', 'wont start', 'no start', 'dead battery', 'jump start', 'starter', 'morning start'],
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
      'Clean sulfated battery terminals & install replacement 12V AGM battery',
    ],
  },
  {
    id: 'ALTERNATOR_CHARGING',
    system: 'Alternator & Electrical Charging',
    title: 'Alternator Voltage Regulator / Rectifier Diode Failure',
    severity: 'HIGH',
    keywords: ['alternator', 'battery light', 'battery warning', 'charging', 'voltage drop', 'dimming'],
    baseCostMin: 3600,
    baseCostMax: 8400,
    labourHours: 2.0,
    parts: [
      { name: 'Bosch Alternator Voltage Regulator & Brush Assembly', estPrice: 2650 },
      { name: 'EPDM 6PK Serpentine Alternator Drive Belt', estPrice: 1150 },
    ],
    repairSteps: [
      'Measure alternator charging voltage across battery terminals at 2,000 RPM (target 13.9V–14.4V)',
      'Test alternator rectifier diode ripple and inspect carbon slip-ring brushes',
      'Service/replace alternator regulator assembly and adjust serpentine drive belt tension',
    ],
  },
  {
    id: 'SUSPENSION_SHOCKS_BUSHINGS',
    system: 'Suspension, Struts & Chassis',
    title: 'Worn MacPherson Strut Mounts, Lower Control Arm Bushings & Link Rods',
    severity: 'MEDIUM',
    keywords: ['suspension', 'shock', 'strut', 'clunk', 'clunking', 'thud', 'pothole', 'bumpy', 'bouncy', 'lower arm', 'control arm', 'bushing', 'ball joint', 'link rod'],
    baseCostMin: 3800,
    baseCostMax: 8900,
    labourHours: 2.5,
    parts: [
      { name: 'Front Stabilizer Bar Link Rod Set (LH + RH)', estPrice: 1850 },
      { name: 'Lower Control Arm Hydro-Bushing & Ball Joint Kit', estPrice: 2950 },
    ],
    repairSteps: [
      'Raise vehicle on 2-post lift and inspect front/rear shock absorbers for hydraulic oil seepage',
      'Check play in lower control arm rubber bushings, ball joints, tie-rod ends & stabilizer link rods',
      'Replace worn suspension link rods/bushings & road test over uneven terrain',
    ],
  },
  {
    id: 'WHEEL_ALIGNMENT_BALANCING',
    system: 'Steering Geometry & Wheel Balance',
    title: 'Wheel Alignment Toe/Camber Drift & Dynamic Wheel Imbalance',
    severity: 'MEDIUM',
    keywords: ['alignment', 'balancing', 'vibration', 'vibrating', 'steering shake', 'wobble', 'pull', 'pulling', 'left', 'right', 'highway', '60', '70', '80'],
    baseCostMin: 1600,
    baseCostMax: 3400,
    labourHours: 1.0,
    parts: [
      { name: 'Adhesive Alloy Wheel Balancing Counterweights (Set)', estPrice: 450 },
      { name: 'Tie-Rod Lock Nut & Camber Shim Adjustment Kit', estPrice: 550 },
    ],
    repairSteps: [
      'Perform 3D computerized 4-wheel laser alignment (adjust front/rear Toe, Camber & Caster)',
      'Mount all 4 wheels on high-speed dynamic balancer and apply precision counterweights',
      'Rotate tires front-to-rear & verify straight-line highway tracking',
    ],
  },
  {
    id: 'POWER_STEERING_RACK',
    system: 'Power Steering (EPS / Rack & Pinion)',
    title: 'Electric Power Steering (EPS) Torque Sensor or Steering Rack Play',
    severity: 'HIGH',
    keywords: ['steering hard', 'heavy steering', 'stiff', 'eps', 'steering rack', 'tie rod', 'whining'],
    baseCostMin: 3500,
    baseCostMax: 8600,
    labourHours: 2.5,
    parts: [
      { name: 'OEM Outer Tie-Rod End & Rack Boot Bellows Pair', estPrice: 2450 },
      { name: 'Steering Column Intermediate Shaft U-Joint / Bush', estPrice: 1950 },
    ],
    repairSteps: [
      'Scan EPS control module for torque sensor or assist motor current fault codes',
      'Inspect rack-and-pinion inner/outer tie-rod ends and rubber dust boots',
      'Replace worn tie-rod ends and perform zero-point steering angle sensor calibration',
    ],
  },
  {
    id: 'ENGINE_OIL_LEAK',
    system: 'Engine Seals & Gaskets',
    title: 'Engine Valve Cover Gasket / Oil Sump Seal Leak',
    severity: 'HIGH',
    keywords: ['oil leak', 'leaking oil', 'dripping', 'oil spot', 'burning oil', 'valve cover', 'sump', 'gasket', 'blue smoke'],
    baseCostMin: 3200,
    baseCostMax: 6800,
    labourHours: 2.5,
    parts: [
      { name: 'OEM Viton Valve Cover Gasket & Grommet Kit', estPrice: 1650 },
      { name: 'Castrol EDGE 5W-30 Synthetic Oil Top-Up (1L)', estPrice: 750 },
    ],
    repairSteps: [
      'Degrease engine block and perform UV dye inspection to pinpoint exact oil leak source',
      'Replace hardened valve cover gasket / oil pan seal and torque bolts in sequence',
      'Inspect PCV valve for blockage causing excess crankcase pressure',
    ],
  },
  {
    id: 'FUEL_INJECTOR_THROTTLE',
    system: 'Fuel Injection & Air Intake',
    title: 'Clogged Fuel Injectors, Carbonized Throttle Body & Low Fuel Economy',
    severity: 'MEDIUM',
    keywords: ['mileage', 'low mileage', 'poor pickup', 'sluggish', 'black smoke', 'throttle', 'injector', 'fuel'],
    baseCostMin: 2600,
    baseCostMax: 5900,
    labourHours: 2.0,
    parts: [
      { name: 'Ultrasonic Fuel Injector O-Ring & Microfilter Kit', estPrice: 1150 },
      { name: 'Electronic Throttle Body Cleaner & Intake Gasket', estPrice: 780 },
    ],
    repairSteps: [
      'Remove electronic throttle body, clean carbon deposits & perform ECU idle relearn',
      'Ultrasonically clean & flow-test fuel injectors on test bench',
      'Check fuel rail pressure & clean MAF/MAP intake sensor',
    ],
  },
  {
    id: 'EXHAUST_CATALYTIC_EMISSION',
    system: 'Exhaust, Catalytic Converter & Emissions',
    title: 'Oxygen (O2) Sensor Fouling, Catalytic Converter Efficiency or Exhaust Leak',
    severity: 'MEDIUM',
    keywords: ['exhaust', 'muffler', 'silencer', 'roar', 'catalytic', 'dpf', 'emission', 'puc', 'o2 sensor'],
    baseCostMin: 3200,
    baseCostMax: 7800,
    labourHours: 2.0,
    parts: [
      { name: 'Bosch Upstream Wideband Oxygen (O2 / Lambda) Sensor', estPrice: 3100 },
      { name: 'Multi-Layer Stainless Exhaust Flange Gasket & Clamp', estPrice: 680 },
    ],
    repairSteps: [
      'Analyze upstream & downstream O2 sensor voltage waveform via OBD-II',
      'Inspect exhaust manifold gasket, flex pipe, catalytic converter & rear muffler for leaks',
      'Perform catalytic/DPF decarbonization or replace faulty O2 sensor & verify PUC emission levels',
    ],
  },
  {
    id: 'TURBO_EGR_DIESEL',
    system: 'Turbocharger, Boost & EGR System',
    title: 'Clogged EGR Valve, Intercooler Boost Hose Leak or Turbo Actuator Fault',
    severity: 'HIGH',
    keywords: ['turbo', 'whistle', 'boost', 'intercooler', 'egr', 'limp mode'],
    baseCostMin: 4200,
    baseCostMax: 9500,
    labourHours: 3.0,
    parts: [
      { name: 'Silicone Reinforced Turbo Intercooler Boost Hose', estPrice: 2150 },
      { name: 'EGR Valve Gasket & Solvent Kit', estPrice: 1350 },
    ],
    repairSteps: [
      'Smoke-test turbocharger intercooler piping and hose clamps for boost pressure leaks',
      'Dismantle and decarbonize soot-clogged EGR valve & intake manifold',
      'Test turbo VGT actuator travel and verify boost pressure curve',
    ],
  },
  {
    id: 'TIMING_SERPENTINE_BELT',
    system: 'Engine Timing & Accessory Drive',
    title: 'Serpentine Drive Belt Squeal / Tensioner Bearing or Timing Chain Rattle',
    severity: 'HIGH',
    keywords: ['belt', 'timing', 'chain', 'rattle', 'squealing', 'pulley', 'tensioner'],
    baseCostMin: 2900,
    baseCostMax: 7600,
    labourHours: 2.5,
    parts: [
      { name: 'Gates Micro-V EPDM Serpentine Drive Belt', estPrice: 1250 },
      { name: 'Automatic Belt Tensioner & Idler Pulley Bearing', estPrice: 2350 },
    ],
    repairSteps: [
      'Inspect accessory serpentine belt ribs for cracking, glazing, or fraying',
      'Check automatic belt tensioner pulley, idler bearing & timing chain tensioner',
      'Replace worn drive belt and tensioner pulley & verify quiet cold-start operation',
    ],
  },
  {
    id: 'LIGHTING_WIPERS_ELECTRICAL',
    system: 'Body Electricals, Lighting & Visibility',
    title: 'Headlight / Relay Circuit, Wiper Blade Set or Power Window Actuator Service',
    severity: 'LOW',
    keywords: ['wiper', 'windshield', 'washer', 'headlight', 'bulb', 'dim', 'fog', 'window', 'horn', 'fuse'],
    baseCostMin: 1400,
    baseCostMax: 3800,
    labourHours: 1.0,
    parts: [
      { name: 'Bosch Aerotwin Frameless Silicone Wiper Blade Pair', estPrice: 1150 },
      { name: 'Osram Night Breaker Headlamp Bulb & Relay', estPrice: 1450 },
    ],
    repairSteps: [
      'Test body control module (BCM) fuse box, relays & wiring harness with digital multimeter',
      'Replace worn silicone windshield wiper blades & align headlamp beam pattern',
      'Lubricate power window glass run channels',
    ],
  },
];

function getCloudDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.users)) {
        parsed.users.forEach((u) => {
          if (u.role === 'ADMIN') u.fullName = 'Admin Console';
        });
      }
      return parsed;
    }
  } catch (e) {
    console.warn(e);
  }
  const copy = JSON.parse(JSON.stringify(initialDbSeed));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
  return copy;
}

function saveCloudDb(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn(e);
  }
}

function runCloudAiDiagnosis({ make = 'Vehicle', model = '', mileage = 25000, symptoms = '' }) {
  const lower = (symptoms || '').toLowerCase();
  const km = Number(mileage) || 0;
  const full = `${make} ${model}`.toLowerCase();
  let factor = 1.0;
  let segmentLabel = 'Mid-Size SUV / Sedan Segment (1.0x Standard OEM Pricing)';
  if (full.includes('bmw') || full.includes('mercedes') || full.includes('audi')) {
    factor = 2.15;
    segmentLabel = 'Luxury / Premium European Segment (2.15x OEM Parts & Labour)';
  } else if (full.includes('fortuner') || full.includes('innova') || full.includes('xuv700')) {
    factor = 1.28;
    segmentLabel = 'D-Segment / Full-Size SUV (1.28x OEM Parts & Labour)';
  } else if (full.includes('alto') || full.includes('swift') || full.includes('i10') || full.includes('wagon')) {
    factor = 0.85;
    segmentLabel = 'Compact Hatchback Segment (0.85x Economy OEM Pricing)';
  }

  const matched = [];
  for (const mod of DIAGNOSTIC_KNOWLEDGE_BASE) {
    let score = 0;
    const kws = [];
    for (const kw of mod.keywords) {
      if (lower.includes(kw)) {
        score += kw.includes(' ') ? 2 : 1;
        kws.push(kw);
      }
    }
    if (score > 0) matched.push({ ...mod, matchScore: score, matchedKeywords: kws });
  }
  matched.sort((a, b) => b.matchScore - a.matchScore);
  if (matched.length === 0) {
    matched.push({ ...DIAGNOSTIC_KNOWLEDGE_BASE[1], matchScore: 1, matchedKeywords: ['scheduled service'] });
  }

  const active = matched.slice(0, 4);
  const rank = { LOW: 1, MEDIUM: 2, HIGH: 3 };
  let sev = 'LOW';
  for (const m of active) {
    if (rank[m.severity] > rank[sev]) sev = m.severity;
  }

  let totalMin = 0;
  let totalMax = 0;
  let totalHrs = 0;
  const recommendedParts = [];
  const itemizedBreakdown = [];
  const actionPlan = [];

  for (const mod of active) {
    const sMin = Math.round((mod.baseCostMin * factor) / 50) * 50;
    const sMax = Math.round((mod.baseCostMax * factor) / 50) * 50;
    totalMin += sMin;
    totalMax += sMax;
    totalHrs += mod.labourHours;

    const scaledParts = mod.parts.map((pt) => {
      const price = Math.round((pt.estPrice * factor) / 10) * 10;
      const str = `${pt.name} (Est. ₹${price.toLocaleString('en-IN')})`;
      if (!recommendedParts.includes(str)) recommendedParts.push(str);
      return { name: pt.name, estPrice: price };
    });

    itemizedBreakdown.push({
      system: mod.system,
      issueTitle: mod.title,
      severity: mod.severity,
      matchedTriggers: mod.matchedKeywords,
      labourHours: mod.labourHours,
      costRangeMin: sMin,
      costRangeMax: sMax,
      parts: scaledParts,
    });

    for (const st of mod.repairSteps) {
      if (!actionPlan.includes(st)) actionPlan.push(st);
    }
  }

  const mileageRecommendations = [
    'Every 10,000 km / 1 Year Interval: Full Synthetic 5W-30 Engine Oil + OEM Spin-On Oil Filter + 32-Point Safety Inspection.',
  ];
  if (km >= 20000) {
    mileageRecommendations.unshift(
      '20,000+ km Interval: Hydraulic DOT-4 brake fluid flush, Activated Carbon AC cabin filter replacement & 3D 4-wheel alignment.'
    );
  }
  if (km >= 40000) {
    mileageRecommendations.unshift(
      '40,000+ km Interval: Replace Iridium Spark Plugs, flush Engine Coolant & inspect clutch/transmission.'
    );
  }

  return {
    vehicle: `${make} ${model}`.trim(),
    mileage: km,
    vehicleSegment: segmentLabel,
    detectedSystemsCount: active.length,
    probableCause:
      active.length === 1
        ? active[0].title
        : `${active.length} Issues Detected: ${active.map((m) => m.title.split('—')[0].split(',')[0].trim()).join(' + ')}`,
    severity: sev,
    estimatedCostMin: totalMin,
    estimatedCostMax: totalMax,
    estimatedLabourHours: Number(totalHrs.toFixed(1)),
    recommendedParts,
    itemizedBreakdown,
    actionPlan,
    mileageRecommendations,
    confidenceScore: 96,
  };
}

function syncCloudInvoice(db, sr) {
  const partsSubtotal = (sr.usedParts || []).reduce(
    (s, p) => s + Number(p.quantity || 1) * Number(p.unitPrice || 0),
    0
  );
  const labourSubtotal = Math.round((Number(sr.labourHours) || 0) * (Number(sr.labourRate) || 450));
  const taxAmount = Math.round((partsSubtotal + labourSubtotal) * 0.18);
  const grandTotal =
    sr.manualEstimateTotal !== undefined && sr.manualEstimateTotal !== null && Number(sr.manualEstimateTotal) > 0
      ? Math.round(Number(sr.manualEstimateTotal))
      : partsSubtotal + labourSubtotal + taxAmount;

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
      paymentMethod: 'Awaiting Payment',
      issuedAt: new Date().toISOString(),
      paidAt: null,
    };
    db.invoices.unshift(inv);
  } else {
    inv.partsSubtotal = partsSubtotal;
    inv.labourSubtotal = labourSubtotal;
    inv.taxAmount = taxAmount;
    inv.grandTotal = grandTotal;
  }
}

function jsonResponse(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleCloudApiRequest(urlStr, options = {}) {
  const url = new URL(urlStr, window.location.origin);
  const pathname = url.pathname.replace(/^\/smart-vehicle-service-frontend/, '');
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  const db = getCloudDb();

  if (pathname === '/api/users' && method === 'GET') {
    return jsonResponse(200, db.users);
  }
  if (pathname === '/api/vehicles' && method === 'GET') {
    return jsonResponse(200, db.vehicles);
  }
  if (pathname === '/api/services' && method === 'GET') {
    return jsonResponse(200, db.serviceRequests);
  }
  if (pathname === '/api/inventory' && method === 'GET') {
    return jsonResponse(200, db.inventoryParts);
  }
  if (pathname === '/api/invoices' && method === 'GET') {
    return jsonResponse(200, db.invoices);
  }
  if (pathname === '/api/notifications' && method === 'GET') {
    return jsonResponse(200, db.notifications);
  }

  if (pathname === '/api/auth/login' && method === 'POST') {
    const email = (body.email || '').trim().toLowerCase();
    const role = (body.role || '').toUpperCase();
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      return jsonResponse(401, { error: `No account found for "${email}". Please click "Create New Account" to register.` });
    }
    if (user.role !== role) {
      return jsonResponse(403, { error: `Role Validation Error: "${user.email}" is registered as ${user.role}, not ${role}.` });
    }
    return jsonResponse(200, { token: `jwt-cloud-${user.id}-${Date.now()}`, user });
  }

  if (pathname === '/api/auth/register' && method === 'POST') {
    const email = (body.email || '').trim().toLowerCase();
    const role = (body.role || 'CUSTOMER').toUpperCase();
    if (!['CUSTOMER', 'MECHANIC'].includes(role)) {
      return jsonResponse(403, { error: 'Registration is restricted to Customer and Mechanic accounts only.' });
    }
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      return jsonResponse(409, { error: `An account with email "${email}" is already registered.` });
    }
    const newUser = {
      id: Date.now(),
      fullName: body.fullName,
      email,
      phone: body.phone,
      role,
      specialization: body.specialization || (role === 'MECHANIC' ? 'Certified Service Technician' : 'Vehicle Owner'),
      active: true,
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    saveCloudDb(db);
    return jsonResponse(201, { token: `jwt-cloud-${newUser.id}`, user: newUser });
  }

  if (pathname === '/api/vehicles' && method === 'POST') {
    const customers = db.users.filter((u) => u.role === 'CUSTOMER');
    const owner = db.users.find((u) => Number(u.id) === Number(body.ownerId)) || customers[customers.length - 1] || db.users[0];
    const resolvedOwnerName = body.customOwnerName?.trim() ? body.customOwnerName.trim() : owner.fullName;
    const newV = {
      id: Date.now(),
      ownerId: owner.id,
      ownerName: resolvedOwnerName,
      ownerEmail: owner.email,
      registrationNumber: (body.registrationNumber || 'TS-08-AB-1234').toUpperCase(),
      make: body.make || 'Hyundai',
      model: body.model || 'Creta',
      manufacturingYear: Number(body.manufacturingYear) || 2024,
      fuelType: body.fuelType || 'PETROL',
      currentMileage: Number(body.currentMileage) || 15000,
      insurancePolicyNo: body.insurancePolicyNo || 'POL-882910',
      insuranceExpiry: body.insuranceExpiry || '2027-11-15',
      pucCertificateNo: body.pucCertificateNo || 'PUC-774120',
      pucExpiry: body.pucExpiry || '2027-05-01',
      createdAt: new Date().toISOString(),
    };
    db.vehicles.unshift(newV);
    saveCloudDb(db);
    return jsonResponse(201, newV);
  }

  const compMatch = pathname.match(/^\/api\/vehicles\/(\d+)\/compliance$/);
  if (compMatch && (method === 'PATCH' || method === 'POST')) {
    const vid = Number(compMatch[1]);
    const v = db.vehicles.find((x) => Number(x.id) === vid);
    if (!v) return jsonResponse(404, { error: 'Vehicle not found' });
    Object.assign(v, body);
    if (body.insuranceRenewalScheduledDate) v.insuranceRenewalScheduled = true;
    if (body.pucRenewalScheduledDate) v.pucRenewalScheduled = true;
    saveCloudDb(db);
    return jsonResponse(200, v);
  }

  if (pathname === '/api/services' && method === 'POST') {
    const v = db.vehicles.find((x) => Number(x.id) === Number(body.vehicleId)) || db.vehicles[0];
    const allMechanics = db.users.filter((u) => u.role === 'MECHANIC');
    let mechanic = null;
    let assignmentType = 'AUTO_BALANCED';
    if (body.mechanicId && body.mechanicId !== 'AUTO' && Number(body.mechanicId) > 0) {
      mechanic = allMechanics.find((m) => Number(m.id) === Number(body.mechanicId));
      if (mechanic) assignmentType = 'PREFERRED';
    }
    if (!mechanic) {
      const sorted = [...allMechanics].sort((m1, m2) => {
        const c1 = db.serviceRequests.filter((s) => Number(s.mechanicId) === Number(m1.id) && s.lifecycleStage !== 'DELIVERY').length;
        const c2 = db.serviceRequests.filter((s) => Number(s.mechanicId) === Number(m2.id) && s.lifecycleStage !== 'DELIVERY').length;
        return c1 - c2;
      });
      mechanic = sorted[0] || { id: 2, fullName: 'Vikram Patel' };
    }
    const aiDiag = runCloudAiDiagnosis({
      make: v.make,
      model: v.model,
      mileage: v.currentMileage,
      symptoms: body.customerSymptoms || body.serviceType,
    });
    const newSr = {
      id: Date.now(),
      bookingCode: `SRV-${Math.floor(1000 + Math.random() * 9000)}`,
      vehicleId: v.id,
      vehicleReg: v.registrationNumber,
      vehicleName: `${v.make} ${v.model}`,
      customerId: v.ownerId,
      customerName: v.ownerName,
      mechanicId: mechanic.id,
      mechanicName: mechanic.fullName,
      mechanicAssignmentType: assignmentType,
      serviceType: body.serviceType,
      customerSymptoms: body.customerSymptoms || 'Scheduled service & inspection',
      aiDiagnosisSummary: `${aiDiag.probableCause} (AI Est. ₹${aiDiag.estimatedCostMin} - ₹${aiDiag.estimatedCostMax})`,
      preferredDate: body.preferredDate,
      timeSlot: body.timeSlot,
      lifecycleStage: 'BOOKING',
      quotationApproved: false,
      inspectionNotes: 'Awaiting vehicle reception and technician multi-point inspection.',
      serviceReport: '',
      estimatedCost: aiDiag.estimatedCostMin,
      labourHours: aiDiag.estimatedLabourHours || 1.5,
      labourRate: 450,
      usedParts: [],
      repairTasks: aiDiag.actionPlan.map((step, i) => ({ id: i + 1, title: step, completed: false })),
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
      createdAt: new Date().toISOString(),
    };
    db.serviceRequests.unshift(newSr);
    syncCloudInvoice(db, newSr);
    saveCloudDb(db);
    return jsonResponse(201, newSr);
  }

  const stageMatch = pathname.match(/^\/api\/services\/(\d+)\/stage$/);
  if (stageMatch && (method === 'PATCH' || method === 'POST')) {
    const sid = Number(stageMatch[1]);
    const sr = db.serviceRequests.find((s) => Number(s.id) === sid);
    if (!sr) return jsonResponse(404, { error: 'Not found' });
    Object.assign(sr, body);
    if (body.mechanicId) {
      const m = db.users.find((u) => Number(u.id) === Number(body.mechanicId));
      if (m) sr.mechanicName = m.fullName;
    }
    syncCloudInvoice(db, sr);
    saveCloudDb(db);
    return jsonResponse(200, sr);
  }

  const partsMatch = pathname.match(/^\/api\/services\/(\d+)\/parts$/);
  if (partsMatch && method === 'POST') {
    const sid = Number(partsMatch[1]);
    const sr = db.serviceRequests.find((s) => Number(s.id) === sid);
    if (!sr) return jsonResponse(404, { error: 'Not found' });
    sr.usedParts = sr.usedParts || [];
    const qty = Math.max(1, Number(body.quantity) || 1);
    if (body.customPartName) {
      sr.usedParts.push({
        partId: Date.now(),
        sku: `CUSTOM-${Math.floor(100 + Math.random() * 900)}`,
        partName: body.customPartName,
        quantity: qty,
        unitPrice: Number(body.unitPrice) || 0,
        isCustom: true,
      });
    } else {
      const p = db.inventoryParts.find((x) => Number(x.id) === Number(body.partId));
      if (p) {
        sr.usedParts.push({
          partId: p.id,
          sku: p.sku,
          partName: p.partName,
          quantity: qty,
          unitPrice: Number(body.unitPrice) || p.unitPrice,
          isCustom: false,
        });
        p.stockQuantity = Math.max(0, p.stockQuantity - qty);
      }
    }
    sr.manualEstimateTotal = null;
    syncCloudInvoice(db, sr);
    saveCloudDb(db);
    return jsonResponse(200, sr);
  }

  if (pathname === '/api/inventory' && method === 'POST') {
    if (body.id) {
      const ex = db.inventoryParts.find((p) => Number(p.id) === Number(body.id));
      if (ex) {
        Object.assign(ex, body, { stockQuantity: Number(body.stockQuantity), unitPrice: Number(body.unitPrice) });
        saveCloudDb(db);
        return jsonResponse(200, ex);
      }
    }
    const np = { id: Date.now(), ...body, stockQuantity: Number(body.stockQuantity), unitPrice: Number(body.unitPrice) };
    db.inventoryParts.unshift(np);
    saveCloudDb(db);
    return jsonResponse(201, np);
  }

  const payMatch = pathname.match(/^\/api\/invoices\/(\d+)\/pay$/);
  if (payMatch && method === 'POST') {
    const id = Number(payMatch[1]);
    const inv = db.invoices.find((i) => Number(i.id) === id);
    if (!inv) return jsonResponse(404, { error: 'Not found' });
    inv.paymentStatus = 'PAID';
    inv.paymentMethod = body.paymentMethod || 'UPI / Instant Pay';
    inv.paidAt = new Date().toISOString();
    const sr = db.serviceRequests.find((s) => Number(s.id) === Number(inv.serviceRequestId));
    if (sr) sr.lifecycleStage = 'DELIVERY';
    saveCloudDb(db);
    return jsonResponse(200, inv);
  }

  if (pathname === '/api/ai/analyze' && method === 'POST') {
    return jsonResponse(200, runCloudAiDiagnosis(body));
  }

  if (pathname === '/api/notifications/scan' && method === 'POST') {
    return jsonResponse(200, { alertsGenerated: 2 });
  }

  return jsonResponse(200, { ok: true });
}

// Install fetch interceptor that uses localhost:8080 when running locally,
// and seamlessly falls back to the in-browser Cloud DB when hosted on GitHub Pages!
const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const urlStr = typeof input === 'string' ? input : input.url;
  const isApiCall = urlStr.includes('/api/');
  const isGitHubPages = window.location.hostname.includes('github.io');

  if (isApiCall && isGitHubPages) {
    return handleCloudApiRequest(urlStr, init);
  }

  if (isApiCall) {
    try {
      const res = await originalFetch(input, init);
      if (res.status >= 500 || (res.status === 404 && !window.location.port)) {
        return handleCloudApiRequest(urlStr, init);
      }
      return res;
    } catch (err) {
      return handleCloudApiRequest(urlStr, init);
    }
  }

  return originalFetch(input, init);
};
