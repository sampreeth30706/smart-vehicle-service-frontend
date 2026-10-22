import React, { useState, useEffect, useMemo } from 'react';
import {
  Car,
  Wrench,
  ShieldCheck,
  Sparkles,
  Bell,
  FileText,
  Package,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Plus,
  CreditCard,
  Printer,
  RefreshCw,
  Star,
  Cpu,
  Layers,
  KeyRound,
  Check,
  Activity,
  Gauge,
  LogOut,
  Lock,
  Mail,
  UserPlus,
  LogIn,
  Phone,
  User,
  Users,
  Database,
  AlertCircle
} from 'lucide-react';

const LIFECYCLE_STAGES = [
  { key: 'BOOKING', label: 'Booking', short: '1. Booking' },
  { key: 'VEHICLE_RECEIVED', label: 'Vehicle Received', short: '2. Received' },
  { key: 'INSPECTION', label: 'Inspection', short: '3. Inspection' },
  { key: 'QUOTATION', label: 'Quotation', short: '4. Quotation' },
  { key: 'APPROVAL', label: 'Approval', short: '5. Approval' },
  { key: 'SERVICE_REPAIR', label: 'Service / Repair', short: '6. Repair' },
  { key: 'QUALITY_CHECK', label: 'Quality Check', short: '7. QC Check' },
  { key: 'PAYMENT', label: 'Payment', short: '8. Payment' },
  { key: 'DELIVERY', label: 'Delivery', short: '9. Delivery' },
];

const SYMPTOM_PRESETS = [
  {
    label: 'Brake Squeak / Grinding',
    text: 'Squeaking and grinding noise from front brakes when braking at 40 km/h.',
  },
  {
    label: 'Periodic Oil & Filter Service',
    text: 'Due for 10,000 km periodic engine oil change, oil filter and air filter service.',
  },
  {
    label: 'Engine Overheating / Coolant',
    text: 'Engine temperature gauge rising in traffic and coolant level dropping in radiator.',
  },
  {
    label: 'Check Engine / Misfire / Jerk',
    text: 'Check engine light is on, rough idle and engine jerking during acceleration.',
  },
  {
    label: 'Clutch Slipping / Hard Pedal',
    text: 'Clutch pedal feels hard, high biting point and clutch slipping on uphill drives.',
  },
  {
    label: 'Gearbox / CV Axle Clicking',
    text: 'Hard gear shifting and clicking noise from front axle when turning steering full lock.',
  },
  {
    label: 'AC Cooling Weak / Smell',
    text: 'Cabin AC cooling is weak during afternoon driving with musty smell from vents.',
  },
  {
    label: 'Slow Crank / Dead Battery',
    text: 'Engine cranks very slowly in the morning and 12V battery voltage is weak.',
  },
  {
    label: 'Alternator / Battery Light',
    text: 'Red battery warning light stays on while driving and headlights dim at idle.',
  },
  {
    label: 'Suspension Clunk on Potholes',
    text: 'Loud clunking thud noise from front suspension over potholes and speed breakers.',
  },
  {
    label: 'Steering Vibration / Pulling',
    text: 'Steering wheel vibration at 70 km/h and car pulling to the left on highway.',
  },
  {
    label: 'Heavy / Stiff Power Steering',
    text: 'Steering wheel feels stiff and heavy when parking with whining steering noise.',
  },
  {
    label: 'Oil Leak / Burning Smell',
    text: 'Dark engine oil leak spots under parked car and burning oil smell from engine bay.',
  },
  {
    label: 'Low Mileage / Black Smoke',
    text: 'Sluggish pickup, drop in fuel economy mileage and black smoke from exhaust.',
  },
  {
    label: 'Exhaust Roar / PUC Emission',
    text: 'Loud exhaust muffler noise and O2 sensor emission check required for PUC.',
  },
  {
    label: 'Turbo Whistle / Loss of Boost',
    text: 'High-pitched turbo whistle under acceleration and loss of highway boost power.',
  },
  {
    label: 'Belt Squeal / Cold Start Rattle',
    text: 'Squealing serpentine belt noise and timing chain rattle on cold morning start.',
  },
  {
    label: 'Headlight / Wiper / Electrical',
    text: 'Windshield wiper blades streaking, dim headlight bulb and power window slow.',
  },
];

const ROLE_CONFIG = {
  CUSTOMER: {
    label: 'Customer / Owner',
    badge: 'Customer Portal',
    desc: 'Register your vehicles, book appointments, track 9-stage repairs & pay invoices',
    icon: Car,
    color: 'blue',
    demoEmail: 'customer@autopulse.in',
  },
  MECHANIC: {
    label: 'Mechanic',
    badge: 'Mechanic Workspace',
    desc: 'Inspect customer vehicles, update repair stages, log spare parts & labour',
    icon: Wrench,
    color: 'amber',
    demoEmail: 'mechanic@autopulse.in',
  },
  ADMIN: {
    label: 'Administrator',
    badge: 'Administrator Console',
    desc: 'Manage users, mechanics, spare parts inventory, billing & live analytics',
    icon: ShieldCheck,
    color: 'emerald',
    demoEmail: 'admin@autopulse.in',
  },
};

