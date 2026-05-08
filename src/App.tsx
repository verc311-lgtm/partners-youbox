/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, ReactNode, FormEvent } from 'react';
import { 
  BarChart3, 
  Wallet, 
  Package, 
  Users, 
  Home, 
  History, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  QrCode,
  Truck,
  CreditCard,
  FileText,
  X,
  PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';
import { 
  UserLevel, 
  Origin, 
  LEVEL_MAP, 
  UserProfile, 
  Transaction, 
  Package as PackageType,
  UserRole,
  UserStatus
} from './types';
import { cn } from './lib/utils';

// Mock Data
const INITIAL_USER: UserProfile = {
  id: 'user-1',
  name: 'Juan Pérez',
  email: 'juan@example.com',
  level: UserLevel.MASTER_BOX,
  role: UserRole.PARTNER,
  status: UserStatus.ACTIVE,
  walletBalance: 500.00,
  partnerCode: 'YB-5042',
  referralCode: 'YBR-5042',
  totalLbsThisMonth: 15,
  referralLbsThisMonth: 120,
  earningsThisMonth: 600.00,
  totalEarnings: 2450.00,
  inTransitLbs: 8.5,
  registeredAt: new Date(Date.now() - 86400000 * 30).toISOString(),
};

const MOCK_ADMIN: UserProfile = {
  id: 'admin-1',
  name: 'Soporte YouBox',
  email: 'admin@youboxgt.com',
  level: UserLevel.MASTER_BOX,
  role: UserRole.ADMIN,
  status: UserStatus.ACTIVE,
  walletBalance: 0,
  partnerCode: 'YB-ADMIN',
  referralCode: 'YBR-ADMIN',
  totalLbsThisMonth: 0,
  referralLbsThisMonth: 0,
  earningsThisMonth: 0,
  totalEarnings: 0,
  inTransitLbs: 0,
  registeredAt: new Date().toISOString(),
};

const MOCK_PARTNERS: UserProfile[] = [
  INITIAL_USER,
  {
    id: 'user-2',
    name: 'Ana García',
    email: 'ana@example.com',
    level: UserLevel.EMPRENDEDOR,
    role: UserRole.PARTNER,
    status: UserStatus.ACTIVE,
    walletBalance: 120.50,
    partnerCode: 'YB-2091',
    referralCode: 'YBR-2091',
    totalLbsThisMonth: 22,
    referralLbsThisMonth: 45,
    earningsThisMonth: 225.00,
    totalEarnings: 1100.00,
    inTransitLbs: 12,
    registeredAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: 'user-3',
    name: 'Carlos Ruiz',
    email: 'carlos@example.com',
    level: UserLevel.EXPLORADOR,
    role: UserRole.PARTNER,
    status: UserStatus.PENDING,
    walletBalance: 0,
    partnerCode: 'YB-8832',
    referralCode: 'YBR-8832',
    totalLbsThisMonth: 5,
    referralLbsThisMonth: 0,
    earningsThisMonth: 0,
    totalEarnings: 0,
    inTransitLbs: 0,
    registeredAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't-1',
    amount: 500,
    type: 'deposit',
    description: 'Depósito Inicial de Socio',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'completed'
  }
];

const INITIAL_PACKAGES: PackageType[] = [
  {
    id: 'p-initial-1',
    trackingNumber: 'MEX-9920112',
    weight: 5.0,
    origin: Origin.MEXICO,
    cost: 150.00,
    status: 'En Ruta',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'p-initial-2',
    trackingNumber: 'LRD-7781290',
    weight: 3.5,
    origin: Origin.LAREDO,
    cost: 245.00,
    status: 'Aduana',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USER);
  const [partners, setPartners] = useState<UserProfile[]>(MOCK_PARTNERS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [packages, setPackages] = useState<PackageType[]>(INITIAL_PACKAGES);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'wallet' | 'packages' | 'referrals' | 'reports' | 'users' | 'approvals'>('dashboard');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Toggle for Demo
  const toggleRole = () => {
    if (currentUser.role === UserRole.PARTNER) {
      setCurrentUser(MOCK_ADMIN);
      setActiveTab('dashboard');
    } else {
      setCurrentUser(INITIAL_USER);
      setActiveTab('dashboard');
    }
  };

  // Chart Data
  const volumeData = [
    { name: 'Lun', volume: 12 },
    { name: 'Mar', volume: 19 },
    { name: 'Mie', volume: 8 },
    { name: 'Jue', volume: 15 },
    { name: 'Vie', volume: 22 },
    { name: 'Sab', volume: 30 },
    { name: 'Dom', volume: 10 },
  ];

  const sourceData = [
    { name: 'Laredo', value: 65, color: '#FF6B00' },
    { name: 'México', value: 35, color: '#FF8A00' },
  ];

  // Logic: Calculate level based on volume
  const currentLevel = useMemo(() => {
    if (currentUser.totalLbsThisMonth > 30) return UserLevel.MASTER_BOX;
    if (currentUser.totalLbsThisMonth >= 11) return UserLevel.EMPRENDEDOR;
    return UserLevel.EXPLORADOR;
  }, [currentUser.totalLbsThisMonth]);

  // Sync levels if needed (simulating backend trigger)
  useEffect(() => {
    if (currentUser.totalLbsThisMonth === 15 && currentUser.level === UserLevel.MASTER_BOX) return;
    
    if (currentLevel !== currentUser.level) {
      setCurrentUser(prev => ({ ...prev, level: currentLevel }));
    }
  }, [currentLevel, currentUser.level, currentUser.totalLbsThisMonth]);

  const levelProgress = useMemo(() => {
    const nextLevel = currentUser.level === UserLevel.EXPLORADOR ? UserLevel.EMPRENDEDOR : 
                     currentUser.level === UserLevel.EMPRENDEDOR ? UserLevel.MASTER_BOX : null;
    
    if (!nextLevel) return { percentage: 100, remaining: 0 };
    
    const nextConfig = LEVEL_MAP[nextLevel];
    const target = nextConfig.minLbs;
    const progress = Math.min((currentUser.totalLbsThisMonth / target) * 100, 100);
    return { percentage: progress, remaining: target - currentUser.totalLbsThisMonth };
  }, [currentUser.level, currentUser.totalLbsThisMonth]);

  const handleRegisterPackage = (weight: number, origin: Origin, tracking: string) => {
    const rate = LEVEL_MAP[currentUser.level].rates[origin];
    const cost = weight * rate;

    if (currentUser.walletBalance < cost) {
      alert('Saldo insuficiente en la billetera.');
      return;
    }

    const newPackage: PackageType = {
      id: `p-${Date.now()}`,
      trackingNumber: tracking,
      weight,
      origin,
      cost,
      status: 'Registrado',
      createdAt: new Date().toISOString()
    };

    const newTransaction: Transaction = {
      id: `t-${Date.now()}`,
      amount: cost,
      type: 'withdrawal',
      description: `Flete ${origin}: ${tracking} (${weight} lbs)`,
      createdAt: new Date().toISOString(),
      status: 'completed'
    };

    setPackages([newPackage, ...packages]);
    setTransactions([newTransaction, ...transactions]);
    setCurrentUser(prev => ({
      ...prev,
      walletBalance: prev.walletBalance - cost,
      totalLbsThisMonth: prev.totalLbsThisMonth + weight
    }));
  };

  const handleApproveTransaction = (id: string) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' as const } : t));
    const tx = transactions.find(t => t.id === id);
    if (tx && tx.type === 'deposit') {
      alert(`Depósito de Q${tx.amount} aprobado.`);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden selection:bg-brand-orange/30 selection:text-brand-gray-dark">
      {/* Sidebar */}
      <nav className="w-64 bg-white border-r border-gray-200 flex flex-col p-6 space-y-8 shrink-0">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 orange-gradient rounded-xl flex items-center justify-center font-bold text-lg text-white">
              YB
            </div>
            <span className="font-bold text-xl tracking-tight text-brand-gray-dark">YouBox <span className="text-brand-orange">{currentUser.role === UserRole.ADMIN ? 'Central' : 'Partners'}</span></span>
          </div>
          <button 
            onClick={toggleRole}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-brand-gray-dark transition-colors"
            title="Cambiar Vista (Demo)"
          >
            <TrendingUp size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-2">
          <NavItem 
            icon={<Home size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          {currentUser.role === UserRole.PARTNER && (
            <>
              <NavItem 
                icon={<Wallet size={20} />} 
                label="Billetera" 
                active={activeTab === 'wallet'} 
                onClick={() => setActiveTab('wallet')} 
              />
              <NavItem 
                icon={<Package size={20} />} 
                label="Paquetes" 
                active={activeTab === 'packages'} 
                onClick={() => setActiveTab('packages')} 
              />
              <NavItem 
                icon={<Users size={20} />} 
                label="Referidos" 
                active={activeTab === 'referrals'} 
                onClick={() => setActiveTab('referrals')} 
              />
              <NavItem 
                icon={<PieChart size={20} />} 
                label="Reportes" 
                active={activeTab === 'reports'} 
                onClick={() => setActiveTab('reports')} 
              />
            </>
          )}
          {currentUser.role === UserRole.ADMIN && (
            <>
              <NavItem 
                icon={<Users size={20} />} 
                label="SOCIOS" 
                active={activeTab === 'users'} 
                onClick={() => setActiveTab('users')} 
              />
              <NavItem 
                icon={<CheckCircle2 size={20} />} 
                label="Aprobaciones" 
                active={activeTab === 'approvals'} 
                onClick={() => setActiveTab('approvals')} 
              />
              <NavItem 
                icon={<Package size={20} />} 
                label="Logística Global" 
                active={activeTab === 'packages'} 
                onClick={() => setActiveTab('packages')} 
              />
            </>
          )}
        </div>

        <div className="pt-6 border-t border-gray-100">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-400 overflow-hidden">
               <div className={cn("w-full h-full flex items-center justify-center font-bold", currentUser.role === UserRole.ADMIN ? 'bg-purple-500 text-white' : 'bg-gray-100')}>
                {currentUser.name.charAt(0)}
               </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-brand-gray-dark">{currentUser.name}</p>
              <p className="text-xs text-gray-400 truncate tracking-wide">{currentUser.role === UserRole.ADMIN ? 'Administrador' : currentUser.partnerCode}</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <AnimatePresence mode="wait">
            {/* Admin Dashboard */}
            {currentUser.role === UserRole.ADMIN && activeTab === 'dashboard' && (
              <motion.div key="admin-dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AdminDashboard partners={partners} transactions={transactions} />
              </motion.div>
            )}

            {/* Admin - Socios List */}
            {currentUser.role === UserRole.ADMIN && activeTab === 'users' && (
              <motion.div key="admin-users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AdminPartnersView partners={partners} />
              </motion.div>
            )}

            {/* Admin - Approvals */}
            {currentUser.role === UserRole.ADMIN && activeTab === 'approvals' && (
              <motion.div key="admin-approvals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AdminApprovals transactions={transactions} onApprove={handleApproveTransaction} />
              </motion.div>
            )}

            {/* Admin - Global Logistics (reusing packages view with all packages) */}
            {currentUser.role === UserRole.ADMIN && activeTab === 'packages' && (
              <motion.div key="admin-packages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="space-y-8">
                   <h1 className="text-3xl font-black text-brand-gray-dark">Logística Global <span className="text-brand-orange">YouBoxGt</span></h1>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Show all users' packages here in a real app. For now we show the main packages list */}
                      {packages.map(p => (
                        <div key={p.id} className="glass-card p-6 border-l-4 border-brand-orange">
                          <p className="text-xs text-white/40 mb-1">{p.trackingNumber}</p>
                          <p className="font-bold text-brand-gray-dark mb-3">Socio: {partners[0].name}</p>
                          <div className="flex justify-between items-center">
                             <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-500">{p.status}</span>
                             <span className="text-sm font-black text-brand-gray-dark">Q{p.cost}</span>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
              </motion.div>
            )}

            {currentUser.role === UserRole.PARTNER && activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-brand-gray-dark mb-1">¡Hola, {currentUser.name}!</h1>
                    <p className="text-gray-500">Gestiona tus envíos y monitoriza tu crecimiento.</p>
                  </div>
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black">Nivel Actual</span>
                    <div className="text-2xl font-black text-brand-orange leading-tight">{currentUser.level.toUpperCase()}</div>
                  </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  <StatCard 
                    icon={<TrendingUp className="text-brand-orange" size={24} />}
                    label="Volumen Mensual"
                    value={`${currentUser.totalLbsThisMonth} lbs`}
                    footer="Volumen procesado"
                  />
                  <StatCard 
                    icon={<Truck className="text-yellow-600" size={24} />}
                    label="Libras en Camino"
                    value={`${currentUser.inTransitLbs} lbs`}
                    footer="En tránsito / Aduana"
                  />
                  <StatCard 
                    icon={<Wallet className="text-green-600" size={24} />}
                    label="Saldo Billetera"
                    value={`Q${currentUser.walletBalance.toFixed(2)}`}
                    footer="Disponible"
                  />
                  <StatCard 
                    icon={<BarChart3 className="text-blue-600" size={24} />}
                    label="Libras Referidos"
                    value={`${currentUser.referralLbsThisMonth} lbs`}
                    footer="Producción de red"
                  />
                  <StatCard 
                    icon={<TrendingUp className="text-purple-600" size={24} />}
                    label="Ganancias Red"
                    value={`Q${currentUser.earningsThisMonth.toFixed(2)}`}
                    footer="Créditos por red"
                  />
                </div>

                {/* Level Progress */}
                <div className="glass-card p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                     <BarChart3 size={120} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="font-bold text-lg flex items-center gap-2 text-brand-gray-dark">
                         <BarChart3 size={20} className="text-brand-orange" />
                         Progreso de Nivel
                      </h2>
                      {levelProgress.remaining > 0 ? (
                        <div className="px-3 py-1 bg-brand-orange/10 border border-brand-orange/20 rounded-full text-xs font-semibold text-brand-orange">
                          Te faltan <span className="font-black underline underline-offset-2">{levelProgress.remaining.toFixed(1)} lbs</span> para el siguiente nivel
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-semibold text-green-600 flex items-center gap-1.5">
                          <CheckCircle2 size={14} /> Nivel Master Box activo
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-[1px] border border-gray-200">
                        <motion.div 
                          className="h-full orange-gradient rounded-full shadow-[0_2px_8px_rgba(255,107,0,0.2)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${levelProgress.percentage}%` }}
                          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-[10px] font-black font-mono text-gray-400 uppercase tracking-[0.2em]">
                        <div className={currentUser.level === UserLevel.EXPLORADOR ? 'text-brand-orange font-black' : ''}>Explorer</div>
                        <div className={currentUser.level === UserLevel.EMPRENDEDOR ? 'text-brand-orange font-black' : ''}>Entrepreneur</div>
                        <div className={currentUser.level === UserLevel.MASTER_BOX ? 'text-brand-orange font-black' : ''}>Master Box</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Switcher */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-6 shadow-sm">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-brand-gray-dark">
                       <PlusCircle size={20} className="text-brand-orange" />
                       Registrar Paquete
                    </h3>
                    <QuickPackageForm onRegister={handleRegisterPackage} currentLevel={currentUser.level} />
                  </div>
                  <div className="glass-card p-6 shadow-sm">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-brand-gray-dark">
                       <Users size={20} className="text-brand-orange" />
                       Networking
                    </h3>
                    <div className="space-y-6">
                      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-brand-orange/20 transition-colors">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-1">Tu Link de Red (Partner)</p>
                          <p className="text-2xl font-mono font-black tracking-widest text-brand-gray-dark group-hover:text-brand-orange transition-colors">{currentUser.referralCode}</p>
                        </div>
                        <button className="p-3 bg-white border border-gray-200 rounded-xl group-hover:bg-brand-orange/20 transition-all active:scale-90 text-brand-gray-dark">
                           <QrCode size={24} className="text-brand-orange" />
                        </button>
                      </div>
                      
                      <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50/30 border border-blue-100">
                        <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                           <TrendingUp size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-brand-gray-dark font-medium mb-1">Impacto de tu red</p>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Has generado <span className="text-blue-600 font-bold">{currentUser.referralLbsThisMonth} libras</span> indirectas este mes. ¡Sigue creciendo!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'wallet' && (
              <motion.div 
                key="wallet"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                   <h1 className="text-3xl font-bold text-brand-gray-dark">Billetera Digital</h1>
                   <button 
                    onClick={() => setIsDepositModalOpen(true)}
                    className="btn-primary flex items-center gap-2 shadow-lg"
                   >
                     <PlusCircle size={20} /> Cargar Saldo
                   </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-8 orange-gradient relative overflow-hidden group">
                      <div className="relative z-10">
                        <p className="text-white/80 font-medium mb-1 drop-shadow-sm">Saldo Disponible</p>
                        <h2 className="text-5xl font-black mb-10 drop-shadow-md tracking-tight">Q{currentUser.walletBalance.toFixed(2)}</h2>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] text-white/60 uppercase font-black tracking-[0.2em] mb-1">Partner ID</p>
                            <p className="font-mono text-sm tracking-widest font-bold">{currentUser.partnerCode}</p>
                          </div>
                          <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 group-hover:rotate-12 transition-transform shadow-lg">
                            <Wallet className="text-white" size={28} />
                          </div>
                        </div>
                      </div>
                      <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl opacity-50" />
                      <div className="absolute -left-12 -top-12 w-32 h-32 bg-black/10 rounded-full blur-2xl opacity-30" />
                    </div>
                    
                    <div className="glass-card p-6 shadow-sm border-gray-100">
                      <h3 className="font-bold mb-5 flex items-center gap-2 text-brand-gray-dark">
                        <AlertCircle size={18} className="text-brand-orange" />
                        Notas de Billetera
                      </h3>
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="w-5 h-5 rounded-full bg-brand-orange/20 text-brand-orange flex items-center justify-center shrink-0 mt-0.5">
                             <CheckCircle2 size={12} />
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Los depósitos por transferencia pueden tardar hasta <span className="text-brand-gray-dark font-bold">24 horas</span> en reflejarse.
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-5 h-5 rounded-full bg-brand-orange/20 text-brand-orange flex items-center justify-center shrink-0 mt-0.5">
                             <CheckCircle2 size={12} />
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Socio <span className="text-brand-gray-dark font-bold">{currentUser.name}</span> verificado con aporte inicial de Q500.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="glass-card overflow-hidden shadow-sm border-gray-100">
                      <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-brand-gray-dark flex items-center gap-2">
                          <History size={18} className="text-gray-400" />
                          Movimientos Recientes
                        </h3>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {transactions.map(t => (
                          <div key={t.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-5">
                              <div className={`p-3.5 rounded-2xl ${t.type === 'deposit' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                {t.type === 'deposit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                              </div>
                              <div>
                                <p className="font-bold text-brand-gray-dark text-sm md:text-base">{t.description}</p>
                                <p className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-[0.05em] mt-0.5">
                                  {new Date(t.createdAt).toLocaleDateString()} • {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-black text-lg ${t.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                {t.type === 'deposit' ? '+' : '-'} Q{t.amount.toFixed(2)}
                              </p>
                              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                <span className="text-[9px] uppercase font-black tracking-widest text-gray-400">{t.status}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'packages' && (
              <motion.div 
                key="packages"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                   <h1 className="text-3xl font-black text-brand-gray-dark">Paquetes de Importación</h1>
                   <div className="flex gap-3">
                     <div className="relative">
                       <input 
                        type="text" 
                        placeholder="Buscar tracking..." 
                        className="bg-white border border-gray-200 rounded-xl px-4 py-2 pl-10 text-sm focus:border-brand-orange/50 focus:outline-none transition-all w-full md:w-64 text-brand-gray-dark shadow-sm"
                       />
                       <Package className="absolute left-3 top-2.5 text-gray-300" size={16} />
                     </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {packages.length === 0 ? (
                    <div className="glass-card p-16 flex flex-col items-center justify-center text-center space-y-6 shadow-sm">
                      <div className="p-8 bg-gray-50 rounded-3xl border border-gray-200 border-dashed">
                        <Package size={56} className="text-gray-200" />
                      </div>
                      <div className="max-w-xs">
                        <h3 className="text-2xl font-black text-brand-gray-dark italic">Sin actividad</h3>
                        <p className="text-gray-400 mt-2 leading-relaxed">Aún no has registrado paquetes este mes. Comienza registrando un nuevo envío desde el panel principal.</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('dashboard')}
                        className="btn-primary px-10"
                      >
                         Registrar Ahora
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {packages.map(p => (
                        <div key={p.id} className="glass-card shadow-sm border-gray-100 overflow-hidden group hover:border-brand-orange/30 transition-all hover:translate-y-[-4px]">
                          <div className="p-6 space-y-5">
                            <div className="flex justify-between items-start">
                              <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-brand-orange/10 transition-colors">
                                <Package className="text-brand-orange" size={24} />
                              </div>
                              <span className="px-3 py-1 bg-brand-orange/10 border border-brand-orange/20 rounded-full text-[10px] font-black text-brand-orange uppercase tracking-wider">
                                {p.status}
                              </span>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-1">Guía Internacional</p>
                              <p className="font-mono font-black text-brand-gray-dark text-lg tracking-wider">{p.trackingNumber}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-6 pt-2">
                              <div>
                                <p className="text-[9px] text-gray-300 uppercase font-black tracking-widest mb-1.5">Origen</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{p.origin === Origin.LAREDO ? '🇺🇸' : '🇲🇽'}</span>
                                  <p className="text-sm font-bold text-brand-gray-dark">{p.origin}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-[9px] text-gray-300 uppercase font-black tracking-widest mb-1.5">Peso Neto</p>
                                <p className="text-sm font-black text-brand-gray-dark">{p.weight} <span className="text-gray-400 font-medium">lbs</span></p>
                              </div>
                            </div>
                          </div>
                          <div className="p-5 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center group-hover:bg-brand-orange/10 transition-colors">
                            <div>
                              <p className="text-[9px] text-gray-400 uppercase font-black mb-0.5">Total Flete</p>
                              <p className="text-2xl font-black text-brand-gray-dark">Q{p.cost.toFixed(2)}</p>
                            </div>
                            <button className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-300 group-hover:text-brand-orange group-hover:bg-brand-orange/20 transition-all">
                              <ChevronRight size={22} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div 
                key="reports"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-black text-brand-gray-dark">Reporte de Operaciones</h1>
                    <p className="text-gray-400 text-sm">Visualización detallada de tu actividad logística.</p>
                  </div>
                  <button className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-brand-gray-dark transition-all shadow-sm">
                    <FileText size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="glass-card p-8 space-y-6 shadow-sm border-gray-100">
                    <h3 className="font-bold text-lg text-brand-gray-dark">Flujo de Libras (Semanal)</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={volumeData}>
                          <defs>
                            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#00000005" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#D1D5DB" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                          />
                          <YAxis 
                            stroke="#D1D5DB" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                            tickFormatter={(value) => `${value}lb`}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                            itemStyle={{ color: '#FF6B00', fontSize: '12px', fontWeight: 'bold' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="volume" 
                            stroke="#FF6B00" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorVolume)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card p-8 flex flex-col shadow-sm border-gray-100">
                    <h3 className="font-bold text-lg text-brand-gray-dark mb-8">Distribución por Origen</h3>
                    <div className="flex-1 flex items-center justify-center relative">
                      <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <p className="text-3xl font-black text-brand-gray-dark tracking-tighter">100%</p>
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Global</p>
                      </div>
                      <ResponsiveContainer width="100%" height={240}>
                        <RePieChart>
                          <Pie
                            data={sourceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                          >
                            {sourceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                          />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {sourceData.map((item) => (
                        <div key={item.name} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                          <div className={cn("w-2 h-2 rounded-full", item.name === 'Laredo' ? 'bg-brand-orange' : 'bg-[#FF8A00]')} />
                          <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">{item.name}</p>
                            <p className="text-sm font-black text-brand-gray-dark">{item.value}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="glass-card p-8 shadow-sm border-gray-100">
                  <h3 className="font-bold text-lg text-brand-gray-dark mb-6">Eficiencia de Envios</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                       <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Tiempo Promedio</p>
                       <p className="text-2xl font-black text-brand-gray-dark">4.2 <span className="text-sm font-medium opacity-40">días</span></p>
                       <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full orange-gradient w-[85%]" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Ahorro Estimado</p>
                       <p className="text-2xl font-black text-green-600">Q1,240 <span className="text-sm font-medium opacity-40">/mes</span></p>
                       <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full bg-green-500 w-[70%]" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Satisfacción Regional</p>
                       <p className="text-2xl font-black text-blue-600">98.4%</p>
                       <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 w-[98%]" />
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Deposit Modal */}
          <DepositModal 
            isOpen={isDepositModalOpen} 
            onClose={() => setIsDepositModalOpen(false)} 
            onDeposit={(amount, proof) => {
              const newTransaction: Transaction = {
                id: `t-${Date.now()}`,
                amount,
                type: 'deposit',
                description: 'Carga de Saldo (Pendiente de Aprobación)',
                createdAt: new Date().toISOString(),
                status: 'pending'
              };
              setTransactions([newTransaction, ...transactions]);
              setIsDepositModalOpen(false);
              alert('Depósito registrado. El saldo se acreditará una vez que el administrador valide tu comprobante.');
            }}
          />

        </div>
      </main>
    </div>
  );
}

function AdminPartnersView({ partners }: { partners: UserProfile[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filtered = partners.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.partnerCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-gray-dark italic">Gestión de <span className="text-brand-orange">Socios</span></h1>
          <p className="text-gray-400">Directorio completo de la red de Partners YouBoxGt.</p>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar por nombre o código..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full md:w-80 pl-10"
          />
          <Users className="absolute left-3 top-2.5 text-gray-300" size={18} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(p => (
          <div key={p.id} className="glass-card shadow-sm border-gray-100 overflow-hidden group">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center font-black text-xl text-brand-orange border border-gray-100">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-gray-dark leading-tight">{p.name}</h3>
                    <p className="text-xs text-gray-400">{p.email}</p>
                  </div>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border",
                  p.status === 'active' ? 'bg-green-50 text-white border-green-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'
                )}>
                  {p.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Código</p>
                  <p className="text-sm font-mono font-bold text-brand-gray-dark tracking-widest">{p.partnerCode}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Nivel</p>
                  <p className="text-sm font-bold text-brand-orange">{p.level}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Volumen Mensual</span>
                  <span className="font-bold text-brand-gray-dark">{p.totalLbsThisMonth} lbs</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Saldo Billetera</span>
                  <span className="font-bold text-brand-gray-dark">Q{p.walletBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Miembros de Red</span>
                  <span className="font-bold text-brand-gray-dark">14</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
              <button className="flex-1 py-2 rounded-lg bg-white border border-gray-200 text-[10px] font-black uppercase tracking-widest text-brand-gray-dark hover:bg-gray-100 transition-colors">Ver Detalles</button>
              <button className="px-3 py-2 rounded-lg bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 transition-all">
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminDashboard({ partners, transactions }: { partners: UserProfile[], transactions: Transaction[] }) {
  const stats = useMemo(() => {
    const totalBalance = partners.reduce((acc, p) => acc + p.walletBalance, 0);
    const totalLbs = partners.reduce((acc, p) => acc + p.totalLbsThisMonth, 0);
    const pendingApprovals = transactions.filter(t => t.status === 'pending').length;
    return { totalBalance, totalLbs, pendingApprovals, totalPartners: partners.length };
  }, [partners, transactions]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-brand-gray-dark italic">YouBox <span className="text-brand-orange">Command Center</span></h1>
        <p className="text-gray-400">Visión global de socios y flujo de carga.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Users className="text-blue-500" size={24} />} label="Socios Totales" value={stats.totalPartners.toString()} footer="Registrados en plataforma" />
        <StatCard icon={<TrendingUp className="text-brand-orange" size={24} />} label="Volumen Global" value={`${stats.totalLbs} lbs`} footer="Este mes" />
        <StatCard icon={<Wallet className="text-green-600" size={24} />} label="Capital Socios" value={`Q${stats.totalBalance.toLocaleString()}`} footer="Saldo total en billeteras" />
        <StatCard icon={<CheckCircle2 className="text-yellow-600" size={24} />} label="Pendientes" value={stats.pendingApprovals.toString()} footer="Cargas de saldo por validar" />
      </div>

      <div className="glass-card p-8 shadow-sm">
        <h3 className="font-bold text-xl mb-6 text-brand-gray-dark">Actividad Reciente de Red</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase font-black tracking-widest text-gray-300 border-b border-gray-100">
                <th className="pb-4">Socio</th>
                <th className="pb-4">Volumen</th>
                <th className="pb-4">Nivel</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {partners.map(p => (
                <tr key={p.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-xs text-brand-gray-dark">{p.name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-bold text-brand-gray-dark">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-gray-600 font-mono italic">{p.totalLbsThisMonth} lbs</td>
                  <td className="py-4">
                    <span className="text-[10px] font-black text-brand-orange uppercase tracking-wider">{p.level}</span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                       <div className={cn("w-1.5 h-1.5 rounded-full", p.status === 'active' ? 'bg-green-500' : 'bg-yellow-500')} />
                       <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">{p.status}</span>
                    </div>
                  </td>
                  <td className="py-4 text-right font-black text-sm text-brand-gray-dark">Q{p.walletBalance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminApprovals({ transactions, onApprove }: { transactions: Transaction[], onApprove: (id: string) => void }) {
  const pending = transactions.filter(t => t.status === 'pending');

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-brand-gray-dark">Validación de Saldo</h1>
      {pending.length === 0 ? (
        <div className="glass-card p-16 text-center text-gray-300 italic">No hay depósitos pendientes de validación.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pending.map(t => (
            <div key={t.id} className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-yellow-50 text-yellow-600 rounded-2xl border border-yellow-100">
                  <CreditCard size={28} />
                </div>
                <div>
                  <p className="text-lg font-black text-brand-gray-dark italic">Recarga de Socios</p>
                  <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-3xl font-black text-brand-gray-dark tracking-widest">Q{t.amount.toFixed(2)}</p>
                  <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Ver Comprobante</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onApprove(t.id)} className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg">
                    <CheckCircle2 size={24} />
                  </button>
                  <button className="bg-red-50 hover:bg-red-100 text-red-600 p-3 rounded-xl transition-all active:scale-95 border border-red-100">
                    <X size={24} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DepositModal({ isOpen, onClose, onDeposit }: { isOpen: boolean, onClose: () => void, onDeposit: (amount: number, proof: File | null) => void }) {
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-gray-dark/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white border border-gray-200 rounded-3xl w-full max-w-md p-8 shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-300 hover:text-brand-gray-dark transition-colors">
          <X size={24} />
        </button>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-brand-orange/10 rounded-2xl text-brand-orange border border-brand-orange/20">
            <CreditCard size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-gray-dark">Cargar Saldo</h2>
            <p className="text-xs text-gray-400">Aumenta tu presupuesto para envíos.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-[.2em] pl-1">Monto a Cargar (Q)</label>
            <input 
              type="number" 
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full input-field text-lg font-black font-mono border-gray-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-[.2em] pl-1">Comprobante de Pago</label>
            <div className="relative group">
              <input 
                type="file" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="input-field border-dashed border-gray-200 py-8 flex flex-col items-center justify-center gap-2 group-hover:border-brand-orange/30 transition-all bg-gray-50">
                {file ? (
                  <>
                    <CheckCircle2 className="text-green-500" size={32} />
                    <p className="text-sm font-bold text-brand-gray-dark">{file.name}</p>
                    <p className="text-[10px] text-gray-400 italic">Pulsa para cambiar</p>
                  </>
                ) : (
                  <>
                    <PlusCircle className="text-gray-300 group-hover:text-brand-orange/50 transition-colors" size={32} />
                    <p className="text-sm font-medium text-gray-400 text-center">Adjuntar Boleta / Captura</p>
                    <p className="text-[10px] text-gray-300">Formatos: JPG, PNG, PDF</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <button 
            disabled={!amount || !file}
            onClick={() => onDeposit(parseFloat(amount), file)}
            className="btn-primary w-full py-4 text-base font-black shadow-lg"
          >
            Enviar para Aprobación
          </button>
          
          <p className="text-center text-[10px] text-gray-300 italic px-4">
            El saldo se verá reflejado una vez que el equipo de YouBoxGt valide la transacción.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-5 py-3.5 rounded-2xl transition-all relative group ${
        active 
          ? 'bg-brand-orange/10 text-brand-orange font-bold border border-brand-orange/20 shadow-[0_4px_12px_rgba(255,107,0,0.08)]' 
          : 'text-gray-400 hover:bg-gray-100/50 hover:text-brand-gray-dark'
      }`}
    >
      <div className={`${active ? 'text-brand-orange' : 'text-gray-300 group-hover:text-brand-orange/60'} transition-colors`}>
        {icon}
      </div>
      <span className="text-sm font-medium tracking-wide">{label}</span>
      {active && (
        <motion.div 
          layoutId="active-indicator" 
          className="absolute left-0 w-1 h-6 orange-gradient rounded-full"
        />
      )}
    </button>
  );
}

function StatCard({ icon, label, value, footer }: { icon: ReactNode, label: string, value: string, footer: string }) {
  return (
    <div className="glass-card p-6 flex flex-col space-y-5 group hover:border-gray-300 transition-all shadow-sm">
      <div className="flex justify-between items-start">
        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-brand-orange/5 transition-colors">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[.2em] mb-1">{label}</p>
        <p className="text-3xl font-black text-brand-gray-dark tracking-tight">{value}</p>
      </div>
      <div className="pt-2 border-t border-gray-50">
        <p className="text-[9px] text-gray-300 italic font-medium">{footer}</p>
      </div>
    </div>
  );
}

function BenefitItem({ number, title, desc, color }: { number: string, title: string, desc: string, color: string }) {
  return (
    <div className="space-y-3 p-4 hover:bg-gray-50 rounded-2xl transition-colors">
      <div className={`text-4xl font-black ${color} opacity-30 mb-2 font-mono`}>{number}</div>
      <p className="font-bold text-brand-gray-dark text-lg">{title}</p>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function QuickPackageForm({ onRegister, currentLevel }: { onRegister: (w: number, o: Origin, t: string) => void, currentLevel: UserLevel }) {
  const [weight, setWeight] = useState('');
  const [origin, setOrigin] = useState<Origin>(Origin.LAREDO);
  const [tracking, setTracking] = useState('');

  const estimatedCost = useMemo(() => {
    const w = parseFloat(weight);
    if (isNaN(w)) return 0;
    return w * LEVEL_MAP[currentLevel].rates[origin];
  }, [weight, origin, currentLevel]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!weight || !tracking) return;
    onRegister(parseFloat(weight), origin, tracking);
    setWeight('');
    setTracking('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-[.2em] pl-1">Origen</label>
          <div className="relative">
            <select 
              value={origin} 
              onChange={(e) => setOrigin(e.target.value as Origin)}
              className="w-full input-field bg-white appearance-none text-sm font-bold text-brand-gray-dark border-gray-200"
            >
              <option value={Origin.LAREDO}>🇺🇸 Laredo, TX</option>
              <option value={Origin.MEXICO}>🇲🇽 México, CDMX</option>
            </select>
            <div className="absolute right-3 top-3.5 pointer-events-none opacity-40">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-[.2em] pl-1">Masa (lbs)</label>
          <input 
            type="number" 
            step="0.01" 
            placeholder="0.00"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full input-field text-sm font-bold font-mono placeholder:text-gray-300"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] text-gray-400 font-black uppercase tracking-[.2em] pl-1">Guía Internacional</label>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Ej: USPX-1029384756"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            className="w-full input-field pl-10 text-sm font-bold font-mono placeholder:text-gray-300"
          />
          <Package className="absolute left-3.5 top-2.5 text-gray-300" size={16} />
        </div>
      </div>
      
      <div className="p-5 bg-gray-50 rounded-[1.5rem] border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div>
          <p className="text-[10px] text-brand-orange font-black uppercase tracking-[.2em] mb-1">Inversión Flete</p>
          <p className="text-3xl font-black text-brand-gray-dark tracking-tight">Q{estimatedCost.toFixed(2)}</p>
        </div>
        <button 
          type="submit" 
          disabled={!weight || !tracking}
          className="btn-primary w-full sm:w-auto px-10 py-4 shadow-xl"
        >
          Agendar Envío
        </button>
      </div>
    </form>
  );
}