function getDaysRemaining(dateStr) {
  const today = new Date('2026-10-21');
  const target = new Date(dateStr);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

export default function App() {
  // Authentication & Session State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [selectedAuthRole, setSelectedAuthRole] = useState('CUSTOMER'); // 'CUSTOMER' | 'MECHANIC' | 'ADMIN'
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialization: '',
    password: '',
    confirmPassword: '',
  });

  // Logged-in User & Role State
  const [activeRole, setActiveRole] = useState('CUSTOMER');
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | ai | invoices | notifications | architecture
  const [jwtToken, setJwtToken] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Operational Relational Data from Backend API
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modals & Forms
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPartModal, setShowPartModal] = useState(false);

  // New Vehicle Form
  const [vehicleForm, setVehicleForm] = useState({
    ownerId: '',
    customOwnerName: '',
    registrationNumber: '',
    make: 'Hyundai',
    model: 'Creta SX',
    manufacturingYear: 2024,
    fuelType: 'PETROL',
    currentMileage: 15000,
    insurancePolicyNo: 'ICICI-9920182',
    insuranceExpiry: '2026-11-12',
    pucCertificateNo: 'PUC-TS08-7741',
    pucExpiry: '2026-11-01',
  });

  // New Booking Form (Supports Optional Preferred Mechanic or Equal Auto-Assign)
  const [bookingForm, setBookingForm] = useState({
    vehicleId: '',
    mechanicId: 'AUTO',
    serviceType: 'Comprehensive Periodic Service (10,000 km)',
    customerSymptoms: '',
    preferredDate: '2026-10-24',
    timeSlot: '10:00 AM - 12:00 PM',
  });

  // Admin Custom Restock Quantity State & Mechanic Queue Filter
  const [restockAmounts, setRestockAmounts] = useState({});
  const [mechQueueFilter, setMechQueueFilter] = useState('ALL'); // 'ALL' | 'MINE'

  // New Inventory Part Form
  const [partForm, setPartForm] = useState({
    sku: '',
    partName: '',
    category: 'Braking System',
    stockQuantity: 12,
    reorderLevel: 5,
    unitPrice: 1850,
    supplier: 'Bosch Automotive',
  });

  // AI Intelligence Layer State
  const [aiInput, setAiInput] = useState({
    make: 'Hyundai',
    model: 'Creta SX',
    mileage: 24650,
    symptoms: 'Squeaking noise from front brakes when braking at 40 km/h and due for periodic oil change.',
  });
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Mechanic Selected Job State & Estimate Builder State
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [partToAdd, setPartToAdd] = useState({ partId: 201, quantity: 1, unitPrice: 2650 });
  const [customPartForm, setCustomPartForm] = useState({
    customPartName: '',
    quantity: 1,
    unitPrice: '',
  });
  const [manualEstimateInput, setManualEstimateInput] = useState('');
  const [mechNotesDraft, setMechNotesDraft] = useState('');
  const [mechReportDraft, setMechReportDraft] = useState('');
  const [newRepairTaskTitle, setNewRepairTaskTitle] = useState('');
  const [newQcPointLabel, setNewQcPointLabel] = useState('');
  const [deliveryNoteDraft, setDeliveryNoteDraft] = useState('');

  // Customer Compliance Renewal Modal & Minimized Cards State
  const [complianceModalVehicle, setComplianceModalVehicle] = useState(null);
  const [complianceForm, setComplianceForm] = useState({
    insurancePolicyNo: '',
    insuranceExpiry: '',
    pucCertificateNo: '',
    pucExpiry: '',
    insuranceRenewalScheduled: false,
    pucRenewalScheduled: false,
    insuranceRenewalScheduledDate: '',
    pucRenewalScheduledDate: '',
  });
  const [hiddenComplianceVehicles, setHiddenComplianceVehicles] = useState({});
  const [minimizedServices, setMinimizedServices] = useState({});

  const showToastMsg = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAllData = async () => {
    try {
      const [uRes, vRes, sRes, iRes, invRes, nRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/vehicles'),
        fetch('/api/services'),
        fetch('/api/inventory'),
        fetch('/api/invoices'),
        fetch('/api/notifications'),
      ]);
      const [uData, vData, sData, iData, invData, nData] = await Promise.all([
        uRes.json(),
        vRes.json(),
        sRes.json(),
        iRes.json(),
        invRes.json(),
        nRes.json(),
      ]);
      setUsers(uData);
      setVehicles(vData);
      setServices(sData);
      setInventory(iData);
      setInvoices(invData);
      setNotifications(nData);
    } catch (err) {
      console.error('API load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time polling every 2 seconds so Customer, Mechanic & Admin dashboards stay synced live!
  useEffect(() => {
    fetchAllData();
    handleRunAiAnalysis();
    const timer = setInterval(() => {
      fetchAllData();
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Filter data per logged-in Customer (while Mechanic & Admin see workshop-wide live records)
  const myVehicles = useMemo(() => {
    if (activeRole === 'CUSTOMER' && currentUser) {
      return vehicles.filter((v) => Number(v.ownerId) === Number(currentUser.id));
    }
    return vehicles;
  }, [vehicles, activeRole, currentUser]);

  const myServices = useMemo(() => {
    if (activeRole === 'CUSTOMER' && currentUser) {
      return services.filter((s) => Number(s.customerId) === Number(currentUser.id));
    }
    return services;
  }, [services, activeRole, currentUser]);

  const visibleInvoices = useMemo(() => {
    if (activeRole === 'CUSTOMER' && currentUser) {
      return invoices.filter((i) => Number(i.customerId) === Number(currentUser.id));
    }
    return invoices;
  }, [invoices, activeRole, currentUser]);

  const visibleNotifications = useMemo(() => {
    if (activeRole === 'CUSTOMER' && currentUser) {
      return notifications.filter((n) => Number(n.recipientUserId) === Number(currentUser.id));
    }
    return notifications;
  }, [notifications, activeRole, currentUser]);

  // Keep bookingForm.vehicleId synced with the logged-in customer's vehicles
  useEffect(() => {
    if (myVehicles.length > 0) {
      const exists = myVehicles.some((v) => Number(v.id) === Number(bookingForm.vehicleId));
      if (!exists) {
        setBookingForm((f) => ({ ...f, vehicleId: myVehicles[0].id }));
      }
    } else {
      setBookingForm((f) => ({ ...f, vehicleId: '' }));
    }
  }, [myVehicles]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === Number(selectedServiceId)) || services[0] || null,
    [services, selectedServiceId]
  );

  useEffect(() => {
    if (selectedService) {
      setMechNotesDraft(selectedService.inspectionNotes || '');
      setMechReportDraft(selectedService.serviceReport || '');
      setDeliveryNoteDraft(
        selectedService.deliveryNote ||
          `Your ${selectedService.vehicleName} (${selectedService.vehicleReg}) has completed all repairs and quality checks and is ready for delivery!`
      );
      setManualEstimateInput(
        selectedService.manualEstimateTotal ? String(selectedService.manualEstimateTotal) : ''
      );
    }
  }, [selectedService?.id]);

  // --- AUTH HANDLERS (CONNECTED TO BACKEND SQLITE DB) ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!loginForm.email.trim() || !loginForm.password) {
      setAuthError('Please enter your email address and password.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email.trim(),
          password: loginForm.password,
          role: selectedAuthRole,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed. Please verify your credentials and selected role.');
        return;
      }

      setJwtToken(data.token);
      setCurrentUser(data.user);
      setActiveRole(data.user.role);
      setActiveTab('dashboard');
      setIsAuthenticated(true);
      await fetchAllData();
      showToastMsg(`Welcome ${data.user.fullName}! Logged into ${ROLE_CONFIG[data.user.role]?.badge}.`);
    } catch (err) {
      setAuthError('Unable to reach backend server on port 8080.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (registerForm.fullName.trim().length < 2) {
      setAuthError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!registerForm.email.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (registerForm.phone.trim().length < 7) {
      setAuthError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (registerForm.password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthError('Passwords do not match. Please confirm your password.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: registerForm.fullName.trim(),
          email: registerForm.email.trim(),
          phone: registerForm.phone.trim(),
          specialization: registerForm.specialization.trim(),
          password: registerForm.password,
          role: selectedAuthRole,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Registration failed. Please check your inputs.');
        return;
      }

      setJwtToken(data.token);
      setCurrentUser(data.user);
      setActiveRole(data.user.role);
      setActiveTab('dashboard');
      setIsAuthenticated(true);
      await fetchAllData();
      showToastMsg(`Account saved in SQLite DB! Welcome to your ${ROLE_CONFIG[data.user.role]?.badge}.`);
    } catch (err) {
      setAuthError('Unable to reach backend server on port 8080.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setJwtToken('');
    setAuthError('');
    setLoginForm({ email: '', password: '' });
  };

  const fillDemoAccount = (roleKey) => {
    setSelectedAuthRole(roleKey);
    setAuthMode('login');
    setAuthError('');
    setLoginForm({
      email: ROLE_CONFIG[roleKey].demoEmail,
      password: 'password123',
    });
  };

  const handleRunAiAnalysis = async (customInput) => {
    const payload = customInput || aiInput;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setAiResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    const customerList = users.filter((u) => u.role === 'CUSTOMER');
    const resolvedOwnerId =
      activeRole === 'CUSTOMER'
        ? currentUser?.id
        : Number(vehicleForm.ownerId) ||
          customerList[customerList.length - 1]?.id ||
          currentUser?.id;

    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...vehicleForm,
        ownerId: resolvedOwnerId,
        customOwnerName: activeRole === 'CUSTOMER' ? '' : vehicleForm.customOwnerName,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setShowVehicleModal(false);
      setVehicleForm({ ...vehicleForm, registrationNumber: '', customOwnerName: '' });
      await fetchAllData();
      setBookingForm((f) => ({ ...f, vehicleId: created.id }));
      showToastMsg(
        `Vehicle ${created.registrationNumber} registered for ${created.ownerName}! Synced across all portals.`
      );
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!bookingForm.vehicleId) {
      showToastMsg('Please register a vehicle first!');
      return;
    }
    const chosenVehicle = vehicles.find((v) => Number(v.id) === Number(bookingForm.vehicleId));
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...bookingForm,
        customerId: chosenVehicle ? chosenVehicle.ownerId : currentUser?.id,
        mechanicId:
          bookingForm.mechanicId && bookingForm.mechanicId !== 'AUTO'
            ? Number(bookingForm.mechanicId)
            : 'AUTO',
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setShowBookingModal(false);
      setSelectedServiceId(created.id);
      await fetchAllData();
      showToastMsg(
        `Booking ${created.bookingCode} scheduled! Assigned to Mechanic: ${created.mechanicName} (${
          created.mechanicAssignmentType === 'PREFERRED' ? 'Preferred Choice' : 'Equal Load-Balanced'
        }).`
      );
    }
  };

  const handleUpdateServiceStage = async (serviceId, updates, msg) => {
    const res = await fetch(`/api/services/${serviceId}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      await fetchAllData();
      showToastMsg(msg || 'Service lifecycle updated in real-time!');
    }
  };

  const handleAddPartToService = async (serviceId) => {
    const res = await fetch(`/api/services/${serviceId}/parts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partToAdd),
    });
    if (res.ok) {
      setManualEstimateInput('');
      await fetchAllData();
      showToastMsg('Inventory part added & estimate recalculated!');
    }
  };

  const handleAddCustomPartToService = async (e, serviceId) => {
    e.preventDefault();
    if (!customPartForm.customPartName.trim() || customPartForm.unitPrice === '') {
      showToastMsg('Please enter both the part/item name and its price!');
      return;
    }
    const res = await fetch(`/api/services/${serviceId}/parts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customPartName: customPartForm.customPartName.trim(),
        quantity: Number(customPartForm.quantity) || 1,
        unitPrice: Number(customPartForm.unitPrice) || 0,
      }),
    });
    if (res.ok) {
      setCustomPartForm({ customPartName: '', quantity: 1, unitPrice: '' });
      setManualEstimateInput('');
      await fetchAllData();
      showToastMsg('Custom part & price added to estimate!');
    }
  };

  const handleUpdateUsedPartsList = async (serviceId, updatedParts, msg) => {
    const res = await fetch(`/api/services/${serviceId}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usedParts: updatedParts, manualEstimateTotal: null }),
    });
    if (res.ok) {
      setManualEstimateInput('');
      await fetchAllData();
      showToastMsg(msg || 'Parts list & estimate updated!');
    }
  };

  const handleOpenComplianceModal = (vehicle) => {
    setComplianceModalVehicle(vehicle);
    setComplianceForm({
      insurancePolicyNo: vehicle.insurancePolicyNo || '',
      insuranceExpiry: vehicle.insuranceExpiry || '2027-10-22',
      pucCertificateNo: vehicle.pucCertificateNo || '',
      pucExpiry: vehicle.pucExpiry || '2027-04-22',
      insuranceRenewalScheduled: Boolean(vehicle.insuranceRenewalScheduled),
      pucRenewalScheduled: Boolean(vehicle.pucRenewalScheduled),
      insuranceRenewalScheduledDate: vehicle.insuranceRenewalScheduledDate || '',
      pucRenewalScheduledDate: vehicle.pucRenewalScheduledDate || '',
    });
  };

  const handleSaveComplianceUpdate = async (e) => {
    e.preventDefault();
    if (!complianceModalVehicle) return;
    const payload = {
      ...complianceForm,
      insuranceRenewalScheduled:
        Boolean(complianceForm.insuranceRenewalScheduled) ||
        Boolean(complianceForm.insuranceRenewalScheduledDate),
      pucRenewalScheduled:
        Boolean(complianceForm.pucRenewalScheduled) ||
        Boolean(complianceForm.pucRenewalScheduledDate),
    };
    const res = await fetch(`/api/vehicles/${complianceModalVehicle.id}/compliance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const updatedVehicle = await res.json();
      setVehicles((prev) =>
        prev.map((v) => (Number(v.id) === Number(updatedVehicle.id) ? updatedVehicle : v))
      );
      setComplianceModalVehicle(null);
      await fetchAllData();
      showToastMsg(
        `Updated Insurance (${updatedVehicle.insuranceExpiry}) & PUC (${updatedVehicle.pucExpiry}) for ${updatedVehicle.registrationNumber}!`
      );
    }
  };

  const handleMechanicStageClick = (sr, targetStageKey) => {
    const targetIdx = LIFECYCLE_STAGES.findIndex((s) => s.key === targetStageKey);
    const approvalIdx = LIFECYCLE_STAGES.findIndex((s) => s.key === 'APPROVAL');
    const relatedInvoice = invoices.find((i) => i.serviceRequestId === sr.id);

    // Gate 1: Cannot move past Approval (to Repair, QC, Payment, Delivery) unless Customer approved Quotation!
    if (targetIdx > approvalIdx && !sr.quotationApproved) {
      showToastMsg('Locked: Customer must approve the Quotation first before starting Repair!');
      return;
    }
    // Gate 2: Cannot move to Delivery unless Payment is completed!
    if (targetStageKey === 'DELIVERY' && relatedInvoice && relatedInvoice.paymentStatus !== 'PAID') {
      showToastMsg('Locked: Customer must complete Payment before moving to Delivery!');
      return;
    }

    handleUpdateServiceStage(
      sr.id,
      { lifecycleStage: targetStageKey },
      `Job ${sr.bookingCode} moved to ${LIFECYCLE_STAGES[targetIdx]?.label}`
    );
  };

  const handlePayInvoice = async (invoiceId, method = 'UPI / Instant Pay') => {
    const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod: method }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSelectedInvoice(updated);
      await fetchAllData();
      showToastMsg(`Invoice ${updated.invoiceNumber} Paid! Stage advanced to Delivery.`);
    }
  };

  const handleAddInventoryPart = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partForm),
    });
    if (res.ok) {
      setShowPartModal(false);
      await fetchAllData();
      showToastMsg('New spare part added to Inventory!');
    }
  };

  const handleRestockPart = async (part, delta = 10) => {
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...part, stockQuantity: part.stockQuantity + delta }),
    });
    if (res.ok) {
      await fetchAllData();
      showToastMsg(`Restocked +${delta} units of ${part.partName}`);
    }
  };

  const handleRunSchedulerScan = async () => {
    const res = await fetch('/api/notifications/scan', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      await fetchAllData();
      showToastMsg(`Notification Scheduler generated ${data.alertsGenerated} compliance & stock alerts!`);
    }
  };

  // Analytics KPIs
  const analytics = useMemo(() => {
    const totalRevenue = invoices
      .filter((i) => i.paymentStatus === 'PAID')
      .reduce((acc, i) => acc + Number(i.grandTotal), 0);
    const pendingBilling = invoices
      .filter((i) => i.paymentStatus === 'PENDING')
      .reduce((acc, i) => acc + Number(i.grandTotal), 0);
    const lowStockCount = inventory.filter((p) => p.stockQuantity <= p.reorderLevel).length;
    const activeRepairs = services.filter((s) => s.lifecycleStage !== 'DELIVERY').length;
    return { totalRevenue, pendingBilling, lowStockCount, activeRepairs };
  }, [invoices, inventory, services]);

  // ===========================================================================
  // VIEW 1: DEDICATED LOGIN & REGISTRATION GATEWAY (WITH ROLE VALIDATION & DB)
  // ===========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
        {/* Background Glow Accents */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        </div>

        {/* Top Branding Header */}
        <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white tracking-tight">
                  Smart Vehicle Service &amp; Management System
                </h1>
                <p className="text-xs text-slate-400">
                  Role-Based Authentication • React + Spring Boot + Relational SQLite/MySQL DB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                <Database className="w-3.5 h-3.5" />
                SQLite DB Live ({users.length} Registered Users)
              </span>
              <a
                href="http://localhost:8080"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                Inspect Backend API (:8080)
              </a>
            </div>
          </div>
        </header>

        {/* Main Auth Container */}
        <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Platform Overview & Role Architecture */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Real-Time Multi-Role Service Platform
              </div>
              <h2 className="text-3xl font-extrabold text-white leading-tight">
                Select Your Role to Sign In or Register
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Every customer login, vehicle registration, and service booking is stored in the backend database and synced live to the Mechanic &amp; Administrator dashboards.
              </p>
            </div>

            {/* Role Breakdown Cards */}
            <div className="space-y-3">
              {Object.entries(ROLE_CONFIG)
                .filter(([roleKey]) => (authMode === 'register' ? roleKey !== 'ADMIN' : true))
                .map(([roleKey, cfg]) => {
                  const IconComp = cfg.icon;
                  const isSelected = selectedAuthRole === roleKey;
                  return (
                    <div
                      key={roleKey}
                      onClick={() => {
                        setSelectedAuthRole(roleKey);
                        setAuthError('');
                      }}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-slate-900 border-blue-500 shadow-lg shadow-blue-500/15'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`p-2.5 rounded-xl shrink-0 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-white">{cfg.label}</h3>
                            {isSelected && (
                              <span className="text-[11px] font-bold text-blue-400 bg-blue-500/15 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                                Selected Role
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{cfg.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Quick Role Logins for Testing Mechanic & Admin */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Quick Role Fillers (Password: <code className="text-emerald-400">password123</code>)</span>
                <span className="text-[11px] text-slate-500">Or register Customer / Mechanic!</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoAccount('CUSTOMER')}
                  className="px-2.5 py-2 rounded-xl bg-slate-950 hover:bg-blue-950/60 border border-slate-800 hover:border-blue-500/40 text-xs font-semibold text-blue-400 transition"
                >
                  Fill Customer
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('MECHANIC')}
                  className="px-2.5 py-2 rounded-xl bg-slate-950 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/40 text-xs font-semibold text-amber-400 transition"
                >
                  Fill Mechanic
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('ADMIN')}
                  className="px-2.5 py-2 rounded-xl bg-slate-950 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-emerald-400 transition"
                >
                  Fill Admin
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Login / Register Form Card */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              {/* Mode Toggle Tabs (Login vs Register) */}
              <div className="grid grid-cols-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    authMode === 'login'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In to Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    if (selectedAuthRole === 'ADMIN') {
                      setSelectedAuthRole('CUSTOMER');
                    }
                    setAuthError('');
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    authMode === 'register'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Create New Account
                </button>
              </div>

              {/* Step 1: Role Selector Pills inside Form */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  {authMode === 'register'
                    ? 'Step 1: Who are you registering as? (Customer or Mechanic) *'
                    : 'Step 1: Who are you signing in as? *'}
                </label>
                <div className={`grid ${authMode === 'register' ? 'grid-cols-2' : 'grid-cols-3'} gap-2.5`}>
                  {Object.entries(ROLE_CONFIG)
                    .filter(([roleKey]) => (authMode === 'register' ? roleKey !== 'ADMIN' : true))
                    .map(([roleKey, cfg]) => {
                      const IconComp = cfg.icon;
                      const active = selectedAuthRole === roleKey;
                      return (
                        <button
                          key={roleKey}
                          type="button"
                          onClick={() => {
                            setSelectedAuthRole(roleKey);
                            setAuthError('');
                          }}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                            active
                              ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <IconComp className={`w-5 h-5 mb-1 ${active ? 'text-blue-400' : 'text-slate-500'}`} />
                          <span>{cfg.label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Validation Error Banner */}
              {authError && (
                <div className="bg-rose-500/15 border border-rose-500/40 text-rose-300 px-4 py-3 rounded-xl text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {/* =========================================================== */}
              {/* FORM A: SIGN IN (VALIDATES EMAIL + PASSWORD + ROLE)         */}
              {/* =========================================================== */}
              {authMode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1.5">
                      Email Address ({ROLE_CONFIG[selectedAuthRole].label}) *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        placeholder={ROLE_CONFIG[selectedAuthRole].demoEmail}
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        placeholder="Enter your password (min 6 characters)"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-sm transition"
                  >
                    <LogIn className="w-4 h-4" />
                    {authSubmitting
                      ? 'Validating Credentials & Role...'
                      : `Validate & Sign In to ${ROLE_CONFIG[selectedAuthRole].badge}`}
                  </button>
                </form>
              ) : (
                /* =========================================================== */
                /* FORM B: REGISTER NEW ACCOUNT IN SQLITE DATABASE             */
                /* =========================================================== */
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sampreeth Reddy"
                          value={registerForm.fullName}
                          onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          required
                          placeholder="+91 98765 12345"
                          value={registerForm.phone}
                          onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                        <input
                          type="email"
                          required
                          placeholder="name@example.com"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        {selectedAuthRole === 'MECHANIC'
                          ? 'Technical Specialization'
                          : selectedAuthRole === 'ADMIN'
                          ? 'Department / Title'
                          : 'City / Location'}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          selectedAuthRole === 'MECHANIC'
                            ? 'e.g. Engine & Brakes Specialist'
                            : selectedAuthRole === 'ADMIN'
                            ? 'e.g. Workshop Manager'
                            : 'e.g. Hyderabad, Telangana'
                        }
                        value={registerForm.specialization}
                        onChange={(e) => setRegisterForm({ ...registerForm, specialization: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Create Password (min 6 chars) *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    {authSubmitting
                      ? 'Saving to Database...'
                      : `Register as ${ROLE_CONFIG[selectedAuthRole].label} & Open Dashboard`}
                  </button>
                </form>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-slate-900 px-6 py-4 text-center text-xs text-slate-500">
          Smart Vehicle Service &amp; Management System • Full-Stack React + Spring Boot + Relational Database
        </footer>
      </div>
    );
  }

  // ===========================================================================
  // VIEW 2: AUTHENTICATED PORTAL (ROUTED TO USER'S VALIDATED ROLE DASHBOARD)
  // ===========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-400/30 animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-medium text-sm">{toast.msg}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-white">
                  Smart Vehicle Service &amp; Management
                </h1>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  {ROLE_CONFIG[activeRole]?.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Signed in as <strong className="text-slate-200">{currentUser?.fullName}</strong> ({currentUser?.email})
              </p>
            </div>
          </div>

          {/* Navigation & Sign Out */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              {ROLE_CONFIG[activeRole]?.badge}
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                activeTab === 'ai'
                  ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                  : 'border-slate-800 bg-slate-900 text-purple-400 hover:border-purple-500/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Diagnostics
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                activeTab === 'invoices'
                  ? 'bg-slate-800 border-slate-600 text-white'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Invoices ({visibleInvoices.length})
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                activeTab === 'notifications'
                  ? 'bg-slate-800 border-slate-600 text-white'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Alerts</span>
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold rounded-full text-[10px]">
                {visibleNotifications.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                activeTab === 'architecture'
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              JWT &amp; DB
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Active Session Identity Strip */}
      <div className="bg-slate-900/50 border-b border-slate-800/80 px-6 py-2 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Real-Time Sync Active (Every 2s):
            </span>
            <span className="text-slate-200 font-semibold">
              {currentUser?.fullName} • {activeRole} (User ID #{currentUser?.id})
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              SQLite DB Connected (<code className="text-emerald-400">smart_vehicle.sqlite</code>)
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        {/* ================================================================= */}
        {/* TAB: AI INTELLIGENCE LAYER (21-System Dataset, Multi-Fault & Cost)*/}
        {/* ================================================================= */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30 rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Intelligence Layer • 21-System Automotive Knowledge Base
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Dynamic Multi-Symptom AI Vehicle Diagnosis, Cost Estimator &amp; Repair Planner
                  </h2>
                  <p className="text-sm text-slate-300 mt-1">
                    Type any single or multiple symptoms (or combine presets with <code className="text-purple-300 font-bold">+</code>) to get accurate per-system fault detection, segment-scaled OEM part prices, labour hours, and repair steps.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                {/* Input Form */}
                <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-purple-400" />
                      Vehicle &amp; Multi-Symptom Input
                    </h3>
                    <span className="text-[11px] text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                      21 Diagnostic Modules Active
                    </span>
                  </div>

                  {/* Quick Load from Registered Vehicles */}
                  {myVehicles.length > 0 && (
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Quick-Fill from Your Registered Vehicles
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {myVehicles.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              const next = {
                                ...aiInput,
                                make: v.make,
                                model: v.model,
                                mileage: Number(v.currentMileage) || 20000,
                              };
                              setAiInput(next);
                              handleRunAiAnalysis(next);
                            }}
                            className="text-[11px] bg-slate-900 hover:bg-indigo-950/70 border border-slate-700 hover:border-indigo-500/50 text-indigo-300 font-semibold px-2.5 py-1 rounded-lg transition"
                          >
                            🚗 {v.make} {v.model} ({Number(v.currentMileage).toLocaleString('en-IN')} km)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Vehicle Make</label>
                      <input
                        type="text"
                        value={aiInput.make}
                        onChange={(e) => setAiInput({ ...aiInput, make: e.target.value })}
                        placeholder="e.g. Maruti Suzuki / Hyundai / BMW"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Model</label>
                      <input
                        type="text"
                        value={aiInput.model}
                        onChange={(e) => setAiInput({ ...aiInput, model: e.target.value })}
                        placeholder="e.g. Vitara Brezza / Creta SX"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Current Odometer Mileage (km)
                    </label>
                    <input
                      type="number"
                      value={aiInput.mileage}
                      onChange={(e) => setAiInput({ ...aiInput, mileage: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-400">
                        18 Symptom Presets (Click label to select, or click <strong className="text-purple-300">+</strong> to combine multiple!)
                      </label>
                      <button
                        type="button"
                        onClick={() => setAiInput({ ...aiInput, symptoms: '' })}
                        className="text-[11px] text-rose-400 hover:text-rose-300"
                      >
                        Clear Text
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
                      {SYMPTOM_PRESETS.map((p, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center rounded-md overflow-hidden border border-slate-700 bg-slate-900 hover:border-purple-500/50 transition"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...aiInput, symptoms: p.text };
                              setAiInput(updated);
                              handleRunAiAnalysis(updated);
                            }}
                            className="text-[11px] text-slate-200 hover:text-white hover:bg-purple-950/60 px-2 py-1 transition"
                            title="Replace symptoms and analyze"
                          >
                            {p.label}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const current = (aiInput.symptoms || '').trim();
                              const combined = current
                                ? current.includes(p.text)
                                  ? current
                                  : `${current} Also: ${p.text}`
                                : p.text;
                              const updated = { ...aiInput, symptoms: combined };
                              setAiInput(updated);
                              handleRunAiAnalysis(updated);
                            }}
                            className="text-[11px] font-bold bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white px-1.5 py-1 border-l border-slate-700 transition"
                            title="Append this symptom to combine multiple issues!"
                          >
                            +
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Observed Symptoms / Noise / Warning Lights (Supports Multiple Issues at Once)
                    </label>
                    <textarea
                      rows={3}
                      value={aiInput.symptoms}
                      onChange={(e) => setAiInput({ ...aiInput, symptoms: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      placeholder="Type any combination of issues (e.g., 'Squeaking front brakes, engine overheating in traffic, clutch feels hard, and AC cooling is weak')..."
                    />
                  </div>

                  <button
                    onClick={() => handleRunAiAnalysis()}
                    disabled={aiLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 text-sm transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    {aiLoading ? 'Analyzing Symptoms...' : 'Run Dynamic AI Issue & Cost Analysis'}
                  </button>
                </div>

                {/* Output Report */}
                <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-5">
                  {aiResult ? (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-slate-400">
                              AI Diagnostic Report for <strong className="text-white">{aiResult.vehicle}</strong>
                            </span>
                            {aiResult.vehicleSegment && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                {aiResult.vehicleSegment}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-white mt-1">{aiResult.probableCause}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              aiResult.severity === 'HIGH'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : aiResult.severity === 'MEDIUM'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            Urgency: {aiResult.severity}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {aiResult.confidenceScore}% Match
                          </span>
                        </div>
                      </div>

                      {/* Cost Range Estimator & Summary Box */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4">
                          <span className="text-xs text-slate-400">
                            Total Combined AI Estimated Cost Range ({aiResult.detectedSystemsCount || 1}{' '}
                            {(aiResult.detectedSystemsCount || 1) === 1 ? 'System' : 'Systems'} Detected)
                          </span>
                          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                            ₹{aiResult.estimatedCostMin?.toLocaleString('en-IN')} – ₹
                            {aiResult.estimatedCostMax?.toLocaleString('en-IN')}
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-1">
                            Est. Workshop Labour: <strong className="text-white">{aiResult.estimatedLabourHours || 1.5} hrs</strong> • Includes OEM Parts + 18% GST
                          </span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                          <span className="text-xs text-slate-400">
                            Recommended OEM Replacement Parts ({(aiResult.recommendedParts || []).length})
                          </span>
                          <ul className="mt-1.5 space-y-1 max-h-28 overflow-y-auto">
                            {(aiResult.recommendedParts || []).map((pt, i) => (
                              <li key={i} className="text-xs text-slate-200 flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Per-System Itemized Breakdown Cards */}
                      {Array.isArray(aiResult.itemizedBreakdown) && aiResult.itemizedBreakdown.length > 0 && (
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                            Detected Fault Systems &amp; Itemized Cost Breakdown ({aiResult.itemizedBreakdown.length})
                          </h4>
                          <div className="space-y-2">
                            {aiResult.itemizedBreakdown.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 mr-2">
                                      {item.system}
                                    </span>
                                    <strong className="text-white">{item.issueTitle}</strong>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400 text-[11px]">{item.labourHours} hrs labour</span>
                                    <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                                      ₹{item.costRangeMin?.toLocaleString('en-IN')} – ₹
                                      {item.costRangeMax?.toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                                  <span>
                                    Parts:{' '}
                                    {item.parts
                                      .map((p) => `${p.name} (₹${p.estPrice.toLocaleString('en-IN')})`)
                                      .join(' • ')}
                                  </span>
                                  {item.matchedTriggers?.length > 0 && (
                                    <span className="text-[10px] text-slate-500">
                                      Matched: {item.matchedTriggers.slice(0, 4).join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Plan & Mileage Recommendations */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                            Recommended Inspection &amp; Repair Steps ({(aiResult.actionPlan || []).length})
                          </h4>
                          <ul className="space-y-1.5">
                            {(aiResult.actionPlan || []).map((step, i) => (
                              <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                            Mileage-Based Maintenance ({aiInput.mileage.toLocaleString()} km)
                          </h4>
                          <ul className="space-y-1.5">
                            {(aiResult.mileageRecommendations || []).map((rec, i) => (
                              <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                <Gauge className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* 1-Click Book Service with This AI Diagnosis */}
                      {activeRole === 'CUSTOMER' && (
                        <div className="pt-3 border-t border-slate-800 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setBookingForm((prev) => ({
                                ...prev,
                                serviceType: aiResult.probableCause.slice(0, 80),
                                customerSymptoms: aiInput.symptoms,
                              }));
                              setShowBookingModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 flex items-center gap-2 transition"
                          >
                            <Calendar className="w-4 h-4" />
                            Book Service Appointment with This AI Diagnosis &amp; Estimate →
                          </button>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB: DIGITAL INVOICES & BILLING                                   */}
        {/* ================================================================= */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Digital Invoices &amp; GST Billing Center
                </h2>
                <p className="text-xs text-slate-400">
                  Itemized spare parts, technician labour charges, 18% GST calculation, and online payment status.
                </p>
              </div>
            </div>

            {visibleInvoices.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No Digital Invoices Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Invoices are generated automatically in real time as soon as a service appointment is booked and updated by the mechanic.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-3 no-print">
                  {visibleInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className={`cursor-pointer p-4 rounded-xl border transition ${
                        (selectedInvoice?.id || visibleInvoices[0]?.id) === inv.id
                          ? 'bg-slate-900 border-blue-500 shadow-lg shadow-blue-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-blue-400">{inv.invoiceNumber}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            inv.paymentStatus === 'PAID'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {inv.paymentStatus}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm text-white">{inv.vehicleName}</div>
                          <div className="text-xs text-slate-400">
                            {inv.vehicleReg} • Booking {inv.bookingCode}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-extrabold text-white">
                            ₹{Number(inv.grandTotal).toLocaleString('en-IN')}
                          </div>
                          <div className="text-[11px] text-slate-400">Incl. 18% GST</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Printable Digital Invoice Preview */}
                <div className="lg:col-span-7">
                  {(() => {
                    const inv =
                      visibleInvoices.find((i) => i.id === selectedInvoice?.id) || visibleInvoices[0];
                    if (!inv) return null;
                    const relatedSr = services.find((s) => s.id === inv.serviceRequestId);
                    return (
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
                              Tax Invoice • Smart Vehicle Service Platform
                            </div>
                            <h3 className="text-2xl font-extrabold text-white mt-0.5">{inv.invoiceNumber}</h3>
                            <p className="text-xs text-slate-400">
                              Issued: {new Date(inv.issuedAt).toLocaleString()} • Booking Ref: {inv.bookingCode}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 no-print">
                            <button
                              onClick={() => window.print()}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Print / PDF
                            </button>
                            {inv.paymentStatus !== 'PAID' && (
                              <button
                                onClick={() => handlePayInvoice(inv.id, 'UPI / Razorpay')}
                                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/25"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                Pay ₹{Number(inv.grandTotal).toLocaleString('en-IN')} Now
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                          <div>
                            <span className="text-slate-500 block">Billed To (Customer)</span>
                            <strong className="text-slate-200 text-sm">{inv.customerName}</strong>
                            <span className="text-slate-400 block mt-0.5">Vehicle: {inv.vehicleName}</span>
                            <span className="text-slate-400 block">Reg No: {inv.vehicleReg}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500 block">Payment Status</span>
                            <strong
                              className={`text-sm ${
                                inv.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            >
                              {inv.paymentStatus}
                            </strong>
                            <span className="text-slate-400 block mt-0.5">Method: {inv.paymentMethod}</span>
                            {inv.paidAt && (
                              <span className="text-slate-400 block">
                                Paid: {new Date(inv.paidAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Itemized Parts & Labour Table */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                            Itemized Spare Parts &amp; Service Labour
                          </h4>
                          <div className="border border-slate-800 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-950 text-slate-400">
                                <tr>
                                  <th className="py-2.5 px-3">Item / Description</th>
                                  <th className="py-2.5 px-3 text-center">Qty / Hrs</th>
                                  <th className="py-2.5 px-3 text-right">Rate</th>
                                  <th className="py-2.5 px-3 text-right">Line Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/80">
                                {(relatedSr?.usedParts || []).map((p, idx) => (
                                  <tr key={idx}>
                                    <td className="py-2.5 px-3 font-medium text-slate-200">
                                      {p.partName} <span className="text-slate-500">({p.sku})</span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center">{p.quantity}</td>
                                    <td className="py-2.5 px-3 text-right">₹{p.unitPrice}</td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-white">
                                      ₹{(p.quantity * p.unitPrice).toLocaleString('en-IN')}
                                    </td>
                                  </tr>
                                ))}
                                <tr>
                                  <td className="py-2.5 px-3 font-medium text-slate-200">
                                    Certified Technician Service Labour ({relatedSr?.mechanicName || 'Mechanic'})
                                  </td>
                                  <td className="py-2.5 px-3 text-center">{relatedSr?.labourHours || 1.5} hrs</td>
                                  <td className="py-2.5 px-3 text-right">₹{relatedSr?.labourRate || 450}/hr</td>
                                  <td className="py-2.5 px-3 text-right font-semibold text-white">
                                    ₹{Number(inv.labourSubtotal).toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Totals Summary */}
                        <div className="flex justify-end">
                          <div className="w-full sm:w-72 space-y-1.5 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                            <div className="flex justify-between text-slate-400">
                              <span>Spare Parts Subtotal:</span>
                              <span className="text-slate-200">₹{Number(inv.partsSubtotal).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Technician Labour:</span>
                              <span className="text-slate-200">₹{Number(inv.labourSubtotal).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>CGST + SGST (18%):</span>
                              <span className="text-slate-200">₹{Number(inv.taxAmount).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="border-t border-slate-800 pt-2 mt-2 flex justify-between text-sm font-extrabold text-white">
                              <span>Grand Total:</span>
                              <span className="text-emerald-400">₹{Number(inv.grandTotal).toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB: NOTIFICATION SCHEDULER & GATEWAY ALERTS                      */}
        {/* ================================================================= */}
        {activeTab === 'notifications' && (
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  Notification Scheduler &amp; Email / SMS / Push Gateway Logs
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Automated alerts for Insurance Expiry, PUC Certificate Expiry, Low Inventory Stock, and Real-Time Repair Status Updates.
                </p>
              </div>
              <button
                onClick={handleRunSchedulerScan}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Run Compliance &amp; Low-Stock Scheduler Now
              </button>
            </div>

            {visibleNotifications.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-400">
                No alerts yet. Register a vehicle or click "Run Compliance &amp; Low-Stock Scheduler Now".
              </div>
            ) : (
              <div className="space-y-3">
                {visibleNotifications.map((n) => (
                  <div
                    key={n.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5 ${
                          n.alertType === 'PUC_EXPIRY' || n.alertType === 'INSURANCE_EXPIRY'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : n.alertType === 'LOW_STOCK'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {n.channel} • {n.alertType.replace('_', ' ')}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-white">{n.title}</h4>
                        <p className="text-xs text-slate-300 mt-1">{n.message}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {new Date(n.sentAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB: ARCHITECTURE & JWT INSPECTOR                                 */}
        {/* ================================================================= */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                System Architecture, SQLite Users Table &amp; Live JWT Session
              </h2>
              <p className="text-xs text-slate-400">
                Full-Stack Architecture implementing React Portal, Role-Based Dashboards, Spring Boot Service Platform (`backend/`), SQLite &amp; MySQL Relational Database (`smart_vehicle.sqlite` &amp; `schema.sql`), and AI Intelligence Layer.
              </p>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                    Active Signed JWT Bearer Token ({activeRole} • {currentUser?.email})
                  </span>
                  <span className="text-[11px] text-emerald-400">HS256 Verified</span>
                </div>
                <code className="block text-[11px] text-slate-400 break-all bg-slate-900 p-3 rounded-lg border border-slate-800">
                  {jwtToken}
                </code>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB: ROLE-BASED DASHBOARDS (ROUTED BY VALIDATED LOGIN ROLE)       */}
        {/* ================================================================= */}
        {activeTab === 'dashboard' && (
          <>
            {/* ------------------------------------------------------------- */}
            {/* 1. CUSTOMER / VEHICLE OWNER PORTAL (STRICTLY PER-CUSTOMER)    */}
            {/* ------------------------------------------------------------- */}
            {activeRole === 'CUSTOMER' && (
              <div className="space-y-6">
                {/* Top Action Banner */}
                <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/30 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                      Customer Self-Service Portal • Account ID #{currentUser?.id}
                    </span>
                    <h2 className="text-2xl font-bold text-white mt-0.5">
                      Welcome, {currentUser?.fullName}
                    </h2>
                    <p className="text-xs text-slate-300 mt-1">
                      Register your vehicles below and book service appointments. Every registration and repair request syncs in real time with the Mechanic &amp; Administrator dashboards!
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setShowVehicleModal(true)}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
                    >
                      <Plus className="w-4 h-4 text-blue-400" />
                      Register Vehicle
                    </button>
                    <button
                      onClick={() => {
                        if (myVehicles.length === 0) {
                          setShowVehicleModal(true);
                          showToastMsg('Please register your vehicle first before booking a service!');
                        } else {
                          setShowBookingModal(true);
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/30 transition"
                    >
                      <Calendar className="w-4 h-4" />
                      Book Service Appointment
                    </button>
                  </div>
                </div>

                {/* Registered Vehicles & Compliance Expiry Cards */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                      <Car className="w-4 h-4 text-blue-400" />
                      My Registered Vehicles &amp; Insurance / PUC Compliance
                    </h3>
                    <span className="text-xs text-slate-400">{myVehicles.length} Vehicles Registered</span>
                  </div>

                  {myVehicles.length === 0 ? (
                    <div className="bg-slate-900/80 border border-dashed border-slate-700 rounded-2xl p-10 text-center space-y-3">
                      <Car className="w-10 h-10 text-blue-400 mx-auto" />
                      <h4 className="font-bold text-base text-white">No Vehicles Registered on Your Account Yet</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Click below to register your vehicle with its Registration Number, Make, Model, Mileage, and Insurance/PUC expiry dates.
                      </p>
                      <button
                        onClick={() => setShowVehicleModal(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-lg shadow-blue-600/30"
                      >
                        <Plus className="w-4 h-4" />
                        Register Your First Vehicle
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myVehicles.map((v) => {
                        const insDays = getDaysRemaining(v.insuranceExpiry);
                        const pucDays = getDaysRemaining(v.pucExpiry);
                        return (
                          <div
                            key={v.id}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                    {v.registrationNumber}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {v.manufacturingYear} • {v.fuelType}
                                  </span>
                                </div>
                                <h4 className="text-lg font-bold text-white mt-1.5">
                                  {v.make} {v.model}
                                </h4>
                                <p className="text-xs text-slate-400">
                                  Odometer: <strong className="text-slate-200">{v.currentMileage.toLocaleString()} km</strong> • Owner: {v.ownerName}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <button
                                  onClick={() => {
                                    setBookingForm((f) => ({ ...f, vehicleId: v.id }));
                                    setShowBookingModal(true);
                                  }}
                                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition"
                                >
                                  <Calendar className="w-3.5 h-3.5" />
                                  Book Service
                                </button>
                                <button
                                  onClick={() => {
                                    setAiInput({
                                      make: v.make,
                                      model: v.model,
                                      mileage: v.currentMileage,
                                      symptoms: 'Periodic maintenance check and brake inspection',
                                    });
                                    setActiveTab('ai');
                                  }}
                                  className="text-xs bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  AI Check
                                </button>
                              </div>
                            </div>

                            {/* Insurance & PUC Expiry Badges + Schedule Renewal / Update + Collapse Toggle */}
                            <div className="pt-2 border-t border-slate-800/80 space-y-2">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 font-semibold">
                                  Insurance &amp; PUC Compliance Status
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenComplianceModal(v)}
                                    className="text-blue-400 hover:text-blue-300 font-bold underline"
                                  >
                                    Schedule Renewal / Update Dates
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setHiddenComplianceVehicles((prev) => ({
                                        ...prev,
                                        [v.id]: !prev[v.id],
                                      }))
                                    }
                                    className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
                                  >
                                    {hiddenComplianceVehicles[v.id] ? 'Show ▾' : 'Hide ▴'}
                                  </button>
                                </div>
                              </div>

                              {!hiddenComplianceVehicles[v.id] && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  <div
                                    className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                                      v.insuranceRenewalScheduled || insDays > 30
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] opacity-80">
                                          Insurance ({v.insurancePolicyNo || 'Policy'})
                                        </span>
                                        {v.insuranceRenewalScheduled || insDays > 30 ? (
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                        )}
                                      </div>
                                      <div className="font-bold mt-0.5">{v.insuranceExpiry}</div>
                                      <div className="text-[10px] opacity-90">
                                        {v.insuranceRenewalScheduled
                                          ? `Renewal Scheduled${v.insuranceRenewalScheduledDate ? ` (${v.insuranceRenewalScheduledDate})` : ''} • Compliant`
                                          : insDays <= 30
                                          ? `Expiring in ${insDays} days!`
                                          : `Valid (${insDays} days left)`}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenComplianceModal(v)}
                                      className="w-full py-1 px-2 rounded-lg bg-slate-950/70 hover:bg-slate-900 text-[11px] font-semibold text-white border border-slate-700/80 transition"
                                    >
                                      Renew / Update Insurance
                                    </button>
                                  </div>

                                  <div
                                    className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                                      v.pucRenewalScheduled || pucDays > 15
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] opacity-80">
                                          PUC ({v.pucCertificateNo || 'Cert'})
                                        </span>
                                        {v.pucRenewalScheduled || pucDays > 15 ? (
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                        )}
                                      </div>
                                      <div className="font-bold mt-0.5">{v.pucExpiry}</div>
                                      <div className="text-[10px] opacity-90">
                                        {v.pucRenewalScheduled
                                          ? `PUC Test Scheduled${v.pucRenewalScheduledDate ? ` (${v.pucRenewalScheduledDate})` : ''} • Compliant`
                                          : pucDays <= 15
                                          ? `Urgent: ${pucDays} days left!`
                                          : `Valid (${pucDays} days left)`}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenComplianceModal(v)}
                                      className="w-full py-1 px-2 rounded-lg bg-slate-950/70 hover:bg-slate-900 text-[11px] font-semibold text-white border border-slate-700/80 transition"
                                    >
                                      Schedule / Update PUC
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Live Service Requests & 9-Stage Lifecycle Tracker (With Minimize Option!) */}
                <div className="space-y-4">
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    My Live Service Repair Tracking &amp; History ({myServices.length})
                  </h3>

                  {myServices.length === 0 ? (
                    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                      <Wrench className="w-8 h-8 text-slate-600 mx-auto" />
                      <h4 className="font-semibold text-sm text-white">No Active Service Bookings Yet</h4>
                      <p className="text-xs text-slate-400">
                        Once you book a service appointment for your registered vehicle, you can track all 9 repair stages live right here!
                      </p>
                    </div>
                  ) : (
                    myServices.map((sr) => {
                      const currentStageIdx = LIFECYCLE_STAGES.findIndex((s) => s.key === sr.lifecycleStage);
                      const relatedInvoice = invoices.find((i) => i.serviceRequestId === sr.id);
                      const isDelivered = sr.lifecycleStage === 'DELIVERY';
                      const isMinimized = Boolean(minimizedServices[sr.id]);
                      const repairTasks = sr.repairTasks || [];
                      const completedTasks = repairTasks.filter((t) => t.completed).length;
                      const qcList = sr.qcChecklist || [];
                      const passedQc = qcList.filter((q) => q.passed).length;

                      // Compact Minimized View (Ideal once Repaired & Delivered!)
                      if (isMinimized) {
                        return (
                          <div
                            key={sr.id}
                            className="bg-slate-900/90 border border-slate-800 rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4"
                          >
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {sr.bookingCode}
                              </span>
                              <span className="text-sm font-bold text-white">
                                {sr.vehicleName} ({sr.vehicleReg})
                              </span>
                              <span className="text-xs text-slate-400">• {sr.serviceType}</span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  isDelivered
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`}
                              >
                                {isDelivered ? 'Repaired & Delivered ✓' : sr.lifecycleStage.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-extrabold text-emerald-400">
                                ₹{Number(sr.estimatedCost).toLocaleString('en-IN')}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setMinimizedServices((prev) => ({ ...prev, [sr.id]: false }))
                                }
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
                              >
                                Expand History ▾
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={sr.id}
                          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  {sr.bookingCode}
                                </span>
                                <span className="text-sm font-bold text-white">{sr.vehicleName}</span>
                                <span className="text-xs text-slate-400">({sr.vehicleReg})</span>
                              </div>
                              <h4 className="text-base font-semibold text-blue-400 mt-1">{sr.serviceType}</h4>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Slot: {sr.preferredDate} ({sr.timeSlot}) • Assigned Mechanic:{' '}
                                <strong className="text-slate-200">{sr.mechanicName}</strong>
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5">
                              <div className="text-right mr-1">
                                <span className="text-[11px] text-slate-400 block">Estimated Total (Incl. GST)</span>
                                <span className="text-lg font-extrabold text-emerald-400">
                                  ₹{Number(sr.estimatedCost).toLocaleString('en-IN')}
                                </span>
                              </div>
                              {relatedInvoice && (
                                <button
                                  onClick={() => {
                                    setSelectedInvoice(relatedInvoice);
                                    setActiveTab('invoices');
                                  }}
                                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 border border-slate-700"
                                >
                                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                                  Invoice
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setMinimizedServices((prev) => ({ ...prev, [sr.id]: true }))
                                }
                                className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800"
                                title="Minimize service history card"
                              >
                                {isDelivered ? 'Minimize History ▴' : 'Minimize ▴'}
                              </button>
                            </div>
                          </div>

                          {/* 9-Stage End-to-End Service Lifecycle Pipeline */}
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/90">
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                End-to-End Service Lifecycle Progress (Live Sync)
                              </span>
                              <span className="text-xs font-bold text-blue-400">
                                Stage {currentStageIdx + 1} of 9:{' '}
                                {LIFECYCLE_STAGES[currentStageIdx]?.label}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
                              {LIFECYCLE_STAGES.map((st, idx) => {
                                const done = idx < currentStageIdx;
                                const active = idx === currentStageIdx;
                                return (
                                  <div
                                    key={st.key}
                                    className={`px-2 py-2 rounded-lg text-center border text-[11px] font-medium transition ${
                                      active
                                        ? 'bg-blue-600/25 border-blue-500 text-white font-bold shadow-sm shadow-blue-500/20'
                                        : done
                                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                        : 'bg-slate-900/60 border-slate-800 text-slate-500'
                                    }`}
                                  >
                                    <div className="truncate">{st.short}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* CUSTOMER STAGE PROMPTS: QUOTATION APPROVAL / PAYMENT / DELIVERY */}
                          {(sr.lifecycleStage === 'QUOTATION' || sr.lifecycleStage === 'APPROVAL') &&
                            !sr.quotationApproved && (
                              <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                                <div>
                                  <div className="text-xs font-bold uppercase text-amber-400">
                                    Action Required • Mechanic Quotation Awaiting Your Approval
                                  </div>
                                  <p className="text-xs text-slate-200 mt-0.5">
                                    Mechanic <strong>{sr.mechanicName}</strong> has uploaded the parts &amp; labour estimate of{' '}
                                    <strong className="text-emerald-400">
                                      ₹{Number(sr.estimatedCost).toLocaleString('en-IN')}
                                    </strong>
                                    . Approve below so the mechanic can begin repairs!
                                  </p>
                                </div>
                                <button
                                  onClick={() =>
                                    handleUpdateServiceStage(
                                      sr.id,
                                      { quotationApproved: true, lifecycleStage: 'APPROVAL' },
                                      `Quotation approved for ${sr.bookingCode}! Mechanic unlocked to start repair.`
                                    )
                                  }
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/25"
                                >
                                  <Check className="w-4 h-4" />
                                  Approve Quotation (₹{Number(sr.estimatedCost).toLocaleString('en-IN')})
                                </button>
                              </div>
                            )}

                          {(sr.lifecycleStage === 'PAYMENT' || sr.paymentRequested) &&
                            relatedInvoice &&
                            relatedInvoice.paymentStatus !== 'PAID' && (
                              <div className="bg-blue-500/15 border border-blue-500/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                                <div>
                                  <div className="text-xs font-bold uppercase text-blue-400">
                                    Payment Requested • Repairs &amp; Quality Check Passed!
                                  </div>
                                  <p className="text-xs text-slate-200 mt-0.5">
                                    Your vehicle passed all QC inspections. Complete payment of{' '}
                                    <strong className="text-emerald-400">
                                      ₹{Number(relatedInvoice.grandTotal).toLocaleString('en-IN')}
                                    </strong>{' '}
                                    ({relatedInvoice.invoiceNumber}) to unlock vehicle delivery.
                                  </p>
                                </div>
                                <button
                                  onClick={() => handlePayInvoice(relatedInvoice.id, 'UPI / Instant Pay')}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/25"
                                >
                                  <CreditCard className="w-4 h-4" />
                                  Pay ₹{Number(relatedInvoice.grandTotal).toLocaleString('en-IN')} Now
                                </button>
                              </div>
                            )}

                          {sr.lifecycleStage === 'DELIVERY' && (
                            <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                              <div>
                                <div className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Vehicle Repaired &amp; Ready for Delivery!
                                </div>
                                <p className="text-xs text-slate-200 mt-1">
                                  {sr.deliveryNote ||
                                    `Your ${sr.vehicleName} (${sr.vehicleReg}) has completed all repairs, passed Quality Check, and is ready for delivery!`}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setMinimizedServices((prev) => ({ ...prev, [sr.id]: true }))
                                }
                                className="bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 text-xs font-semibold px-3.5 py-2 rounded-xl"
                              >
                                Minimize Completed History ▴
                              </button>
                            </div>
                          )}

                          {/* Inspection Notes, Live Repair Checklist, QC Status & Billed Parts */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                              <div>
                                <div className="text-slate-400 font-semibold">
                                  Mechanic Inspection &amp; Diagnosis Report:
                                </div>
                                <p className="text-slate-200 mt-1">{sr.inspectionNotes}</p>
                              </div>

                              {/* Live Repair Tasks Checklist Progress */}
                              {repairTasks.length > 0 && (
                                <div className="pt-2 border-t border-slate-800/80">
                                  <div className="flex items-center justify-between text-slate-400 font-semibold mb-1.5">
                                    <span>Live Repair Progress Checklist:</span>
                                    <span className="text-emerald-400">
                                      {completedTasks}/{repairTasks.length} Done
                                    </span>
                                  </div>
                                  <ul className="space-y-1">
                                    {repairTasks.map((t) => (
                                      <li key={t.id} className="flex items-center gap-2 text-slate-300">
                                        <span
                                          className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                                            t.completed
                                              ? 'bg-emerald-500 text-slate-950'
                                              : 'bg-slate-800 text-slate-500'
                                          }`}
                                        >
                                          {t.completed ? '✓' : '•'}
                                        </span>
                                        <span className={t.completed ? 'line-through text-slate-400' : 'text-slate-200'}>
                                          {t.title}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* QC Checklist Progress */}
                              {passedQc > 0 && (
                                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                  <span className="text-slate-400 font-semibold">Quality Check Points Passed:</span>
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                    {passedQc} / {qcList.length} Passed ✓
                                  </span>
                                </div>
                              )}

                              {sr.serviceReport && (
                                <p className="text-emerald-300 pt-1 border-t border-slate-800/80">
                                  <strong>Final Service Report:</strong> {sr.serviceReport}
                                </p>
                              )}
                            </div>

                            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between text-slate-400 font-semibold mb-2">
                                  <span>Itemized Spare Parts &amp; Labour ({sr.labourHours} hrs):</span>
                                  <span
                                    className={`text-[11px] font-bold ${
                                      sr.quotationApproved ? 'text-emerald-400' : 'text-amber-400'
                                    }`}
                                  >
                                    {sr.quotationApproved ? ' Estimate Approved ✓' : 'Pending Approval'}
                                  </span>
                                </div>
                                {(sr.usedParts || []).length > 0 ? (
                                  <ul className="space-y-1.5 text-slate-300">
                                    {sr.usedParts.map((up, i) => (
                                      <li key={i} className="flex justify-between">
                                        <span>
                                          {up.partName} × {up.quantity}
                                        </span>
                                        <span className="font-semibold text-white">
                                          ₹{(up.quantity * up.unitPrice).toLocaleString('en-IN')}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-slate-500">No replacement parts added yet.</p>
                                )}
                              </div>

                              {/* Customer Rating Bar once Delivered */}
                              {sr.lifecycleStage === 'DELIVERY' && (
                                <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between">
                                  <div className="flex items-center gap-1 text-amber-400">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        onClick={() =>
                                          handleUpdateServiceStage(
                                            sr.id,
                                            {
                                              customerRating: star,
                                              customerFeedback: 'Great service experience!',
                                            },
                                            `Rated ${star} stars for ${sr.bookingCode}!`
                                          )
                                        }
                                      >
                                        <Star
                                          className={`w-4 h-4 ${
                                            (sr.customerRating || 0) >= star ? 'fill-amber-400' : 'text-slate-600'
                                          }`}
                                        />
                                      </button>
                                    ))}
                                    <span className="text-slate-300 ml-1.5">
                                      {sr.customerRating ? `${sr.customerRating}/5 Rating Saved` : 'Rate Service'}
                                    </span>
                                  </div>
                                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Delivered
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 2. MECHANIC WORKSPACE (LIVE SYNCED WITH CUSTOMER BOOKINGS)    */}
            {/* ------------------------------------------------------------- */}
            {activeRole === 'MECHANIC' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      Mechanic Diagnostic &amp; Repair Workspace (Live Queue)
                    </span>
                    <h2 className="text-2xl font-bold text-white mt-0.5">
                      Technician Console — {currentUser?.fullName}
                    </h2>
                    <p className="text-xs text-slate-300 mt-1">
                      Register walk-in vehicles, schedule new service repairs, advance the 9-stage repair lifecycle, record spare parts &amp; labour, and save inspection reports.
                    </p>
                  </div>

                  {/* Mechanic Direct Vehicle Registration & Repair Scheduling Actions */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowVehicleModal(true)}
                      className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
                    >
                      <Plus className="w-4 h-4 text-amber-400" />
                      Register Vehicle
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBookingModal(true)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition"
                    >
                      <Calendar className="w-4 h-4" />
                      Schedule Service / Repair
                    </button>
                  </div>
                </div>

                {services.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                    <Wrench className="w-10 h-10 text-amber-400 mx-auto" />
                    <h3 className="text-base font-bold text-white">No Customer Service Requests in Queue Yet</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      You can register a vehicle and schedule a service directly using the buttons above, or wait for a Customer to book an appointment!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Queue of Assigned Service Jobs */}
                    <div className="lg:col-span-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-xs text-slate-300 uppercase tracking-wider">
                          Service Job Cards ({services.length})
                        </h3>
                        <div className="inline-flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setMechQueueFilter('ALL')}
                            className={`px-2 py-1 rounded-md font-semibold transition ${
                              mechQueueFilter === 'ALL'
                                ? 'bg-amber-500 text-slate-950'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            All ({services.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setMechQueueFilter('MINE')}
                            className={`px-2 py-1 rounded-md font-semibold transition ${
                              mechQueueFilter === 'MINE'
                                ? 'bg-amber-500 text-slate-950'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            My Assigned (
                            {services.filter((s) => Number(s.mechanicId) === Number(currentUser?.id)).length})
                          </button>
                        </div>
                      </div>

                      {services
                        .filter((s) =>
                          mechQueueFilter === 'MINE'
                            ? Number(s.mechanicId) === Number(currentUser?.id)
                            : true
                        )
                        .map((sr) => {
                          const isMine = Number(sr.mechanicId) === Number(currentUser?.id);
                          return (
                            <div
                              key={sr.id}
                              onClick={() => setSelectedServiceId(sr.id)}
                              className={`cursor-pointer p-4 rounded-xl border transition ${
                                selectedService?.id === sr.id
                                  ? 'bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/10'
                                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-amber-400">{sr.bookingCode}</span>
                                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                                  {sr.lifecycleStage.replace('_', ' ')}
                                </span>
                              </div>
                              <h4 className="font-bold text-sm text-white mt-1.5">{sr.vehicleName}</h4>
                              <p className="text-xs text-slate-400">
                                {sr.vehicleReg} • Customer: <strong className="text-slate-200">{sr.customerName}</strong>
                              </p>
                              <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5 border-t border-slate-800/80 text-[11px]">
                                <span className="text-blue-400 truncate">{sr.serviceType}</span>
                                <span
                                  className={`px-2 py-0.5 rounded font-semibold shrink-0 ${
                                    isMine
                                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  👨‍🔧 {sr.mechanicName}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Right Active Job Card Workspace */}
                    <div className="lg:col-span-8">
                      {selectedService && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Job Card {selectedService.bookingCode}
                                </span>
                                <span className="text-xs text-slate-400">
                                  Customer: <strong className="text-white">{selectedService.customerName}</strong>
                                </span>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs text-slate-400">
                                  Quotation:{' '}
                                  <strong
                                    className={
                                      selectedService.quotationApproved ? 'text-emerald-400' : 'text-amber-400'
                                    }
                                  >
                                    {selectedService.quotationApproved ? 'APPROVED' : 'PENDING APPROVAL'}
                                  </strong>
                                </span>
                              </div>
                              <h3 className="text-xl font-bold text-white mt-1">
                                {selectedService.vehicleName} ({selectedService.vehicleReg})
                              </h3>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Reported Symptoms: <span className="text-slate-200">{selectedService.customerSymptoms}</span>
                              </p>
                            </div>
                          </div>

                          {/* Interactive 9-Stage Lifecycle Controller with Approval & Payment Gates */}
                          <div>
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                9-Stage Repair Lifecycle (Each Stage Has Its Dedicated Workspace Below)
                              </label>
                              <span className="text-[11px] text-slate-400">
                                {!selectedService.quotationApproved
                                  ? '🔒 Stages 6–9 locked until Customer approves Quotation'
                                  : selectedService.paymentStatus !== 'PAID'
                                  ? '✅ Quotation Approved • 🔒 Stage 9 (Delivery) locked until Payment is completed'
                                  : '✅ Quotation Approved & Invoice Paid — All stages unlocked'}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
                              {LIFECYCLE_STAGES.map((st, idx) => {
                                const active = selectedService.lifecycleStage === st.key;
                                const approvalIdx = LIFECYCLE_STAGES.findIndex((s) => s.key === 'APPROVAL');
                                const lockedByApproval = idx > approvalIdx && !selectedService.quotationApproved;
                                const lockedByPayment = st.key === 'DELIVERY' && selectedService.paymentStatus !== 'PAID';
                                const isLocked = lockedByApproval || lockedByPayment;
                                return (
                                  <button
                                    key={st.key}
                                    onClick={() => handleMechanicStageClick(selectedService, st.key)}
                                    className={`px-2 py-2.5 rounded-lg text-[11px] font-semibold border transition flex items-center justify-center gap-1 ${
                                      active
                                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                                        : isLocked
                                        ? 'bg-slate-950/50 text-slate-500 border-slate-800/80 cursor-not-allowed'
                                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                                    }`}
                                  >
                                    <span>{st.short}</span>
                                    {isLocked && <span title="Locked">🔒</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* =============================================================== */}
                          {/* STAGE-SPECIFIC WORKSPACE UI (CHANGES ACCORDING TO STAGE 1 → 9)  */}
                          {/* =============================================================== */}

                          {/* STAGE 1: BOOKING — CUSTOMER INPUTS & FULL CAR DETAILS */}
                          {selectedService.lifecycleStage === 'BOOKING' && (() => {
                            const carObj = vehicles.find((v) => Number(v.id) === Number(selectedService.vehicleId));
                            return (
                              <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-5 space-y-5">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                      Stage 1 of 9 • Booking Details
                                    </span>
                                    <h4 className="text-base font-bold text-white mt-1">
                                      Customer Booking Inputs &amp; Complete Vehicle Profile
                                    </h4>
                                    <p className="text-xs text-slate-400">
                                      Review the customer&apos;s submitted booking information, reported symptoms, and car specifications before receiving the vehicle into the workshop bay.
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
                                    <div className="text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
                                      Vehicle Specifications
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <span className="text-slate-400 block text-[11px]">Make &amp; Model</span>
                                        <strong className="text-white">{selectedService.vehicleName}</strong>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[11px]">Registration No.</span>
                                        <strong className="text-amber-300 font-mono">{selectedService.vehicleReg}</strong>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[11px]">Fuel Type &amp; Year</span>
                                        <strong className="text-slate-200">
                                          {carObj ? `${carObj.fuelType} • ${carObj.manufacturingYear}` : 'Standard'}
                                        </strong>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[11px]">Odometer Reading</span>
                                        <strong className="text-slate-200">
                                          {carObj ? `${Number(carObj.currentMileage).toLocaleString('en-IN')} km` : 'N/A'}
                                        </strong>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[11px]">Insurance Expiry</span>
                                        <strong className="text-slate-200">{carObj?.insuranceExpiry || 'N/A'}</strong>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[11px]">PUC Expiry</span>
                                        <strong className="text-slate-200">{carObj?.pucExpiry || 'N/A'}</strong>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
                                    <div className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                                      Customer Booking Inputs
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <span className="text-slate-400 block text-[11px]">Customer Name</span>
                                        <strong className="text-white">{selectedService.customerName}</strong>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[11px]">Service Package</span>
                                        <strong className="text-emerald-300">{selectedService.serviceType}</strong>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[11px]">Preferred Date</span>
                                        <strong className="text-slate-200">{selectedService.preferredDate}</strong>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[11px]">Preferred Time Slot</span>
                                        <strong className="text-slate-200">{selectedService.timeSlot || selectedService.preferredSlot}</strong>
                                      </div>
                                    </div>
                                    <div className="pt-2 border-t border-slate-800">
                                      <span className="text-slate-400 block text-[11px]">Customer Reported Symptoms / Issues:</span>
                                      <p className="text-white font-medium mt-0.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                                        {selectedService.customerSymptoms}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3.5 text-xs">
                                  <span className="font-bold text-indigo-300 block mb-1">
                                    AI Pre-Diagnosis Summary from Booking:
                                  </span>
                                  <p className="text-slate-300">{selectedService.aiDiagnosisSummary}</p>
                                </div>

                                <div className="flex justify-end pt-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateServiceStage(
                                        selectedService.id,
                                        { lifecycleStage: 'VEHICLE_RECEIVED' },
                                        `Vehicle ${selectedService.vehicleReg} marked as Received at Workshop Bay!`
                                      )
                                    }
                                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition"
                                  >
                                    Confirm Vehicle Reception &amp; Move to Stage 2 (Received) →
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                          {/* STAGE 2: VEHICLE RECEIVED — INTAKE CHECK & MOVE TO INSPECTION */}
                          {selectedService.lifecycleStage === 'VEHICLE_RECEIVED' && (
                            <div className="bg-slate-950 border border-blue-500/30 rounded-2xl p-5 space-y-5">
                              <div className="border-b border-slate-800 pb-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  Stage 2 of 9 • Vehicle Received at Service Bay
                                </span>
                                <h4 className="text-base font-bold text-white mt-1">
                                  Workshop Bay Intake &amp; Job Card Initialization
                                </h4>
                                <p className="text-xs text-slate-400">
                                  The customer&apos;s vehicle ({selectedService.vehicleName} — {selectedService.vehicleReg}) has arrived at the workshop. Verify intake details and proceed to Stage 3 (Inspection) to record diagnostic findings and repair items.
                                </p>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                                  <span className="text-slate-400 block text-[11px]">Customer &amp; Booking</span>
                                  <strong className="text-white text-sm">{selectedService.customerName}</strong>
                                  <span className="block text-indigo-400 font-mono mt-0.5">{selectedService.bookingCode}</span>
                                </div>
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                                  <span className="text-slate-400 block text-[11px]">Requested Service Type</span>
                                  <strong className="text-emerald-300 text-sm">{selectedService.serviceType}</strong>
                                  <span className="block text-slate-400 mt-0.5">{selectedService.preferredDate} • {selectedService.preferredSlot}</span>
                                </div>
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                                  <span className="text-slate-400 block text-[11px]">Customer Reported Issue</span>
                                  <strong className="text-slate-200">{selectedService.customerSymptoms}</strong>
                                </div>
                              </div>

                              <div className="flex justify-end pt-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateServiceStage(
                                      selectedService.id,
                                      { lifecycleStage: 'INSPECTION' },
                                      `Moved ${selectedService.bookingCode} to Stage 3: Technical Inspection`
                                    )
                                  }
                                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition"
                                >
                                  Start Technical Inspection (Move to Stage 3: Inspection) →
                                </button>
                              </div>
                            </div>
                          )}

                          {/* STAGE 3: INSPECTION — ADD INSPECTION DETAILS & REPAIR ISSUES LIST (VISIBLE TO CUSTOMER LIVE) */}
                          {selectedService.lifecycleStage === 'INSPECTION' && (
                            <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 space-y-5">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Stage 3 of 9 • Technical Inspection &amp; Diagnosis
                                  </span>
                                  <h4 className="text-base font-bold text-white mt-1">
                                    Record Inspection Findings &amp; Identified Repair Issues
                                  </h4>
                                  <p className="text-xs text-slate-400">
                                    Enter detailed inspection findings and add each repair issue below. When you click Upload/Update, the customer immediately sees your inspection report and repair list on their portal!
                                  </p>
                                </div>
                              </div>

                              {/* Inspection Notes Input */}
                              <div>
                                <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                                  1. Detailed Technical Inspection &amp; OBD-II Diagnostic Notes (Visible to Customer)
                                </label>
                                <textarea
                                  rows={3}
                                  value={mechNotesDraft}
                                  onChange={(e) => setMechNotesDraft(e.target.value)}
                                  placeholder="Describe what was found during multi-point inspection (e.g., worn front brake pads at 2.1mm, dirty throttle body, battery health 84%)..."
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                                />
                              </div>

                              {/* Add Identified Repair Issues / Tasks */}
                              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                                <label className="text-xs font-semibold text-amber-300 block">
                                  2. Identified Repair Issues / Tasks to Perform (Customer sees this list &amp; you will tick these off in Stage 6: Repair)
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={newRepairTaskTitle}
                                    onChange={(e) => setNewRepairTaskTitle(e.target.value)}
                                    placeholder="e.g., Replace Front Ceramic Brake Pads & Skim Discs / Clean Fuel Injectors"
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!newRepairTaskTitle.trim()) return;
                                      const currentTasks = Array.isArray(selectedService.repairTasks)
                                        ? selectedService.repairTasks
                                        : [];
                                      const nextTasks = [
                                        ...currentTasks,
                                        {
                                          id: Date.now(),
                                          title: newRepairTaskTitle.trim(),
                                          completed: false,
                                        },
                                      ];
                                      setNewRepairTaskTitle('');
                                      handleUpdateServiceStage(
                                        selectedService.id,
                                        {
                                          inspectionNotes: mechNotesDraft,
                                          repairTasks: nextTasks,
                                        },
                                        'Added repair issue to inspection list & synced with customer!'
                                      );
                                    }}
                                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg shrink-0"
                                  >
                                    + Add Repair Issue
                                  </button>
                                </div>

                                <div className="space-y-1.5 pt-1">
                                  {(selectedService.repairTasks || []).map((task, idx) => (
                                    <div
                                      key={task.id || idx}
                                      className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs"
                                    >
                                      <span className="text-slate-200 font-medium">
                                        {idx + 1}. {task.title}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextTasks = (selectedService.repairTasks || []).filter(
                                            (_, i) => i !== idx
                                          );
                                          handleUpdateServiceStage(
                                            selectedService.id,
                                            { repairTasks: nextTasks },
                                            'Removed repair issue from list'
                                          );
                                        }}
                                        className="text-rose-400 hover:text-rose-300 text-[11px] font-bold px-2"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateServiceStage(
                                      selectedService.id,
                                      { inspectionNotes: mechNotesDraft },
                                      'Inspection findings uploaded! Customer can now view them live.'
                                    )
                                  }
                                  className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition"
                                >
                                  Upload &amp; Update Inspection Details to Customer
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateServiceStage(
                                      selectedService.id,
                                      {
                                        inspectionNotes: mechNotesDraft,
                                        lifecycleStage: 'QUOTATION',
                                      },
                                      'Inspection uploaded! Moved to Stage 4: Quotation & Estimate Builder.'
                                    )
                                  }
                                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition"
                                >
                                  Save Inspection &amp; Proceed to Stage 4: Quotation →
                                </button>
                              </div>
                            </div>
                          )}

                          {/* STAGE 4: QUOTATION — SPARE PARTS, LABOUR & ESTIMATE BUILDER + SEND FOR APPROVAL */}
                          {selectedService.lifecycleStage === 'QUOTATION' && (
                            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-6">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Stage 4 of 9 • Quotation &amp; Estimate Builder
                                  </span>
                                  <h4 className="text-base font-bold text-white flex items-center gap-2 mt-1">
                                    <Package className="w-4 h-4 text-amber-400" />
                                    Add Spare Parts &amp; Costs and Send Estimate for Customer Approval
                                  </h4>
                                  <p className="text-xs text-slate-400">
                                    Add parts from inventory OR enter custom parts &amp; prices directly, then click &quot;Send Estimate for Customer Approval&quot; to move to Stage 5.
                                  </p>
                                </div>
                                <div className="bg-slate-900 border border-emerald-500/30 px-4 py-2 rounded-xl text-right">
                                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                                    Live Quotation Estimate (Incl. GST)
                                  </span>
                                  <span className="text-xl font-extrabold text-emerald-400">
                                    ₹{Number(selectedService.estimatedCost || 0).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>

                              {/* 1. ADD PART FROM EXISTING INVENTORY LIST */}
                              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                                <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                                  Option 1: Select Part from Workshop Inventory List
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                  <div className="sm:col-span-6 min-w-0">
                                    <label className="text-[11px] text-slate-400 block mb-1">
                                      Inventory Spare Part
                                    </label>
                                    <select
                                      value={partToAdd.partId}
                                      onChange={(e) => {
                                        const pid = Number(e.target.value);
                                        const found = inventory.find((p) => p.id === pid);
                                        setPartToAdd({
                                          ...partToAdd,
                                          partId: pid,
                                          unitPrice: found ? found.unitPrice : partToAdd.unitPrice,
                                        });
                                      }}
                                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white truncate"
                                    >
                                      {inventory.map((p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.partName} — ₹{p.unitPrice} ({p.stockQuantity} in stock)
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="sm:col-span-2">
                                    <label className="text-[11px] text-slate-400 block mb-1">Qty</label>
                                    <input
                                      type="number"
                                      min={1}
                                      max={20}
                                      value={partToAdd.quantity}
                                      onChange={(e) =>
                                        setPartToAdd({ ...partToAdd, quantity: Math.max(1, Number(e.target.value)) })
                                      }
                                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white text-center"
                                    />
                                  </div>

                                  <div className="sm:col-span-2">
                                    <label className="text-[11px] text-slate-400 block mb-1">Unit Price (₹)</label>
                                    <input
                                      type="number"
                                      min={0}
                                      value={partToAdd.unitPrice}
                                      onChange={(e) =>
                                        setPartToAdd({ ...partToAdd, unitPrice: Number(e.target.value) })
                                      }
                                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                                    />
                                  </div>

                                  <div className="sm:col-span-2">
                                    <button
                                      type="button"
                                      onClick={() => handleAddPartToService(selectedService.id)}
                                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-3 rounded-lg transition shadow-md"
                                    >
                                      + Add Part
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* 2. ADD CUSTOM PART / WORK ITEM & PRICE MANUALLY BY MECHANIC */}
                              <form
                                onSubmit={(e) => handleAddCustomPartToService(e, selectedService.id)}
                                className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3"
                              >
                                <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
                                  Option 2: Enter Custom Part / Repair Item &amp; Price Yourself
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                  <div className="sm:col-span-6">
                                    <label className="text-[11px] text-slate-400 block mb-1">
                                      Custom Part Name or Repair Work Description
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Maruti Brezza Wiper Blade Set / AC Gas Top-up / Wheel Alignment"
                                      value={customPartForm.customPartName}
                                      onChange={(e) =>
                                        setCustomPartForm({ ...customPartForm, customPartName: e.target.value })
                                      }
                                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                                    />
                                  </div>

                                  <div className="sm:col-span-2">
                                    <label className="text-[11px] text-slate-400 block mb-1">Qty</label>
                                    <input
                                      type="number"
                                      min={1}
                                      value={customPartForm.quantity}
                                      onChange={(e) =>
                                        setCustomPartForm({
                                          ...customPartForm,
                                          quantity: Math.max(1, Number(e.target.value)),
                                        })
                                      }
                                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white text-center"
                                    />
                                  </div>

                                  <div className="sm:col-span-2">
                                    <label className="text-[11px] text-slate-400 block mb-1">Unit Price (₹)</label>
                                    <input
                                      type="number"
                                      min={0}
                                      placeholder="e.g. 1200"
                                      value={customPartForm.unitPrice}
                                      onChange={(e) =>
                                        setCustomPartForm({ ...customPartForm, unitPrice: e.target.value })
                                      }
                                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                                    />
                                  </div>

                                  <div className="sm:col-span-2">
                                    <button
                                      type="submit"
                                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-3 rounded-lg transition shadow-md"
                                    >
                                      + Add Custom
                                    </button>
                                  </div>
                                </div>
                              </form>

                              {/* 3. MULTI-PART ITEMIZED LIST TABLE */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                    Added Spare Parts &amp; Items on This Job Card ({(selectedService.usedParts || []).length})
                                  </span>
                                  <span className="text-xs font-bold text-emerald-400">
                                    Parts Subtotal: ₹
                                    {(selectedService.usedParts || [])
                                      .reduce((s, p) => s + Number(p.quantity) * Number(p.unitPrice), 0)
                                      .toLocaleString('en-IN')}
                                  </span>
                                </div>

                                {(selectedService.usedParts || []).length === 0 ? (
                                  <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-4 text-center text-xs text-slate-500">
                                    No parts added yet. Use Option 1 (Inventory List) or Option 2 (Custom Part &amp; Price) above to add multiple parts.
                                  </div>
                                ) : (
                                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-xs">
                                      <thead className="bg-slate-900 text-slate-400">
                                        <tr>
                                          <th className="py-2.5 px-3">Part / Item Name</th>
                                          <th className="py-2.5 px-3 text-center">Qty</th>
                                          <th className="py-2.5 px-3 text-right">Unit Price (₹)</th>
                                          <th className="py-2.5 px-3 text-right">Line Total</th>
                                          <th className="py-2.5 px-3 text-center">Remove</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-800 bg-slate-950/60">
                                        {(selectedService.usedParts || []).map((up, idx) => (
                                          <tr key={idx}>
                                            <td className="py-2.5 px-3 font-medium text-white">
                                              {up.partName}{' '}
                                              <span className="text-[10px] text-slate-500 font-mono">
                                                ({up.isCustom ? 'CUSTOM' : up.sku})
                                              </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                              <div className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-0.5">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const next = [...selectedService.usedParts];
                                                    if (next[idx].quantity > 1) {
                                                      next[idx] = { ...next[idx], quantity: next[idx].quantity - 1 };
                                                      handleUpdateUsedPartsList(
                                                        selectedService.id,
                                                        next,
                                                        'Decreased part quantity'
                                                      );
                                                    }
                                                  }}
                                                  className="text-slate-400 hover:text-white px-1 font-bold"
                                                >
                                                  -
                                                </button>
                                                <span className="font-bold text-white px-1">{up.quantity}</span>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const next = [...selectedService.usedParts];
                                                    next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
                                                    handleUpdateUsedPartsList(
                                                      selectedService.id,
                                                      next,
                                                      'Increased part quantity'
                                                    );
                                                  }}
                                                  className="text-slate-400 hover:text-white px-1 font-bold"
                                                >
                                                  +
                                                </button>
                                              </div>
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                              <input
                                                type="number"
                                                min={0}
                                                value={up.unitPrice}
                                                onChange={(e) => {
                                                  const next = [...selectedService.usedParts];
                                                  next[idx] = { ...next[idx], unitPrice: Number(e.target.value) };
                                                  handleUpdateUsedPartsList(
                                                    selectedService.id,
                                                    next,
                                                    'Updated part unit price!'
                                                  );
                                                }}
                                                className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-xs text-white"
                                              />
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                                              ₹{(Number(up.quantity) * Number(up.unitPrice)).toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const next = selectedService.usedParts.filter((_, i) => i !== idx);
                                                  handleUpdateUsedPartsList(
                                                    selectedService.id,
                                                    next,
                                                    'Removed part from estimate'
                                                  );
                                                }}
                                                className="text-rose-400 hover:text-rose-300 font-bold px-2 py-0.5 rounded hover:bg-rose-500/10"
                                              >
                                                ✕
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>

                              {/* 4. LABOUR CHARGES & CUSTOM ESTIMATE OVERRIDE */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                                <div>
                                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                                    Labour Hours Logged
                                  </label>
                                  <input
                                    type="number"
                                    step="0.5"
                                    min={0}
                                    value={selectedService.labourHours}
                                    onChange={(e) =>
                                      handleUpdateServiceStage(
                                        selectedService.id,
                                        { labourHours: e.target.value, manualEstimateTotal: null },
                                        'Labour hours updated!'
                                      )
                                    }
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                                  />
                                </div>

                                <div>
                                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                                    Labour Rate per Hour (₹/hr)
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={selectedService.labourRate || 450}
                                    onChange={(e) =>
                                      handleUpdateServiceStage(
                                        selectedService.id,
                                        { labourRate: e.target.value, manualEstimateTotal: null },
                                        'Labour rate updated!'
                                      )
                                    }
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                                  />
                                </div>

                                <div>
                                  <label className="text-[11px] font-semibold text-amber-300 block mb-1">
                                    Or Set Custom Total Estimate (₹)
                                  </label>
                                  <div className="flex gap-2">
                                    <input
                                      type="number"
                                      min={0}
                                      placeholder="Auto-summed if blank"
                                      value={manualEstimateInput}
                                      onChange={(e) => setManualEstimateInput(e.target.value)}
                                      className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-2 text-xs text-white"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateServiceStage(
                                          selectedService.id,
                                          {
                                            manualEstimateTotal:
                                              manualEstimateInput === '' ? null : Number(manualEstimateInput),
                                          },
                                          manualEstimateInput === ''
                                            ? 'Reverted to automatic Parts + Labour + GST sum!'
                                            : `Custom estimate ₹${manualEstimateInput} applied!`
                                        )
                                      }
                                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-lg shrink-0"
                                    >
                                      Set
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Live Breakdown Footer & Send for Customer Approval Button */}
                              {(() => {
                                const partsSum = (selectedService.usedParts || []).reduce(
                                  (s, p) => s + Number(p.quantity) * Number(p.unitPrice),
                                  0
                                );
                                const labourSum = Math.round(
                                  (Number(selectedService.labourHours) || 0) *
                                    (Number(selectedService.labourRate) || 450)
                                );
                                const gstSum = Math.round((partsSum + labourSum) * 0.18);
                                return (
                                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800 text-xs">
                                    <div className="flex flex-wrap items-center gap-4 text-slate-300">
                                      <span>
                                        Parts: <strong className="text-white">₹{partsSum.toLocaleString('en-IN')}</strong>
                                      </span>
                                      <span>+</span>
                                      <span>
                                        Labour: <strong className="text-white">₹{labourSum.toLocaleString('en-IN')}</strong>
                                      </span>
                                      <span>+</span>
                                      <span>
                                        18% GST: <strong className="text-white">₹{gstSum.toLocaleString('en-IN')}</strong>
                                      </span>
                                      <span>=</span>
                                      <span className="text-sm font-extrabold text-emerald-400">
                                        Total Estimate: ₹{Number(selectedService.estimatedCost).toLocaleString('en-IN')}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateServiceStage(
                                          selectedService.id,
                                          {
                                            lifecycleStage: 'APPROVAL',
                                            quotationApproved: false,
                                          },
                                          `Estimate of ₹${Number(selectedService.estimatedCost).toLocaleString('en-IN')} sent to Customer! Now awaiting Customer Approval.`
                                        )
                                      }
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20"
                                    >
                                      Send Estimate &amp; Request Customer Approval (Stage 5) →
                                    </button>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* STAGE 5: APPROVAL — STRICT CUSTOMER QUOTATION APPROVAL GATE */}
                          {selectedService.lifecycleStage === 'APPROVAL' && (
                            <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-6 space-y-5">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Stage 5 of 9 • Customer Quotation Approval Gate
                                  </span>
                                  <h4 className="text-base font-bold text-white mt-1">
                                    Quotation Estimate Approval Status
                                  </h4>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block uppercase">Quoted Total</span>
                                  <span className="text-xl font-extrabold text-emerald-400">
                                    ₹{Number(selectedService.estimatedCost).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>

                              {!selectedService.quotationApproved ? (
                                <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-6 text-center space-y-3">
                                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-2xl">
                                    ⏳
                                  </div>
                                  <h5 className="text-base font-extrabold text-amber-300">
                                    AWAITING CUSTOMER QUOTATION APPROVAL
                                  </h5>
                                  <p className="text-xs text-slate-300 max-w-xl mx-auto">
                                    The quotation of{' '}
                                    <strong className="text-white">
                                      ₹{Number(selectedService.estimatedCost).toLocaleString('en-IN')}
                                    </strong>{' '}
                                    has been sent to <strong className="text-white">{selectedService.customerName}</strong>.
                                    <br />
                                    <span className="text-amber-200 font-semibold">
                                      🔒 Repair, QC Check, Payment, and Delivery stages are locked until the customer approves this quotation on the Customer Portal.
                                    </span>
                                  </p>
                                  <div className="pt-2 flex justify-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateServiceStage(
                                          selectedService.id,
                                          { lifecycleStage: 'QUOTATION' },
                                          'Returned to Stage 4 to revise Quotation Estimate'
                                        )
                                      }
                                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-2 rounded-xl border border-slate-700"
                                    >
                                      ← Edit / Revise Quotation Parts
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-emerald-500/10 border-2 border-emerald-500/40 rounded-2xl p-6 text-center space-y-3">
                                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-2xl">
                                    ✅
                                  </div>
                                  <h5 className="text-base font-extrabold text-emerald-300">
                                    CUSTOMER APPROVED THE QUOTATION!
                                  </h5>
                                  <p className="text-xs text-slate-300 max-w-xl mx-auto">
                                    <strong className="text-white">{selectedService.customerName}</strong> has approved the estimate of{' '}
                                    <strong className="text-emerald-400">
                                      ₹{Number(selectedService.estimatedCost).toLocaleString('en-IN')}
                                    </strong>
                                    . You are now authorized to move forward to Stage 6 (Service &amp; Repair).
                                  </p>
                                  <div className="pt-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateServiceStage(
                                          selectedService.id,
                                          { lifecycleStage: 'SERVICE_REPAIR' },
                                          `Moved ${selectedService.bookingCode} to Stage 6: Service & Repair!`
                                        )
                                      }
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg transition"
                                    >
                                      Proceed to Stage 6: Service &amp; Repair →
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* STAGE 6: SERVICE & REPAIR — INTERACTIVE REPAIR ISSUE CHECKLIST */}
                          {selectedService.lifecycleStage === 'SERVICE_REPAIR' && (
                            <div className="bg-slate-950 border border-blue-500/30 rounded-2xl p-5 space-y-5">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    Stage 6 of 9 • Active Vehicle Repair &amp; Service
                                  </span>
                                  <h4 className="text-base font-bold text-white mt-1">
                                    Repair Execution Checklist — Tick Off Each Issue as Repaired
                                  </h4>
                                  <p className="text-xs text-slate-400">
                                    Check off each repair task as you complete it on the vehicle. Your progress updates live on the Customer Portal!
                                  </p>
                                </div>
                                <div className="bg-slate-900 border border-blue-500/30 px-3.5 py-2 rounded-xl text-right">
                                  <span className="text-[10px] text-slate-400 block uppercase">Repair Progress</span>
                                  <span className="text-sm font-extrabold text-blue-400">
                                    {(selectedService.repairTasks || []).filter((t) => t.completed).length} /{' '}
                                    {(selectedService.repairTasks || []).length} Completed
                                  </span>
                                </div>
                              </div>

                              {/* Interactive Checklist of Repair Issues */}
                              <div className="space-y-2">
                                {(selectedService.repairTasks || []).map((task, idx) => (
                                  <label
                                    key={task.id || idx}
                                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                                      task.completed
                                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                                        : 'bg-slate-900 border-slate-800 text-white hover:border-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(task.completed)}
                                        onChange={() => {
                                          const nextTasks = (selectedService.repairTasks || []).map((t, i) =>
                                            i === idx ? { ...t, completed: !t.completed } : t
                                          );
                                          handleUpdateServiceStage(
                                            selectedService.id,
                                            { repairTasks: nextTasks },
                                            `Repair task "${task.title}" marked as ${!task.completed ? 'COMPLETED' : 'IN PROGRESS'}!`
                                          );
                                        }}
                                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                                      />
                                      <span className={`text-xs font-semibold ${task.completed ? 'line-through text-emerald-300' : 'text-white'}`}>
                                        {idx + 1}. {task.title}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                        task.completed
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      }`}
                                    >
                                      {task.completed ? '✓ REPAIRED' : 'PENDING REPAIR'}
                                    </span>
                                  </label>
                                ))}
                              </div>

                              {/* Add Extra Repair Task if Needed */}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newRepairTaskTitle}
                                  onChange={(e) => setNewRepairTaskTitle(e.target.value)}
                                  placeholder="Add another repair item to checklist..."
                                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newRepairTaskTitle.trim()) return;
                                    const nextTasks = [
                                      ...(selectedService.repairTasks || []),
                                      { id: Date.now(), title: newRepairTaskTitle.trim(), completed: false },
                                    ];
                                    setNewRepairTaskTitle('');
                                    handleUpdateServiceStage(
                                      selectedService.id,
                                      { repairTasks: nextTasks },
                                      'Added repair task to checklist!'
                                    );
                                  }}
                                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-lg border border-slate-700"
                                >
                                  + Add Issue
                                </button>
                              </div>

                              <div className="flex justify-end pt-2 border-t border-slate-800">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateServiceStage(
                                      selectedService.id,
                                      { lifecycleStage: 'QUALITY_CHECK' },
                                      `Repairs completed for ${selectedService.bookingCode}! Moved to Stage 7: Quality Check (QC).`
                                    )
                                  }
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition"
                                >
                                  All Repairs Done — Proceed to Stage 7: QC Check →
                                </button>
                              </div>
                            </div>
                          )}

                          {/* STAGE 7: QUALITY CHECK (QC) — MULTI-POINT QC CHECKLIST & FINAL REPORT */}
                          {selectedService.lifecycleStage === 'QUALITY_CHECK' && (
                            <div className="bg-slate-950 border border-purple-500/30 rounded-2xl p-5 space-y-5">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    Stage 7 of 9 • Quality Check (QC) &amp; Road Test
                                  </span>
                                  <h4 className="text-base font-bold text-white mt-1">
                                    Multi-Point Quality Assurance Checklist
                                  </h4>
                                  <p className="text-xs text-slate-400">
                                    Tick off each QC checkpoint once verified on the car, record the Final Service Report, and send the Payment Request to the customer.
                                  </p>
                                </div>
                                <div className="bg-slate-900 border border-purple-500/30 px-3.5 py-2 rounded-xl text-right">
                                  <span className="text-[10px] text-slate-400 block uppercase">QC Checkpoints Passed</span>
                                  <span className="text-sm font-extrabold text-purple-300">
                                    {(selectedService.qcChecklist || []).filter((q) => q.passed).length} /{' '}
                                    {(selectedService.qcChecklist || []).length} Passed
                                  </span>
                                </div>
                              </div>

                              {/* Interactive QC Checkpoints */}
                              <div className="space-y-2">
                                {(selectedService.qcChecklist || []).map((qc, idx) => (
                                  <label
                                    key={qc.id || idx}
                                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                                      qc.passed
                                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                                        : 'bg-slate-900 border-slate-800 text-white hover:border-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(qc.passed)}
                                        onChange={() => {
                                          const nextQc = (selectedService.qcChecklist || []).map((item, i) =>
                                            i === idx ? { ...item, passed: !item.passed } : item
                                          );
                                          handleUpdateServiceStage(
                                            selectedService.id,
                                            { qcChecklist: nextQc },
                                            `QC Point "${qc.label}" marked as ${!qc.passed ? 'PASSED' : 'PENDING'}!`
                                          );
                                        }}
                                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                                      />
                                      <span className="text-xs font-semibold">
                                        QC #{idx + 1}: {qc.label}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                        qc.passed
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                          : 'bg-slate-800 text-slate-400'
                                      }`}
                                    >
                                      {qc.passed ? '✓ PASSED' : 'NOT CHECKED'}
                                    </span>
                                  </label>
                                ))}
                              </div>

                              {/* Add custom QC point */}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newQcPointLabel}
                                  onChange={(e) => setNewQcPointLabel(e.target.value)}
                                  placeholder="Add custom QC inspection point..."
                                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newQcPointLabel.trim()) return;
                                    const nextQc = [
                                      ...(selectedService.qcChecklist || []),
                                      { id: Date.now(), label: newQcPointLabel.trim(), passed: true },
                                    ];
                                    setNewQcPointLabel('');
                                    handleUpdateServiceStage(
                                      selectedService.id,
                                      { qcChecklist: nextQc },
                                      'Added QC checkpoint!'
                                    );
                                  }}
                                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-lg border border-slate-700"
                                >
                                  + Add QC Point
                                </button>
                              </div>

                              {/* Final Service & Quality Check Report */}
                              <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                                  Final Service &amp; Quality Check Report (Shared with Customer)
                                </label>
                                <textarea
                                  rows={3}
                                  value={mechReportDraft}
                                  onChange={(e) => setMechReportDraft(e.target.value)}
                                  placeholder="Record road-test results, wheel torque verification, fluid top-ups, and final QC sign-off..."
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200"
                                />
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateServiceStage(
                                      selectedService.id,
                                      { serviceReport: mechReportDraft },
                                      'QC Report saved!'
                                    )
                                  }
                                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700"
                                >
                                  Save QC Report
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateServiceStage(
                                      selectedService.id,
                                      {
                                        serviceReport: mechReportDraft,
                                        lifecycleStage: 'PAYMENT',
                                        paymentRequested: true,
                                      },
                                      `QC Passed! Payment request of ₹${Number(selectedService.estimatedCost).toLocaleString('en-IN')} sent to Customer.`
                                    )
                                  }
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition"
                                >
                                  QC Passed — Send Payment Request to Customer (Stage 8) →
                                </button>
                              </div>
                            </div>
                          )}

                          {/* STAGE 8: PAYMENT — REQUEST CUSTOMER PAYMENT & PAYMENT GATE */}
                          {selectedService.lifecycleStage === 'PAYMENT' && (
                            <div className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-6 space-y-5">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    Stage 8 of 9 • Digital Invoice &amp; Customer Payment
                                  </span>
                                  <h4 className="text-base font-bold text-white mt-1">
                                    Customer Billing &amp; Payment Verification
                                  </h4>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block uppercase">Final Invoice Amount</span>
                                  <span className="text-xl font-extrabold text-emerald-400">
                                    ₹{Number(selectedService.estimatedCost).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>

                              {selectedService.paymentStatus !== 'PAID' ? (
                                <div className="bg-indigo-500/10 border-2 border-indigo-500/40 rounded-2xl p-6 text-center space-y-3">
                                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center mx-auto text-2xl">
                                    💳
                                  </div>
                                  <h5 className="text-base font-extrabold text-indigo-300">
                                    {selectedService.paymentRequested
                                      ? 'PAYMENT REQUEST SENT — AWAITING CUSTOMER PAYMENT'
                                      : 'SEND PAYMENT REQUEST TO CUSTOMER'}
                                  </h5>
                                  <p className="text-xs text-slate-300 max-w-xl mx-auto">
                                    Final invoice of{' '}
                                    <strong className="text-white">
                                      ₹{Number(selectedService.estimatedCost).toLocaleString('en-IN')}
                                    </strong>{' '}
                                    is ready for <strong className="text-white">{selectedService.customerName}</strong>.
                                    <br />
                                    <span className="text-amber-300 font-semibold">
                                      🔒 Stage 9 (Delivery) is locked until the customer completes payment on the Customer Portal.
                                    </span>
                                  </p>
                                  <div className="pt-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateServiceStage(
                                          selectedService.id,
                                          { paymentRequested: true },
                                          `Payment request of ₹${Number(selectedService.estimatedCost).toLocaleString('en-IN')} sent to ${selectedService.customerName}!`
                                        )
                                      }
                                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition"
                                    >
                                      {selectedService.paymentRequested
                                        ? '🔔 Re-Send Payment Request Notification to Customer'
                                        : '💳 Send Payment Request to Customer Now'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-emerald-500/10 border-2 border-emerald-500/40 rounded-2xl p-6 text-center space-y-3">
                                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-2xl">
                                    ✅
                                  </div>
                                  <h5 className="text-base font-extrabold text-emerald-300">
                                    INVOICE PAYMENT RECEIVED (₹{Number(selectedService.estimatedCost).toLocaleString('en-IN')})
                                  </h5>
                                  <p className="text-xs text-slate-300 max-w-xl mx-auto">
                                    Customer <strong className="text-white">{selectedService.customerName}</strong> has paid the invoice in full. You can now move to the final Delivery stage!
                                  </p>
                                  <div className="pt-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateServiceStage(
                                          selectedService.id,
                                          { lifecycleStage: 'DELIVERY' },
                                          `Moved ${selectedService.bookingCode} to Stage 9: Vehicle Delivery!`
                                        )
                                      }
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg transition"
                                    >
                                      Proceed to Stage 9: Vehicle Delivery →
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* STAGE 9: DELIVERY — UPDATE CUSTOMER THAT CAR IS READY FOR DELIVERY */}
                          {selectedService.lifecycleStage === 'DELIVERY' && (
                            <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-6 space-y-5">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Stage 9 of 9 • Vehicle Handover &amp; Delivery
                                  </span>
                                  <h4 className="text-base font-bold text-white mt-1">
                                    Notify Customer: Vehicle is Repaired &amp; Ready for Delivery
                                  </h4>
                                  <p className="text-xs text-slate-400">
                                    Send the final delivery readiness update and handover instructions to the customer.
                                  </p>
                                </div>
                                <span
                                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                                    selectedService.deliveryReady
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  }`}
                                >
                                  {selectedService.deliveryReady ? '🚗 READY FOR DELIVERY SENT' : 'PENDING HANDOVER UPDATE'}
                                </span>
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                                  Delivery Handover Message / Gate Pass Note for Customer
                                </label>
                                <textarea
                                  rows={3}
                                  value={deliveryNoteDraft}
                                  onChange={(e) => setDeliveryNoteDraft(e.target.value)}
                                  placeholder="e.g., Your car has been washed, sanitized, and parked at Delivery Bay 1. Keys are ready at the service desk!"
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                                />
                              </div>

                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateServiceStage(
                                      selectedService.id,
                                      {
                                        lifecycleStage: 'DELIVERY',
                                        deliveryReady: true,
                                        deliveryNote:
                                          deliveryNoteDraft ||
                                          'Your car has completed all repairs and quality checks and is ready for delivery!',
                                      },
                                      `Customer ${selectedService.customerName} notified that ${selectedService.vehicleName} is repaired & ready for delivery!`
                                    )
                                  }
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition"
                                >
                                  🚗 Update Customer: Car is Repaired &amp; Ready for Delivery
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 3. ADMINISTRATOR DASHBOARD (REAL-TIME VEHICLES, BOOKINGS, DB) */}
            {/* ------------------------------------------------------------- */}
            {activeRole === 'ADMIN' && (
              <div className="space-y-6">
                {/* Admin Console Operations Banner with Direct Vehicle Registration & Repair Scheduling */}
                <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Administrator Control Center • Full Workshop &amp; Database Authority
                    </span>
                    <h2 className="text-2xl font-bold text-white mt-0.5">
                      Operations Console — {currentUser?.fullName}
                    </h2>
                    <p className="text-xs text-slate-300 mt-1">
                      Register customer vehicles, schedule &amp; dispatch service repairs, manage mechanic workload distribution, and control OEM spare parts restocking.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowVehicleModal(true)}
                      className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" />
                      Register Vehicle
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBookingModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
                    >
                      <Calendar className="w-4 h-4" />
                      Schedule Service / Repair
                    </button>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <span className="text-xs text-slate-400">Collected Service Revenue</span>
                    <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                      ₹{analytics.totalRevenue.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      + ₹{analytics.pendingBilling.toLocaleString('en-IN')} in active billing pipeline
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <span className="text-xs text-slate-400">Customer Vehicles &amp; Repairs</span>
                    <div className="text-2xl font-extrabold text-blue-400 mt-1">
                      {vehicles.length} Vehicles • {services.length} Jobs
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Real-time customer registrations
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <span className="text-xs text-slate-400">Low-Stock Inventory Alerts</span>
                    <div className="text-2xl font-extrabold text-amber-400 mt-1">
                      {analytics.lowStockCount} SKUs
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Out of {inventory.length} tracked OEM spare parts
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <span className="text-xs text-slate-400">Registered System Users</span>
                    <div className="text-2xl font-extrabold text-purple-400 mt-1 flex items-center gap-1.5">
                      {users.length} Users
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Stored in SQLite relational database
                    </span>
                  </div>
                </div>

                {/* Live Customer Service Bookings & Mechanic Dispatch Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-blue-400" />
                      Real-Time Workshop Service Bookings &amp; Mechanic Dispatch ({services.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowBookingModal(true)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Schedule New Repair
                    </button>
                  </div>
                  {services.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4">
                      No service bookings yet. Click &quot;Schedule New Repair&quot; above or book from the Customer/Mechanic console.
                    </p>
                  ) : (
                    <div className="overflow-x-auto border border-slate-800 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400">
                          <tr>
                            <th className="py-3 px-4">Booking Code</th>
                            <th className="py-3 px-4">Customer &amp; Vehicle</th>
                            <th className="py-3 px-4">Service Type &amp; Symptoms</th>
                            <th className="py-3 px-4">Assigned Mechanic</th>
                            <th className="py-3 px-4">Lifecycle Stage</th>
                            <th className="py-3 px-4 text-right">Est. Billing</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {services.map((sr) => (
                            <tr key={sr.id}>
                              <td className="py-3 px-4 font-mono font-bold text-indigo-400">{sr.bookingCode}</td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-white">{sr.vehicleName} ({sr.vehicleReg})</div>
                                <div className="text-slate-400">
                                  Owner: <strong className="text-slate-200">{sr.customerName}</strong>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-slate-200 font-medium">{sr.serviceType}</div>
                                <div className="text-slate-400 text-[11px]">{sr.customerSymptoms}</div>
                              </td>
                              <td className="py-3 px-4">
                                <select
                                  value={sr.mechanicId}
                                  onChange={(e) =>
                                    handleUpdateServiceStage(
                                      sr.id,
                                      { mechanicId: Number(e.target.value) },
                                      `Reassigned ${sr.bookingCode} to mechanic!`
                                    )
                                  }
                                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                                >
                                  {users
                                    .filter((u) => u.role === 'MECHANIC')
                                    .map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {m.fullName}
                                      </option>
                                    ))}
                                </select>
                              </td>
                              <td className="py-3 px-4">
                                <select
                                  value={sr.lifecycleStage}
                                  onChange={(e) =>
                                    handleUpdateServiceStage(
                                      sr.id,
                                      { lifecycleStage: e.target.value },
                                      `Updated ${sr.bookingCode} stage to ${e.target.value}`
                                    )
                                  }
                                  className="bg-slate-950 border border-blue-500/40 rounded-lg px-2.5 py-1 text-xs text-blue-300 font-semibold"
                                >
                                  {LIFECYCLE_STAGES.map((st) => (
                                    <option key={st.key} value={st.key}>
                                      {st.short}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-emerald-400">
                                ₹{Number(sr.estimatedCost).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Live Customer Vehicles Registered Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Car className="w-5 h-5 text-emerald-400" />
                      Real-Time Registered Customer Vehicles ({vehicles.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowVehicleModal(true)}
                      className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      Register New Vehicle
                    </button>
                  </div>
                  {vehicles.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4">
                      No customer vehicles registered yet. When a vehicle is registered, it appears here live.
                    </p>
                  ) : (
                    <div className="overflow-x-auto border border-slate-800 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400">
                          <tr>
                            <th className="py-3 px-4">Registration No</th>
                            <th className="py-3 px-4">Vehicle Make &amp; Model</th>
                            <th className="py-3 px-4">Customer / Owner</th>
                            <th className="py-3 px-4">Fuel &amp; Mileage</th>
                            <th className="py-3 px-4">Insurance Expiry</th>
                            <th className="py-3 px-4">PUC Expiry</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {vehicles.map((v) => (
                            <tr key={v.id}>
                              <td className="py-3 px-4 font-mono font-bold text-blue-400">{v.registrationNumber}</td>
                              <td className="py-3 px-4 font-semibold text-white">
                                {v.make} {v.model} ({v.manufacturingYear})
                              </td>
                              <td className="py-3 px-4 text-slate-300">{v.ownerName}</td>
                              <td className="py-3 px-4 text-slate-300">
                                {v.fuelType} • {Number(v.currentMileage).toLocaleString()} km
                              </td>
                              <td className="py-3 px-4 text-amber-300">{v.insuranceExpiry}</td>
                              <td className="py-3 px-4 text-rose-300">{v.pucExpiry}</td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBookingForm((prev) => ({ ...prev, vehicleId: v.id }));
                                    setShowBookingModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 font-semibold text-[11px] transition"
                                >
                                  + Schedule Service
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Registered Users Table (Shows newly registered Customers, Mechanics & Admins!) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-400" />
                      Registered System Users (Stored in SQLite Database)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Every Customer, Mechanic, and Admin login account stored in <code>smart_vehicle.sqlite</code>.
                    </p>
                  </div>

                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400">
                        <tr>
                          <th className="py-3 px-4">ID</th>
                          <th className="py-3 px-4">Full Name</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Phone</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Specialization / Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-950/50">
                            <td className="py-3 px-4 font-mono text-slate-400">#{u.id}</td>
                            <td className="py-3 px-4 font-semibold text-white">{u.fullName}</td>
                            <td className="py-3 px-4 text-blue-400">{u.email}</td>
                            <td className="py-3 px-4 text-slate-300">{u.phone}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  u.role === 'ADMIN'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : u.role === 'MECHANIC'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400">{u.specialization}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Spare Parts Inventory Management Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-emerald-400" />
                        Spare Parts Inventory &amp; Automated Reorder Control
                      </h3>
                      <p className="text-xs text-slate-400">
                        Enter a custom restock quantity or use the quick action button to replenish stock in real time.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRunSchedulerScan}
                        className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        Trigger Expiry &amp; Stock Scan
                      </button>
                      <button
                        onClick={() => setShowPartModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Add New Part SKU
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400">
                        <tr>
                          <th className="py-3 px-4">SKU</th>
                          <th className="py-3 px-4">Part Name</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Supplier</th>
                          <th className="py-3 px-4 text-right">Unit Price</th>
                          <th className="py-3 px-4 text-center">Stock Status</th>
                          <th className="py-3 px-4 text-right">Custom Restock Qty &amp; Quick Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {inventory.map((part) => {
                          const isLow = part.stockQuantity <= part.reorderLevel;
                          const customQty = restockAmounts[part.id] ?? 25;
                          return (
                            <tr key={part.id} className="hover:bg-slate-950/50">
                              <td className="py-3 px-4 font-mono font-bold text-blue-400">{part.sku}</td>
                              <td className="py-3 px-4 font-semibold text-white">{part.partName}</td>
                              <td className="py-3 px-4 text-slate-400">{part.category}</td>
                              <td className="py-3 px-4 text-slate-400">{part.supplier}</td>
                              <td className="py-3 px-4 text-right font-bold text-slate-200">
                                ₹{Number(part.unitPrice).toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                    isLow
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                >
                                  {part.stockQuantity} units {isLow ? '(LOW STOCK)' : ''}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center justify-end gap-1.5">
                                  <input
                                    type="number"
                                    min={1}
                                    max={500}
                                    value={customQty}
                                    onChange={(e) =>
                                      setRestockAmounts((prev) => ({
                                        ...prev,
                                        [part.id]: Math.max(1, Number(e.target.value)),
                                      }))
                                    }
                                    className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center text-xs text-white"
                                    title="Enter custom restock quantity"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRestockPart(part, Math.max(1, Number(customQty)))}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition"
                                  >
                                    +{customQty} Restock
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRestockPart(part, 10)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white text-[11px] font-semibold border border-slate-700 transition"
                                    title="Quick +10 units restock"
                                  >
                                    +10 Quick
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* =================================================================== */}
      {/* MODAL: REGISTER NEW VEHICLE (SUPPORTS CUSTOMER, MECHANIC & ADMIN)   */}
      {/* =================================================================== */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-400" />
                Register Vehicle &amp; Compliance Dates
              </h3>
              <button
                onClick={() => setShowVehicleModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateVehicle} className="space-y-3 text-xs">
              {/* When Mechanic or Admin opens this modal, allow selecting which Customer owns the car */}
              {activeRole !== 'CUSTOMER' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div>
                    <label className="text-amber-300 font-semibold block mb-1">
                      Assign to Registered Customer
                    </label>
                    <select
                      value={
                        vehicleForm.ownerId ||
                        users.filter((u) => u.role === 'CUSTOMER').slice(-1)[0]?.id ||
                        ''
                      }
                      onChange={(e) =>
                        setVehicleForm({ ...vehicleForm, ownerId: Number(e.target.value) })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
                    >
                      {users
                        .filter((u) => u.role === 'CUSTOMER')
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.fullName} ({c.email})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">
                      Or Walk-In Customer Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Leave blank to use selected customer"
                      value={vehicleForm.customOwnerName || ''}
                      onChange={(e) =>
                        setVehicleForm({ ...vehicleForm, customOwnerName: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Registration Number *</label>
                  <input
                    required
                    placeholder="TS-08-AB-1234"
                    value={vehicleForm.registrationNumber}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, registrationNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Fuel Type</label>
                  <select
                    value={vehicleForm.fuelType}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, fuelType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="PETROL">PETROL</option>
                    <option value="DIESEL">DIESEL</option>
                    <option value="ELECTRIC">ELECTRIC</option>
                    <option value="HYBRID">HYBRID</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Make *</label>
                  <input
                    required
                    value={vehicleForm.make}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Model *</label>
                  <input
                    required
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Current Mileage (km)</label>
                  <input
                    type="number"
                    value={vehicleForm.currentMileage}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, currentMileage: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Manufacturing Year</label>
                  <input
                    type="number"
                    value={vehicleForm.manufacturingYear}
                    onChange={(e) =>
                      setVehicleForm({ ...vehicleForm, manufacturingYear: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Insurance Expiry Date</label>
                  <input
                    type="date"
                    value={vehicleForm.insuranceExpiry}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, insuranceExpiry: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">PUC Expiry Date</label>
                  <input
                    type="date"
                    value={vehicleForm.pucExpiry}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, pucExpiry: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: BOOK SERVICE APPOINTMENT (WITH OPTIONAL PREFERRED MECHANIC)  */}
      {/* =================================================================== */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Schedule / Book Service Appointment
                </h3>
                <p className="text-[11px] text-slate-400">
                  Available across Customer, Mechanic &amp; Administrator consoles
                </p>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateBooking} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Select Registered Vehicle *</label>
                <select
                  required
                  value={bookingForm.vehicleId}
                  onChange={(e) => setBookingForm({ ...bookingForm, vehicleId: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  {myVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} ({v.registrationNumber}) — Owner: {v.ownerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Service Type / Package</label>
                <select
                  value={bookingForm.serviceType}
                  onChange={(e) => setBookingForm({ ...bookingForm, serviceType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="Comprehensive Periodic Service (10,000 km)">
                    Comprehensive Periodic Service (10,000 km)
                  </option>
                  <option value="Brake Pad & Rotor Safety Inspection">
                    Brake Pad &amp; Rotor Safety Inspection
                  </option>
                  <option value="Engine Overheating, Coolant & Radiator Service">
                    Engine Overheating, Coolant &amp; Radiator Service
                  </option>
                  <option value="Clutch, Gearbox & Transmission Overhaul">
                    Clutch, Gearbox &amp; Transmission Overhaul
                  </option>
                  <option value="AC Cooling & Cabin Filter Sanitization">
                    AC Cooling &amp; Cabin Filter Sanitization
                  </option>
                  <option value="Battery, Alternator & ECU Diagnostic Scan">
                    Battery, Alternator &amp; ECU Diagnostic Scan
                  </option>
                  <option value="Wheel Alignment, Balancing & Suspension Check">
                    Wheel Alignment, Balancing &amp; Suspension Check
                  </option>
                </select>
              </div>

              {/* Optional Preferred Mechanic Selector OR Equal Auto-Distribution */}
              <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-3 space-y-1.5">
                <label className="text-indigo-300 font-semibold block">
                  Preferred Mechanic (Optional — Auto-Assigned Equally if Not Chosen)
                </label>
                <select
                  value={bookingForm.mechanicId || 'AUTO'}
                  onChange={(e) => setBookingForm({ ...bookingForm, mechanicId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="AUTO">
                    ⚡ Auto-Assign Equally (Load-Balanced Across Available Mechanics)
                  </option>
                  {users
                    .filter((u) => u.role === 'MECHANIC')
                    .map((m) => {
                      const activeCount = services.filter(
                        (s) => Number(s.mechanicId) === Number(m.id) && s.lifecycleStage !== 'DELIVERY'
                      ).length;
                      return (
                        <option key={m.id} value={m.id}>
                          👨‍🔧 {m.fullName} — {m.specialization} ({activeCount} active jobs)
                        </option>
                      );
                    })}
                </select>
                <p className="text-[10px] text-slate-400">
                  Leave on &quot;Auto-Assign Equally&quot; to automatically assign the mechanic with the lowest active workload, or pick your preferred technician.
                </p>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  Describe Any Symptoms or Issues (21-System AI will pre-analyze for mechanic)
                </label>
                <textarea
                  rows={3}
                  value={bookingForm.customerSymptoms}
                  onChange={(e) => setBookingForm({ ...bookingForm, customerSymptoms: e.target.value })}
                  placeholder="E.g. Front brake squeaking noise, engine overheating in traffic, AC cooling slow..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={bookingForm.preferredDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, preferredDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Preferred Time Slot</label>
                  <select
                    value={bookingForm.timeSlot}
                    onChange={(e) => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                    <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                    <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                    <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD INVENTORY SPARE PART                                     */}
      {/* =================================================================== */}
      {showPartModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                Add OEM Spare Part to Inventory
              </h3>
              <button
                onClick={() => setShowPartModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddInventoryPart} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">SKU Code *</label>
                  <input
                    required
                    placeholder="BRK-ROT-FRT"
                    value={partForm.sku}
                    onChange={(e) => setPartForm({ ...partForm, sku: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <input
                    value={partForm.category}
                    onChange={(e) => setPartForm({ ...partForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Part Name *</label>
                <input
                  required
                  placeholder="Ventilated Front Brake Disc Rotor"
                  value={partForm.partName}
                  onChange={(e) => setPartForm({ ...partForm, partName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={partForm.stockQuantity}
                    onChange={(e) => setPartForm({ ...partForm, stockQuantity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Reorder Level</label>
                  <input
                    type="number"
                    value={partForm.reorderLevel}
                    onChange={(e) => setPartForm({ ...partForm, reorderLevel: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    value={partForm.unitPrice}
                    onChange={(e) => setPartForm({ ...partForm, unitPrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPartModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Save Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: SCHEDULE INSURANCE & PUC RENEWAL / UPDATE COMPLIANCE INFO    */}
      {/* =================================================================== */}
      {complianceModalVehicle && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  Schedule Renewal &amp; Update Compliance
                </h3>
                <p className="text-xs text-slate-400">
                  {complianceModalVehicle.make} {complianceModalVehicle.model} ({complianceModalVehicle.registrationNumber})
                </p>
              </div>
              <button
                onClick={() => setComplianceModalVehicle(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveComplianceUpdate} className="space-y-4 text-xs">
              {/* Quick 1-Year / 6-Month Renewal Presets */}
              <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3.5 space-y-2">
                <span className="font-bold text-indigo-300 block">
                  Quick 1-Click Renewal Presets (Extends Expiry Date Immediately):
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const baseTime = complianceForm.insuranceExpiry
                        ? Math.max(Date.now(), new Date(complianceForm.insuranceExpiry).getTime())
                        : Date.now();
                      const nextYr = new Date(baseTime + 365 * 86400000).toISOString().split('T')[0];
                      setComplianceForm((prev) => ({
                        ...prev,
                        insuranceExpiry: nextYr,
                        insuranceRenewalScheduled: true,
                        insuranceRenewalScheduledDate: new Date().toISOString().split('T')[0],
                      }));
                    }}
                    className="bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    + Renew Insurance for 1 Year
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const baseTime = complianceForm.pucExpiry
                        ? Math.max(Date.now(), new Date(complianceForm.pucExpiry).getTime())
                        : Date.now();
                      const nextSixMonths = new Date(baseTime + 180 * 86400000).toISOString().split('T')[0];
                      setComplianceForm((prev) => ({
                        ...prev,
                        pucExpiry: nextSixMonths,
                        pucRenewalScheduled: true,
                        pucRenewalScheduledDate: new Date().toISOString().split('T')[0],
                      }));
                    }}
                    className="bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    + Renew PUC for 6 Months
                  </button>
                </div>
              </div>

              {/* Insurance Section */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400 uppercase tracking-wider text-[11px]">
                    1. Motor Insurance Policy Details &amp; Renewal
                  </span>
                  <label className="flex items-center gap-1.5 text-[11px] text-emerald-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(complianceForm.insuranceRenewalScheduled)}
                      onChange={(e) =>
                        setComplianceForm({
                          ...complianceForm,
                          insuranceRenewalScheduled: e.target.checked,
                        })
                      }
                      className="accent-emerald-500"
                    />
                    Mark Renewal Scheduled
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Insurance Policy No.</label>
                    <input
                      value={complianceForm.insurancePolicyNo}
                      onChange={(e) =>
                        setComplianceForm({ ...complianceForm, insurancePolicyNo: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Updated Expiry Date</label>
                    <input
                      type="date"
                      value={complianceForm.insuranceExpiry}
                      onChange={(e) =>
                        setComplianceForm({ ...complianceForm, insuranceExpiry: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Schedule Renewal Date</label>
                    <input
                      type="date"
                      value={complianceForm.insuranceRenewalScheduledDate}
                      onChange={(e) =>
                        setComplianceForm({
                          ...complianceForm,
                          insuranceRenewalScheduledDate: e.target.value,
                          insuranceRenewalScheduled: Boolean(e.target.value),
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* PUC Section */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
                    2. Pollution Under Control (PUC) Certificate &amp; Renewal
                  </span>
                  <label className="flex items-center gap-1.5 text-[11px] text-emerald-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(complianceForm.pucRenewalScheduled)}
                      onChange={(e) =>
                        setComplianceForm({
                          ...complianceForm,
                          pucRenewalScheduled: e.target.checked,
                        })
                      }
                      className="accent-emerald-500"
                    />
                    Mark PUC Test Scheduled
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">PUC Certificate No.</label>
                    <input
                      value={complianceForm.pucCertificateNo}
                      onChange={(e) =>
                        setComplianceForm({ ...complianceForm, pucCertificateNo: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Updated Expiry Date</label>
                    <input
                      type="date"
                      value={complianceForm.pucExpiry}
                      onChange={(e) =>
                        setComplianceForm({ ...complianceForm, pucExpiry: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Schedule Emission Test Date</label>
                    <input
                      type="date"
                      value={complianceForm.pucRenewalScheduledDate}
                      onChange={(e) =>
                        setComplianceForm({
                          ...complianceForm,
                          pucRenewalScheduledDate: e.target.value,
                          pucRenewalScheduled: Boolean(e.target.value),
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setComplianceModalVehicle(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Save &amp; Update Compliance Info
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
