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
  PieChart,
  Bell,
  Copy,
  LogOut,
  Shield,
  Download,
  ExternalLink,
  Calculator,
  Trash2,
  MessageSquare,
  Plus
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
  UserStatus,
import { 
  UserLevel, 
  Origin, 
  LEVEL_MAP, 
  UserProfile, 
  Transaction, 
  Package as PackageType,
  UserRole,
  UserStatus,
  Notification as NotificationType
} from './types';
import { cn } from './lib/utils';
import { supabase } from './lib/supabase';

// Mock data removed for Phase 2 real integration

// Mock Data
// Real integration with Supabase - start from 0


export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [partners, setPartners] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'wallet' | 'packages' | 'referrals' | 'reports' | 'users' | 'approvals' | 'estimator'>('dashboard');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

  // Handle Auth State Changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        // Map snake_case from DB to camelCase in UserProfile interface
        const profile: UserProfile = {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          level: data.level as UserLevel,
          role: data.role as UserRole,
          status: data.status as UserStatus,
          isActive: data.is_active,
          sponsorId: data.sponsor_id,
          walletBalance: data.wallet_balance,
          referralBalance: data.referral_balance,
          frozenBalance: data.frozen_balance,
          totalLbsThisMonth: data.total_lbs_this_month,
          referralLbsThisMonth: data.referral_lbs_this_month,
          earningsThisMonth: 0, // Calculated separately if needed
          totalEarnings: 0,
          inTransitLbs: 0,
          partnerCode: data.partner_code,
          referralCode: data.referral_code,
          registeredAt: data.registered_at,
          gracePeriodEnd: data.grace_period_end,
          acceptedTerms: data.accepted_terms,
          notifications: []
        };
        setCurrentUser(profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };


  // Unread notifications count
  const unreadCount = currentUser?.notifications.filter(n => !n.isRead).length ?? 0;

  const handleMarkNotificationsRead = () => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      notifications: currentUser.notifications.map(n => ({ ...n, isRead: true }))
    };
    setCurrentUser(updatedUser);
    setPartners(prev => prev.map(p => p.id === updatedUser.id ? updatedUser : p));
  };

  // Toggle for Demo
  const toggleRole = () => {
    if (!currentUser) return;
    if (currentUser.role === UserRole.PARTNER) {
      setCurrentUser(MOCK_ADMIN);
      setActiveTab('dashboard');
    } else {
      setCurrentUser(INITIAL_USER);
      setActiveTab('dashboard');
    }
  };

  // Handle Registration
  const handleRegister = async (name: string, email: string, phone: string, sponsorCode: string) => {
    try {
      setIsLoading(true);
      
      // Ensure phone prefix +502
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+502${formattedPhone}`;
      } else if (!formattedPhone.startsWith('+502')) {
        // If it starts with + but not +502, we keep it as is or handle it. 
        // User specifically asked to create with +502 prefix.
        // Assuming if they type 55551234 -> +50255551234
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: formattedPhone, // Initial password is phone
        options: {
          data: {
            full_name: name,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Generate partner code (simplified for Phase 2)
        const partnerCode = `YBP-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        const referralCode = `${partnerCode}-REF`;
        
        const now = new Date();
        const graceEnd = new Date(now);
        graceEnd.setMonth(graceEnd.getMonth() + 2);

        const { error: profileError } = await supabase
          .from('partners')
          .insert([
            {
              id: authData.user.id,
              name,
              email,
              phone: formattedPhone,
              partner_code: partnerCode,
              referral_code: referralCode,
              status: 'pending',
              is_active: false,
              grace_period_end: graceEnd.toISOString(),
              accepted_terms: true
            }
          ]);

        if (profileError) throw profileError;

        alert('Registro exitoso. Tu cuenta está pendiente de activación por depósito.');
        setAuthScreen('login');
      }
    } catch (error: any) {
      alert(`Error en el registro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Login
  const handleLogin = async (email: string, password?: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password || '',
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) return 'invalid_password';
        throw error;
      }

      return 'success';
    } catch (error: any) {
      console.error('Login error:', error);
      return 'not_found';
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setAuthScreen('login');
    setActiveTab('dashboard');
  };


  // Level downgrade check (runs on login)
  useEffect(() => {
    if (!currentUser || currentUser.role === UserRole.ADMIN) return;
    
    const graceEnd = new Date(currentUser.gracePeriodEnd);
    const now = new Date();
    
    if (now > graceEnd && currentUser.level === UserLevel.MASTER_BOX && currentUser.totalLbsThisMonth < 30) {
      const downgradeNotification: NotificationType = {
        id: `n-downgrade-${Date.now()}`,
        title: 'Nivel Ajustado',
        message: 'Tu período de gracia de 2 meses como Master Box ha terminado. Al no haber procesado más de 30 lbs, tu nivel ha sido ajustado a Emprendedor.',
        type: 'level_downgrade',
        isRead: false,
        createdAt: now.toISOString()
      };

      const updatedUser = {
        ...currentUser,
        level: UserLevel.EMPRENDEDOR,
        notifications: [downgradeNotification, ...currentUser.notifications]
      };

      setCurrentUser(updatedUser);
      setPartners(prev => prev.map(p => p.id === updatedUser.id ? updatedUser : p));
      console.log(`[EMAIL ENVIADO] A: ${currentUser.email} - Asunto: Tu nivel ha cambiado a Emprendedor`);
    }
  }, [currentUser?.id]);



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
    if (!currentUser) return UserLevel.EXPLORADOR;
    if (currentUser.totalLbsThisMonth > 30) return UserLevel.MASTER_BOX;
    if (currentUser.totalLbsThisMonth >= 11) return UserLevel.EMPRENDEDOR;
    return UserLevel.EXPLORADOR;
  }, [currentUser?.totalLbsThisMonth]);

  // Sync levels if needed (simulating backend trigger)
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.totalLbsThisMonth === 15 && currentUser.level === UserLevel.MASTER_BOX) return;
    
    if (currentLevel !== currentUser.level) {
      setCurrentUser(prev => prev ? { ...prev, level: currentLevel } : null);
    }
  }, [currentLevel, currentUser?.level, currentUser?.totalLbsThisMonth]);

  const levelProgress = useMemo(() => {
    if (!currentUser) return { percentage: 0, remaining: 0 };
    const nextLevel = currentUser.level === UserLevel.EXPLORADOR ? UserLevel.EMPRENDEDOR : 
                     currentUser.level === UserLevel.EMPRENDEDOR ? UserLevel.MASTER_BOX : null;
    
    if (!nextLevel) return { percentage: 100, remaining: 0 };
    
    const nextConfig = LEVEL_MAP[nextLevel];
    const target = nextConfig.minLbs;
    const progress = Math.min((currentUser.totalLbsThisMonth / target) * 100, 100);
    return { percentage: progress, remaining: target - currentUser.totalLbsThisMonth };
  }, [currentUser?.level, currentUser?.totalLbsThisMonth]);

  // --- AUTH SCREENS ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 orange-gradient rounded-2xl flex items-center justify-center font-bold text-2xl text-white mx-auto mb-4 shadow-lg">
              YB
            </div>
            <h1 className="text-3xl font-black text-brand-gray-dark">YouBox <span className="text-brand-orange">Partners</span></h1>
            <p className="text-gray-400 mt-1">Plataforma de Socios Comerciales</p>
          </div>

          <div className="glass-card p-8 shadow-xl">
            {/* Tab Switcher */}
            <div className="flex mb-8 bg-gray-100 rounded-xl p-1">
              <button 
                onClick={() => setAuthScreen('login')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${authScreen === 'login' ? 'bg-white text-brand-gray-dark shadow-sm' : 'text-gray-400'}`}
              >
                Iniciar Sesión
              </button>
              <button 
                onClick={() => setAuthScreen('register')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${authScreen === 'register' ? 'bg-white text-brand-gray-dark shadow-sm' : 'text-gray-400'}`}
              >
                Registrarse
              </button>
            </div>

            <AnimatePresence mode="wait">
              {authScreen === 'login' ? (
                <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <LoginForm onLogin={handleLogin} />
                </motion.div>
              ) : (
                <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <RegisterForm onRegister={handleRegister} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Links */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <a 
              href="https://partners.youboxgt.com/privacy-policy/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-brand-orange transition-colors flex items-center gap-1"
            >
              <Shield size={12} /> Términos y Condiciones
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); alert('Para agregar el PDF del manual: Coloca el archivo en la carpeta public/ con el nombre "manual-youbox-partners.pdf" y el botón lo descargará automáticamente.'); }}
              className="text-xs text-gray-400 hover:text-brand-orange transition-colors flex items-center gap-1"
            >
              <Download size={12} /> Descargar Manual de Instrucciones
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- PENDING VERIFICATION SCREEN ---
  if (currentUser.status === UserStatus.PENDING) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-yellow-200">
            <AlertCircle size={40} className="text-yellow-500" />
          </div>
          <h1 className="text-2xl font-black text-brand-gray-dark mb-2">Verificación Pendiente</h1>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Tu solicitud de socio <strong className="text-brand-orange">{currentUser.partnerCode}</strong> ha sido recibida. 
            Estamos verificando tu boleta de depósito de Q500.00.
          </p>
          
          <div className="glass-card p-6 shadow-sm mb-6 text-left space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Nombre</span>
              <span className="font-bold text-brand-gray-dark">{currentUser.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Código de Socio</span>
              <span className="font-mono font-bold text-brand-orange">{currentUser.partnerCode}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Estado</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-black uppercase tracking-widest">Pendiente de Verificación</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Nivel Asignado</span>
              <span className="font-bold text-indigo-600">Master Box</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-6 italic">
            Recibirás una notificación por correo electrónico una vez que tu depósito sea verificado por el equipo de YouBox.
          </p>

          <button 
            onClick={handleLogout}
            className="text-sm text-red-400 hover:text-red-600 font-bold transition-colors flex items-center gap-2 mx-auto"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </motion.div>
      </div>
    );
  }

  // --- MAIN APP (authenticated + verified) ---

  const handleRegisterPackage = (weight: number, origin: Origin, tracking: string) => {
    const rate = LEVEL_MAP[currentUser.level].rates[origin];
    const cost = weight * rate;

    if (currentUser.walletBalance < cost) {
      alert('Saldo insuficiente en la billetera.');
      return;
    }

    const newPackage: PackageType = {
      id: `p-${Date.now()}`,
      ownerId: currentUser.id,
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
      // If it's an initial deposit, activate the corresponding partner
      const partnerCode = tx.description.match(/\(YBP\d+\)/)?.[0]?.replace(/[()]/g, '');
      if (partnerCode) {
        const now = new Date();
        const gracePeriod = new Date(now);
        gracePeriod.setMonth(gracePeriod.getMonth() + 2);

        setPartners(prev => prev.map(p => {
          if (p.partnerCode === partnerCode && p.status === UserStatus.PENDING) {
            return {
              ...p,
              status: UserStatus.ACTIVE,
              isActive: true,
              walletBalance: 500,
              gracePeriodEnd: gracePeriod.toISOString(),
              notifications: [
                {
                  id: `n-welcome-${Date.now()}`,
                  title: '¡Cuenta Activada!',
                  message: `Tu depósito ha sido verificado. Bienvenido a YouBox Partners. Tu nivel Master Box tiene vigencia de 2 meses. Si al tercer mes no has procesado más de 30 libras, tu nivel bajará a Emprendedor.`,
                  type: 'general',
                  isRead: false,
                  createdAt: now.toISOString()
                },
                ...p.notifications
              ]
            };
          }
          return p;
        }));
        console.log(`[EMAIL ENVIADO] A: ${partnerCode} - Asunto: ¡Tu cuenta ha sido activada! Ya puedes operar en YouBox Partners. Tu contraseña inicial es tu número de WhatsApp.`);
      }
      alert(`Depósito de Q${tx.amount} aprobado. Cuenta activada.`);
    }
  };

  const handleMarkAsPaid = (packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg || pkg.status === 'PAGADO') return;

    // Update package status
    setPackages(prev => prev.map(p => p.id === packageId ? { ...p, status: 'PAGADO' } : p));

    // Find owner and sponsor
    const owner = partners.find(p => p.id === pkg.ownerId);
    if (!owner || !owner.sponsorId) return; // No sponsor, no commission

    const sponsorIndex = partners.findIndex(p => p.id === owner.sponsorId);
    if (sponsorIndex === -1) return;

    const sponsor = partners[sponsorIndex];
    const commissionAmount = pkg.weight * 2; // Q2.00 por libra cobrada

    // Create transaction
    const newTx: Transaction = {
      id: `t-ref-${Date.now()}`,
      amount: commissionAmount,
      type: 'referral_commission',
      description: `Ganancia por referido ${owner.name} - Guía #${pkg.trackingNumber}`,
      createdAt: new Date().toISOString(),
      status: 'completed',
      frozen: !sponsor.isActive
    };

    setTransactions(prev => [newTx, ...prev]);

    // Update sponsor balance
    const updatedPartners = [...partners];
    let newNotification = null;
    let newBonusTx = null;
    let bonusAmount = 0;

    const previousVolume = sponsor.referralLbsThisMonth;
    const newVolume = previousVolume + pkg.weight;

    // Check gamification bonus (500 lbs threshold)
    if (previousVolume < 500 && newVolume >= 500) {
      bonusAmount = 100;
      newBonusTx = {
        id: `t-bonus-${Date.now()}`,
        amount: bonusAmount,
        type: 'referral_commission',
        description: `Bono de Red por alcanzar 500 lbs!`,
        createdAt: new Date().toISOString(),
        status: 'completed'
      };
      // Send console email
      console.log(`[EMAIL ENVIADO] A: ${sponsor.email} - Asunto: ¡Felicidades! Alcanzaste el Bono de Red de Q100`);
    }

    if (sponsor.isActive) {
      updatedPartners[sponsorIndex] = {
        ...sponsor,
        referralLbsThisMonth: newVolume,
        walletBalance: sponsor.walletBalance + bonusAmount,
        referralBalance: sponsor.referralBalance + commissionAmount,
        totalEarnings: sponsor.totalEarnings + commissionAmount + bonusAmount,
        earningsThisMonth: sponsor.earningsThisMonth + commissionAmount + bonusAmount,
        notifications: bonusAmount > 0 ? [
          {
            id: `n-${Date.now()}`,
            title: '¡Meta Alcanzada!',
            message: 'Tu red ha superado las 500 lbs este mes. Has recibido un bono de Q100.00 en tu Saldo Principal.',
            type: 'bonus',
            isRead: false,
            createdAt: new Date().toISOString()
          },
          ...sponsor.notifications
        ] : sponsor.notifications
      };
    } else {
      // Frozen logic
      newNotification = {
        id: `n-${Date.now()}`,
        title: '¡Tienes dinero congelado!',
        message: `Un referido tuyo facturó ${pkg.weight}lbs. Tienes Q${commissionAmount.toFixed(2)} congelados. ¡Activa tu cuenta!`,
        type: 'frozen_commission',
        isRead: false,
        createdAt: new Date().toISOString()
      };
      console.log(`[EMAIL ENVIADO] A: ${sponsor.email} - Asunto: Dinero Congelado por inactividad`);

      updatedPartners[sponsorIndex] = {
        ...sponsor,
        referralLbsThisMonth: newVolume,
        frozenBalance: sponsor.frozenBalance + commissionAmount,
        notifications: [newNotification, ...sponsor.notifications]
      };
    }
    setPartners(updatedPartners);

    if (newBonusTx) {
      setTransactions(prev => [newTx, newBonusTx, ...prev]);
    } else {
      setTransactions(prev => [newTx, ...prev]);
    }

    // If current user is the sponsor, update their state too
    if (currentUser.id === sponsor.id) {
      setCurrentUser(updatedPartners[sponsorIndex]);
    }

    alert(`Paquete ${pkg.trackingNumber} pagado. Comisión ${sponsor.isActive ? 'acreditada' : 'congelada'} al patrocinador.`);
  };

  const handleTransferReferral = () => {
    if (currentUser.referralBalance <= 0) return;

    const amount = currentUser.referralBalance;

    const newTx: Transaction = {
      id: `t-trans-${Date.now()}`,
      amount,
      type: 'transfer_to_main',
      description: 'Transferencia de Ganancias de Red',
      createdAt: new Date().toISOString(),
      status: 'completed'
    };

    setTransactions(prev => [newTx, ...prev]);

    const updatedUser = {
      ...currentUser,
      walletBalance: currentUser.walletBalance + amount,
      referralBalance: 0
    };

    setCurrentUser(updatedUser);
    setPartners(prev => prev.map(p => p.id === updatedUser.id ? updatedUser : p));
    
    alert(`Se han transferido Q${amount.toFixed(2)} a tu Saldo Principal.`);
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
          <NavItem 
            icon={<Calculator size={20} />} 
            label="Cotizador" 
            active={activeTab === 'estimator'} 
            onClick={() => setActiveTab('estimator')} 
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

        <div className="pt-6 border-t border-gray-100 space-y-4">
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
          
          <a 
            href="/manual-youbox-partners.pdf" 
            download 
            className="flex items-center gap-2 px-5 py-2 text-xs text-gray-400 hover:text-brand-orange transition-colors"
          >
            <Download size={14} /> Manual de Instrucciones
          </a>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-5 py-2.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Top Header with Notifications */}
        <div className="sticky top-0 z-40 bg-gray-50/80 backdrop-blur-xl border-b border-gray-200 px-8 py-4 flex justify-end items-center">
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-brand-orange hover:border-brand-orange/30 transition-colors relative shadow-sm"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-brand-gray-dark text-sm">Notificaciones</h3>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkNotificationsRead} className="text-[10px] font-bold text-brand-orange hover:underline">
                        Marcar leídas
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {currentUser.notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-xs">
                        No tienes notificaciones
                      </div>
                    ) : (
                      currentUser.notifications.map(n => (
                        <div key={n.id} className={`p-4 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-orange-50/30' : ''}`}>
                          <div className="flex gap-3">
                            <div className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${!n.isRead ? 'bg-brand-orange' : 'bg-gray-300'}`} />
                            <div>
                              <p className="text-xs font-bold text-brand-gray-dark mb-1">{n.title}</p>
                              <p className="text-[11px] text-gray-500 leading-relaxed mb-2">{n.message}</p>
                              <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">
                                {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="p-8 max-w-5xl mx-auto space-y-8">
          
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
                      {packages.map(p => {
                        const owner = partners.find(user => user.id === p.ownerId);
                        return (
                          <div key={p.id} className="glass-card p-6 border-l-4 border-brand-orange flex flex-col justify-between">
                            <div>
                              <p className="text-xs text-brand-gray-dark/50 mb-1 font-mono">{p.trackingNumber}</p>
                              <p className="font-bold text-brand-gray-dark mb-3">Socio: {owner?.name || 'Desconocido'}</p>
                              <div className="flex justify-between items-center mb-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status === 'PAGADO' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                                <span className="text-sm font-black text-brand-gray-dark">Q{p.cost}</span>
                              </div>
                            </div>
                            {p.status !== 'PAGADO' && (
                              <button 
                                onClick={() => handleMarkAsPaid(p.id)}
                                className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-xs transition-colors"
                              >
                                Marcar como Pagado
                              </button>
                            )}
                          </div>
                        );
                      })}
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

                {/* Gamification Bonus Progress & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Bonus Progress */}
                  <div className="lg:col-span-1 glass-card p-6 border-2 border-indigo-50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                       <PieChart size={120} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-lg flex items-center gap-2 text-indigo-900">
                           <TrendingUp size={20} className="text-indigo-600" />
                           Bono de Red
                        </h2>
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded uppercase">Q100.00</span>
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                        Alcanza <strong>500 lbs</strong> facturadas por tu red en un solo mes y recibe un bono en efectivo a tu saldo principal.
                      </p>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-brand-gray-dark">
                          <span>{currentUser.referralLbsThisMonth} lbs</span>
                          <span>500 lbs</span>
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden p-[1px] border border-gray-200">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((currentUser.referralLbsThisMonth / 500) * 100, 100)}%` }}
                            transition={{ duration: 1.2 }}
                          />
                        </div>
                        {currentUser.referralLbsThisMonth >= 500 && (
                           <p className="text-[10px] text-green-600 font-bold uppercase mt-2">¡Meta alcanzada este mes!</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6 shadow-sm">
                      <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-brand-gray-dark">
                         <PlusCircle size={20} className="text-brand-orange" />
                         Registrar Paquete
                      </h3>
                      <QuickPackageForm onRegister={handleRegisterPackage} currentLevel={currentUser.level} />
                    </div>
                    
                    {/* Leaderboard */}
                    <div className="glass-card p-6 shadow-sm flex flex-col">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-brand-gray-dark">
                         <TrendingUp size={20} className="text-brand-orange" />
                         Top Partners
                      </h3>
                      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {partners.filter(p => p.role === UserRole.PARTNER)
                          .sort((a, b) => b.referralLbsThisMonth - a.referralLbsThisMonth)
                          .slice(0, 3)
                          .map((p, idx) => (
                          <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-brand-gray-dark truncate">{p.name}</p>
                              <p className="text-[10px] text-gray-500 font-mono">{p.partnerCode}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-black text-brand-orange">{p.referralLbsThisMonth}</p>
                              <p className="text-[8px] uppercase tracking-widest text-gray-400">Lbs</p>
                            </div>
                          </div>
                        ))}
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
                    {/* Main Wallet Card */}
                    <div className="glass-card p-8 orange-gradient relative overflow-hidden group">
                      <div className="relative z-10">
                        <p className="text-white/80 font-medium mb-1 drop-shadow-sm">Saldo Principal</p>
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

                    {/* Referral Wallet Card */}
                    <div className="glass-card p-8 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden group">
                      <div className="relative z-10">
                        <p className="text-white/80 font-medium mb-1 drop-shadow-sm">Saldo por Referidos</p>
                        <h2 className="text-4xl font-black mb-6 drop-shadow-md tracking-tight text-white">Q{currentUser.referralBalance.toFixed(2)}</h2>
                        
                        {!currentUser.isActive && currentUser.frozenBalance > 0 && (
                           <div className="mb-4 p-2 bg-white/10 rounded-lg border border-white/20">
                             <p className="text-xs text-white/90 flex items-center gap-1.5 font-bold">
                               <AlertCircle size={14} /> Saldo Congelado: Q{currentUser.frozenBalance.toFixed(2)}
                             </p>
                             <p className="text-[9px] text-white/70 mt-1">Activa tu cuenta para liberar estas ganancias.</p>
                           </div>
                        )}

                        <button 
                          onClick={handleTransferReferral}
                          disabled={currentUser.referralBalance <= 0}
                          className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm"
                        >
                          Transferir a Saldo Principal
                        </button>
                      </div>
                      <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl opacity-50" />
                      <div className="absolute -top-12 -left-12 w-32 h-32 bg-black/10 rounded-full blur-2xl opacity-30" />
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
                            El Saldo por Referidos no puede ser retirado directamente a cuenta bancaria. Puedes transferirlo al Saldo Principal para el pago de tus envíos.
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-5 h-5 rounded-full bg-brand-orange/20 text-brand-orange flex items-center justify-center shrink-0 mt-0.5">
                             <CheckCircle2 size={12} />
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Los depósitos por transferencia pueden tardar hasta <span className="text-brand-gray-dark font-bold">24 horas</span> en reflejarse.
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <div className={`w-5 h-5 rounded-full ${currentUser.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} flex items-center justify-center shrink-0 mt-0.5`}>
                             {currentUser.isActive ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Socio <span className="text-brand-gray-dark font-bold">{currentUser.name}</span> {currentUser.isActive ? 'verificado con aporte inicial de Q500.' : 'pendiente de activación.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="glass-card overflow-hidden shadow-sm border-gray-100 h-full flex flex-col">
                      <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-brand-gray-dark flex items-center gap-2">
                          <History size={18} className="text-gray-400" />
                          Movimientos Recientes
                        </h3>
                      </div>
                      <div className="divide-y divide-gray-50 overflow-y-auto flex-1 max-h-[600px]">
                        {transactions.map(t => {
                          let isPositive = t.type === 'deposit' || t.type === 'referral_commission' || t.type === 'transfer_to_main';
                          let icon = isPositive ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />;
                          let colorClass = isPositive ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100';
                          
                          if (t.type === 'transfer_to_main') {
                            colorClass = 'bg-blue-50 text-blue-600 border border-blue-100';
                          } else if (t.type === 'referral_commission') {
                            colorClass = 'bg-indigo-50 text-indigo-600 border border-indigo-100';
                          }

                          return (
                            <div key={t.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-5">
                                <div className={`p-3.5 rounded-2xl ${colorClass}`}>
                                  {icon}
                                </div>
                                <div>
                                  <p className="font-bold text-brand-gray-dark text-sm md:text-base">
                                    {t.description} 
                                    {t.frozen && <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded uppercase font-bold">Congelado</span>}
                                  </p>
                                  <p className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-[0.05em] mt-0.5">
                                    {new Date(t.createdAt).toLocaleDateString()} • {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-black text-lg ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                  {isPositive ? '+' : '-'} Q{t.amount.toFixed(2)}
                                </p>
                                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                  <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                  <span className="text-[9px] uppercase font-black tracking-widest text-gray-400">{t.status}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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

            {activeTab === 'referrals' && (
              <motion.div 
                key="referrals"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                   <h1 className="text-3xl font-bold text-brand-gray-dark">Mi Red de Socios</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Referral List */}
                  <div className="lg:col-span-2">
                    <div className="glass-card overflow-hidden shadow-sm border-gray-100 h-full flex flex-col">
                      <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-brand-gray-dark flex items-center gap-2">
                          <Users size={18} className="text-gray-400" />
                          Mis Referidos Directos
                        </h3>
                      </div>
                      <div className="divide-y divide-gray-50 overflow-y-auto flex-1 max-h-[600px]">
                        {partners.filter(p => p.sponsorId === currentUser.id).length === 0 ? (
                          <div className="p-12 text-center">
                            <Users size={48} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-gray-400">Aún no tienes referidos. ¡Comparte tu link para empezar a ganar!</p>
                          </div>
                        ) : (
                          partners.filter(p => p.sponsorId === currentUser.id).map(p => (
                            <div key={p.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${p.isActive ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                                  {p.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-brand-gray-dark text-sm">{p.name} <span className="text-xs font-normal text-gray-400">({p.partnerCode})</span></p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${p.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                      {p.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                    <span className="text-[10px] text-gray-400">{p.level}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-lg text-brand-gray-dark">{p.totalLbsThisMonth} <span className="text-xs text-gray-400">lbs</span></p>
                                <p className="text-[10px] text-brand-orange font-bold">Generado: Q{(p.totalLbsThisMonth * 2).toFixed(2)}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Marketing Kit */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-6 shadow-sm border-gray-100">
                      <h3 className="font-bold mb-5 flex items-center gap-2 text-brand-gray-dark">
                        <TrendingUp size={18} className="text-brand-orange" />
                        Kit de Promoción
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-xs text-gray-400 mb-2 font-bold uppercase">Mensaje para WhatsApp</p>
                          <p className="text-sm text-brand-gray-dark italic mb-3">
                            "¡Hola! Estoy trayendo mis compras de USA a Guate súper barato con YouBox. Regístrate usando mi código {currentUser.referralCode} y obtén beneficios en tu primer paquete."
                          </p>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(`¡Hola! Estoy trayendo mis compras de USA a Guate súper barato con YouBox. Regístrate usando mi código ${currentUser.referralCode} y obtén beneficios en tu primer paquete.`);
                              alert("Mensaje copiado al portapapeles");
                            }}
                            className="w-full py-2 bg-brand-gray-dark text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors"
                          >
                            <Copy size={14} /> Copiar Mensaje
                          </button>
                        </div>
                        
                        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                          <p className="text-xs text-blue-400 mb-2 font-bold uppercase">Tu Link Directo</p>
                          <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-blue-100">
                            <span className="text-xs font-mono text-blue-800 truncate">youboxgt.com/join/{currentUser.referralCode}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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

            {/* Estimator Tab */}
            {activeTab === 'estimator' && (
              <motion.div key="estimator-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EstimatorView currentUser={currentUser} />
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
        {filtered.map(p => {
          const referralCount = partners.filter(r => r.sponsorId === p.id).length;
          return (
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
                    p.isActive ? 'bg-green-50 text-green-600 border-green-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'
                  )}>
                    {p.isActive ? 'Activo' : 'Inactivo'}
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
                    <span className="text-gray-400">Saldo Principal</span>
                    <span className="font-bold text-brand-gray-dark">Q{p.walletBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Saldo Referidos</span>
                    <span className="font-bold text-indigo-600">Q{p.referralBalance.toFixed(2)}</span>
                  </div>
                  {p.frozenBalance > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-yellow-600">Saldo Congelado</span>
                      <span className="font-bold text-yellow-600">Q{p.frozenBalance.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Miembros de Red</span>
                    <span className="font-bold text-brand-gray-dark">{referralCount}</span>
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
          );
        })}
      </div>
    </div>
  );
}

function AdminDashboard({ partners, transactions }: { partners: UserProfile[], transactions: Transaction[] }) {
  const stats = useMemo(() => {
    const totalBalance = partners.reduce((acc, p) => acc + p.walletBalance, 0);
    const totalReferralBalance = partners.reduce((acc, p) => acc + p.referralBalance, 0);
    const totalFrozen = partners.reduce((acc, p) => acc + p.frozenBalance, 0);
    const totalLbs = partners.reduce((acc, p) => acc + p.totalLbsThisMonth, 0);
    const totalNetworkLbs = partners.reduce((acc, p) => acc + p.referralLbsThisMonth, 0);
    const pendingApprovals = transactions.filter(t => t.status === 'pending').length;
    const commissions = transactions.filter(t => t.type === 'referral_commission');
    const totalCommissionsPaid = commissions.reduce((acc, t) => acc + t.amount, 0);
    return { totalBalance, totalReferralBalance, totalFrozen, totalLbs, totalNetworkLbs, pendingApprovals, totalPartners: partners.length, totalCommissionsPaid };
  }, [partners, transactions]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-brand-gray-dark italic">YouBox <span className="text-brand-orange">Command Center</span></h1>
        <p className="text-gray-400">Visión global de socios, flujo de carga y el ecosistema de referidos.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Users className="text-blue-500" size={24} />} label="Socios Totales" value={stats.totalPartners.toString()} footer="Registrados en plataforma" />
        <StatCard icon={<TrendingUp className="text-brand-orange" size={24} />} label="Volumen Global" value={`${stats.totalLbs} lbs`} footer="Este mes" />
        <StatCard icon={<Wallet className="text-green-600" size={24} />} label="Capital Socios" value={`Q${stats.totalBalance.toLocaleString()}`} footer="Saldo principal total" />
        <StatCard icon={<CheckCircle2 className="text-yellow-600" size={24} />} label="Pendientes" value={stats.pendingApprovals.toString()} footer="Cargas de saldo por validar" />
      </div>

      {/* Networking Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-l-4 border-indigo-500">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Comisiones Pagadas</p>
          <p className="text-3xl font-black text-indigo-600">Q{stats.totalCommissionsPaid.toFixed(2)}</p>
          <p className="text-[9px] text-gray-300 mt-1">Total acumulado de referidos</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-blue-500">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">En Billeteras de Red</p>
          <p className="text-3xl font-black text-blue-600">Q{stats.totalReferralBalance.toFixed(2)}</p>
          <p className="text-[9px] text-gray-300 mt-1">Disponible para transferencia</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-yellow-500">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Saldo Congelado</p>
          <p className="text-3xl font-black text-yellow-600">Q{stats.totalFrozen.toFixed(2)}</p>
          <p className="text-[9px] text-gray-300 mt-1">Por socios inactivos</p>
        </div>
      </div>

      <div className="glass-card p-8 shadow-sm">
        <h3 className="font-bold text-xl mb-6 text-brand-gray-dark">Actividad Reciente de Red</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase font-black tracking-widest text-gray-300 border-b border-gray-100">
                <th className="pb-4">Socio</th>
                <th className="pb-4">Volumen</th>
                <th className="pb-4">Red (lbs)</th>
                <th className="pb-4">Nivel</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 text-right">Saldo Principal</th>
                <th className="pb-4 text-right">Saldo Red</th>
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
                  <td className="py-4 text-sm text-indigo-600 font-mono font-bold">{p.referralLbsThisMonth} lbs</td>
                  <td className="py-4">
                    <span className="text-[10px] font-black text-brand-orange uppercase tracking-wider">{p.level}</span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                       <div className={cn("w-1.5 h-1.5 rounded-full", p.isActive ? 'bg-green-500' : 'bg-yellow-500')} />
                       <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">{p.isActive ? 'Activo' : 'Inactivo'}</span>
                    </div>
                  </td>
                  <td className="py-4 text-right font-black text-sm text-brand-gray-dark">Q{p.walletBalance.toFixed(2)}</td>
                  <td className="py-4 text-right font-bold text-sm text-indigo-600">Q{p.referralBalance.toFixed(2)}</td>
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

interface QuoteItem {
  id: string;
  description: string;
  value: string;
  weight: string;
}

function EstimatorView({ currentUser }: { currentUser: UserProfile }) {
  const [items, setItems] = useState<QuoteItem[]>([
    { id: '1', description: '', value: '', weight: '' }
  ]);
  const [origin, setOrigin] = useState<Origin>(Origin.LAREDO);
  const [exchangeRate, setExchangeRate] = useState('8.00');
  const [includeInsurance, setIncludeInsurance] = useState(false);
  const [localDelivery, setLocalDelivery] = useState('');
  const [clientName, setClientName] = useState('');

  const parsedExchangeRate = parseFloat(exchangeRate) || 8.0;
  const shippingRate = origin === Origin.LAREDO ? 80 : 35;

  const itemCalculations = items.map(item => {
    const valUSD = parseFloat(item.value) || 0;
    const w = parseFloat(item.weight) || 0;
    const valGTQ = valUSD * parsedExchangeRate;
    const itemTax = valGTQ * 0.12;
    const itemShipping = w * shippingRate;
    return {
      ...item,
      valGTQ,
      itemTax,
      itemShipping,
      itemTotal: valGTQ + itemTax + itemShipping
    };
  });

  const subtotalValueGTQ = itemCalculations.reduce((acc, curr) => acc + curr.valGTQ, 0);
  const totalTax = itemCalculations.reduce((acc, curr) => acc + curr.itemTax, 0);
  const totalShipping = itemCalculations.reduce((acc, curr) => acc + curr.itemShipping, 0);
  const totalWeight = itemCalculations.reduce((acc, curr) => acc + (parseFloat(curr.weight) || 0), 0);
  const totalValueUSD = itemCalculations.reduce((acc, curr) => acc + (parseFloat(curr.value) || 0), 0);
  
  const insuranceAmount = includeInsurance ? (subtotalValueGTQ * 0.05) : 0;
  const deliveryAmount = parseFloat(localDelivery) || 0;
  
  const finalTotal = subtotalValueGTQ + totalTax + totalShipping + insuranceAmount + deliveryAmount;

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', value: '', weight: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof QuoteItem, val: string) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: val } : i));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const dateStr = new Date().toLocaleDateString();
    let message = `COTIZACION DE IMPORTACION - YOUBOX\n`;
    message += `Fecha: ${dateStr}\n`;
    if (clientName) message += `Cliente: ${clientName}\n`;
    message += `-----------------------------------\n`;
    
    itemCalculations.forEach((item, idx) => {
      message += `${idx + 1}. ${item.description || 'Producto'} | $${parseFloat(item.value || '0').toFixed(2)} USD | ${item.weight || '0'} lbs\n`;
    });
    
    message += `-----------------------------------\n`;
    message += `RESUMEN DE COSTOS\n`;
    message += `Flete Internacional: Q${totalShipping.toFixed(2)}\n`;
    message += `Impuestos (12%): Q${totalTax.toFixed(2)}\n`;
    if (includeInsurance) message += `Seguro (5%): Q${insuranceAmount.toFixed(2)}\n`;
    if (deliveryAmount > 0) message += `Entrega Local: Q${deliveryAmount.toFixed(2)}\n`;
    message += `-----------------------------------\n`;
    message += `TOTAL ESTIMADO: Q${finalTotal.toFixed(2)}\n\n`;
    message += `* Esta cotización es un estimado basado en tarifas estándar de importación al público. Los costos finales pueden variar según el peso real y ajustes aduanales.`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="space-y-8 estimator-container">
      <header className="hide-on-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-gray-dark italic">Cotizador <span className="text-brand-orange">Inteligente</span></h1>
          <p className="text-gray-400">Calcula tus costos de importación y genera un presupuesto formal.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleWhatsApp}
            className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2 shadow-md border-none"
          >
            <MessageSquare size={18} /> Enviar WhatsApp
          </button>
          <button 
            onClick={handlePrint}
            className="btn-primary flex items-center gap-2 shadow-md"
          >
            <Download size={18} /> Imprimir PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Formulario */}
        <div className="xl:col-span-3 space-y-6 hide-on-print">
          <div className="glass-card p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-brand-gray-dark">Detalles de la Cotización</h3>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <label className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Tasa (Q)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={exchangeRate} 
                    onChange={e => setExchangeRate(e.target.value)} 
                    className="w-16 text-right font-bold text-sm border-b border-gray-200 focus:border-brand-orange outline-none" 
                  />
                </div>
                <div className="flex flex-col items-end">
                  <label className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Origen</label>
                  <select 
                    value={origin} 
                    onChange={e => setOrigin(e.target.value as Origin)} 
                    className="font-bold text-sm border-b border-gray-200 focus:border-brand-orange outline-none bg-transparent"
                  >
                    <option value={Origin.LAREDO}>Laredo (USA)</option>
                    <option value={Origin.MEXICO}>México</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
               <div className="space-y-2">
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-[.2em] pl-1">Nombre del Cliente (Opcional)</label>
                  <input 
                    type="text" 
                    value={clientName} 
                    onChange={e => setClientName(e.target.value)} 
                    placeholder="Ej: Maria Lopez" 
                    className="w-full input-field text-sm font-bold" 
                  />
               </div>
            </div>

            <div className="space-y-4">
              <div className="hidden md:grid grid-cols-12 gap-4 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <div className="col-span-6">Descripción / Link</div>
                <div className="col-span-3 text-center">Valor (USD)</div>
                <div className="col-span-2 text-center">Peso (Lb)</div>
                <div className="col-span-1"></div>
              </div>
              
              {items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 group relative">
                  <div className="md:col-span-6">
                    <label className="md:hidden text-[9px] font-black text-gray-400 uppercase mb-1 block">Producto {idx + 1}</label>
                    <input 
                      type="text" 
                      value={item.description} 
                      onChange={e => updateItem(item.id, 'description', e.target.value)} 
                      placeholder="https://amazon.com/..." 
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:border-brand-orange outline-none" 
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="md:hidden text-[9px] font-black text-gray-400 uppercase mb-1 block">Valor USD</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                      <input 
                        type="number" 
                        value={item.value} 
                        onChange={e => updateItem(item.id, 'value', e.target.value)} 
                        placeholder="0.00" 
                        className="w-full bg-white border border-gray-200 rounded-xl pl-6 pr-3 py-2 text-sm font-bold focus:border-brand-orange outline-none text-right" 
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="md:hidden text-[9px] font-black text-gray-400 uppercase mb-1 block">Peso Lb</label>
                    <input 
                      type="number" 
                      value={item.weight} 
                      onChange={e => updateItem(item.id, 'weight', e.target.value)} 
                      placeholder="0.0" 
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:border-brand-orange outline-none text-center" 
                    />
                  </div>
                  <div className="md:col-span-1 flex items-center justify-center">
                    <button 
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="p-2 text-gray-300 hover:text-red-500 disabled:opacity-0 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              <button 
                onClick={addItem}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-400 font-bold hover:border-brand-orange hover:text-brand-orange transition-all text-sm group"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Agregar otro producto
              </button>
            </div>
          </div>

          <div className="glass-card p-6 shadow-sm">
            <h3 className="font-bold text-lg text-brand-gray-dark mb-4">Servicios Adicionales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:border-brand-orange/30 transition-all">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    checked={includeInsurance} 
                    onChange={e => setIncludeInsurance(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-brand-orange focus:ring-brand-orange accent-brand-orange" 
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-brand-gray-dark">Seguro de Protección</p>
                  <p className="text-[10px] text-gray-400 uppercase font-black">5% sobre el valor del producto</p>
                </div>
                {includeInsurance && <div className="text-sm font-black text-brand-orange">Q{insuranceAmount.toFixed(2)}</div>}
              </label>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                <div className="p-2 bg-white rounded-lg border border-gray-100">
                  <Truck size={18} className="text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-brand-gray-dark">Entrega a Domicilio</p>
                  <p className="text-[10px] text-gray-400 uppercase font-black">Costo fijo en Quetzales</p>
                </div>
                <div className="relative w-24">
                  <span className="absolute left-3 top-2.5 text-gray-400 text-xs font-bold">Q</span>
                  <input 
                    type="number" 
                    value={localDelivery} 
                    onChange={e => setLocalDelivery(e.target.value)} 
                    placeholder="0.00" 
                    className="w-full bg-white border border-gray-200 rounded-xl pl-7 pr-3 py-2 text-sm font-bold focus:border-brand-orange outline-none text-right" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vista de Cotización (PDF) */}
        <div className="xl:col-span-2 print-area bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-xl relative overflow-hidden h-fit">
           <div className="absolute top-0 right-0 w-48 h-48 bg-brand-orange/5 rounded-bl-full -z-10"></div>
           
           <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
              <div>
                <div className="w-14 h-14 orange-gradient rounded-2xl flex items-center justify-center font-black text-2xl text-white mb-4 shadow-lg">YB</div>
                <h2 className="text-2xl font-black text-brand-gray-dark uppercase tracking-tight">Cotización de Envío</h2>
                <p className="text-xs text-gray-400 mt-1 font-medium">Asesor: {currentUser.name}</p>
                <p className="text-[10px] text-brand-orange font-bold uppercase tracking-widest">{currentUser.level}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fecha de Emisión</p>
                <p className="text-sm font-bold text-brand-gray-dark">{new Date().toLocaleDateString()}</p>
                {clientName && (
                  <div className="mt-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cliente</p>
                    <p className="text-sm font-black text-brand-gray-dark">{clientName}</p>
                  </div>
                )}
              </div>
           </div>

           <div className="space-y-6 mb-10">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                      <th className="pb-3">Descripción</th>
                      <th className="pb-3 text-center">Peso</th>
                      <th className="pb-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {itemCalculations.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="py-3 pr-4">
                          <p className="text-xs font-bold text-brand-gray-dark truncate max-w-[150px]">
                            {item.description || `Producto ${idx + 1}`}
                          </p>
                        </td>
                        <td className="py-3 text-center">
                          <p className="text-xs font-medium text-gray-500">{item.weight || 0} lb</p>
                        </td>
                        <td className="py-3 text-right">
                          <p className="text-xs font-bold text-brand-gray-dark">${parseFloat(item.value || '0').toFixed(2)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Logística</p>
                   <p className="text-sm font-bold text-brand-gray-dark">{totalWeight.toFixed(1)} lbs desde {origin}</p>
                   <p className="text-[10px] text-gray-500 mt-1">Tarifa: Q{shippingRate}/lb</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Tipo de Cambio</p>
                   <p className="text-sm font-bold text-brand-gray-dark">Q{parsedExchangeRate.toFixed(2)}</p>
                   <p className="text-[10px] text-gray-500 mt-1">Valor Total: ${totalValueUSD.toFixed(2)} USD</p>
                </div>
              </div>
           </div>

           <div className="space-y-3 border-t-2 border-gray-100 pt-6 mb-10">
              <div className="flex justify-between text-sm">
                 <span className="text-gray-500 font-medium">Flete Internacional</span>
                 <span className="font-bold text-brand-gray-dark">Q{totalShipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                 <span className="text-gray-500 font-medium">Impuestos Aduanales (12%)</span>
                 <span className="font-bold text-brand-gray-dark">Q{totalTax.toFixed(2)}</span>
              </div>
              {includeInsurance && (
                <div className="flex justify-between text-sm">
                   <span className="text-gray-500 font-medium">Seguro de Protección (5%)</span>
                   <span className="font-bold text-brand-gray-dark">Q{insuranceAmount.toFixed(2)}</span>
                </div>
              )}
              {deliveryAmount > 0 && (
                <div className="flex justify-between text-sm">
                   <span className="text-gray-500 font-medium">Entrega Local</span>
                   <span className="font-bold text-brand-gray-dark">Q{deliveryAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl pt-5 border-t border-dashed border-gray-200 mt-2">
                 <span className="font-black text-brand-gray-dark uppercase tracking-tight">Total Estimado</span>
                 <div className="text-right">
                    <span className="font-black text-brand-orange">Q{finalTotal.toFixed(2)}</span>
                    <p className="text-[8px] text-gray-400 font-black uppercase tracking-[0.2em] leading-none mt-1">Quetzales Exactos</p>
                 </div>
              </div>
           </div>

           <div className="bg-gray-50 p-4 rounded-2xl mb-8">
             <p className="text-[9px] text-gray-400 italic leading-relaxed text-center">
                * Esta cotización es un estimado basado en tarifas estándar de importación al público. Los costos finales pueden variar ligeramente según el peso real verificado en bodega y ajustes aduanales vigentes al momento de la importación.
             </p>
           </div>

           <div className="flex flex-col gap-3 hide-on-print">
             <button 
               onClick={handleWhatsApp}
               className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-green-700 transition-all"
             >
               <MessageSquare size={18} /> Enviar a WhatsApp
             </button>
             <button 
               onClick={handlePrint}
               className="w-full btn-primary py-4 text-sm flex items-center justify-center gap-2 shadow-lg"
             >
               <Download size={18} /> Descargar PDF / Imprimir
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onLogin }: { onLogin: (email: string, password?: string) => 'success' | 'pending' | 'not_found' | 'invalid_password' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Ingresa tu correo electr\u00f3nico'); return; }
    if (!password) { setError('Ingresa tu contraseña'); return; }
    
    const result = await onLogin(email, password);
    if (result === 'not_found') {
      setError('No se encontr\u00f3 una cuenta con ese correo electr\u00f3nico.');
    } else if (result === 'invalid_password') {
      setError('Contraseña incorrecta.');
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    await onLogin(demoEmail, demoPassword);
  }

  return (
    <motion.form 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      onSubmit={handleSubmit} 
      className="space-y-6"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-[.2em] pl-1">Correo Electrónico</label>
          <input 
            type="email" 
            placeholder="socio@ejemplo.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full input-field text-sm font-bold placeholder:text-gray-300"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-[10px] text-gray-400 font-black uppercase tracking-[.2em] pl-1 flex justify-between">
            <span>Contraseña</span>
          </label>
          <input 
            type="password" 
            placeholder="Tu número de WhatsApp" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full input-field text-sm font-bold placeholder:text-gray-300"
          />
          <p className="text-[10px] text-gray-400 italic text-right">Tu contraseña inicial es tu número de WhatsApp</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-xs text-red-600 font-medium">{error}</p>
        </div>
      )}

      <button type="submit" className="btn-primary w-full py-4 text-base font-black shadow-lg">
        Ingresar
      </button>

      <div className="text-center">
        <p className="text-[10px] text-gray-400 leading-relaxed">
          <strong>Demo rápido:</strong> haz clic en <br/>
          <button type="button" onClick={() => handleDemoLogin('juan@example.com', '+502 5555-1234')} className="font-mono text-brand-orange hover:underline mt-1">juan@example.com</button> o <br/>
          <button type="button" onClick={() => handleDemoLogin('admin@youboxgt.com', '+502 2222-0000')} className="font-mono text-brand-orange hover:underline">admin@youboxgt.com</button>
        </p>
      </div>
    </motion.form>
  );
}

function RegisterForm({ onRegister }: { onRegister: (name: string, email: string, phone: string, sponsorCode: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sponsorCode, setSponsorCode] = useState('');
  const [depositProof, setDepositProof] = useState<File | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !phone) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    if (!depositProof) {
      setError('Debes adjuntar la boleta de depósito de Q500.00.');
      return;
    }
    if (!acceptedTerms) {
      setError('Debes aceptar los Términos y Condiciones para continuar.');
      return;
    }
    await onRegister(name, email, phone, sponsorCode);
  };

  return (
    <motion.form 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onSubmit={handleSubmit} 
      className="space-y-5"
    >
      <div className="space-y-2">
        <label className="text-[10px] text-gray-400 font-black uppercase tracking-[.2em] pl-1">Nombre Completo</label>
        <input 
          type="text" 
          placeholder="Ej: María López"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full input-field text-sm font-bold placeholder:text-gray-300"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-gray-400 font-black uppercase tracking-[.2em] pl-1">Correo Electrónico</label>
        <input 
          type="email" 
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full input-field text-sm font-bold placeholder:text-gray-300"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-gray-400 font-black uppercase tracking-[.2em] pl-1">Teléfono</label>
        <input 
          type="tel" 
          placeholder="+502 5555-1234"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full input-field text-sm font-bold placeholder:text-gray-300"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-gray-400 font-black uppercase tracking-[.2em] pl-1">Código de Patrocinador <span className="text-gray-300">(Opcional)</span></label>
        <input 
          type="text" 
          placeholder="Ej: YBP001-REF"
          value={sponsorCode}
          onChange={(e) => setSponsorCode(e.target.value)}
          className="w-full input-field text-sm font-bold placeholder:text-gray-300 font-mono"
        />
      </div>

      {/* Deposit Receipt Upload */}
      <div className="space-y-2">
        <label className="text-[10px] text-gray-400 font-black uppercase tracking-[.2em] pl-1">Boleta de Deposito (Q500.00) <span className="text-red-400">*</span></label>
        <div className="relative group">
          <input 
            type="file" 
            accept="image/*,.pdf"
            onChange={(e) => setDepositProof(e.target.files?.[0] || null)}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className={`input-field border-dashed py-6 flex flex-col items-center justify-center gap-2 transition-all ${depositProof ? 'border-green-300 bg-green-50/50' : 'border-gray-200 bg-gray-50 group-hover:border-brand-orange/30'}`}>
            {depositProof ? (
              <>
                <CheckCircle2 className="text-green-500" size={28} />
                <p className="text-xs font-bold text-brand-gray-dark">{depositProof.name}</p>
                <p className="text-[10px] text-gray-400 italic">Pulsa para cambiar</p>
              </>
            ) : (
              <>
                <PlusCircle className="text-gray-300 group-hover:text-brand-orange/50 transition-colors" size={28} />
                <p className="text-xs font-medium text-gray-400 text-center">Adjuntar Boleta / Captura del Deposito</p>
                <p className="text-[10px] text-gray-300">Formatos: JPG, PNG, PDF</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange accent-brand-orange"
          />
          <span className="text-xs text-gray-500 leading-relaxed">
            Acepto los{' '}
            <a 
              href="https://partners.youboxgt.com/privacy-policy/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-orange font-bold hover:underline"
            >
              Términos y Condiciones
            </a>{' '}
            del programa de Socios y confirmo el depósito de Q500.00 de activación.
          </span>
        </label>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-xs text-red-600 font-medium">{error}</p>
        </div>
      )}

      <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
        <p className="text-xs text-yellow-700 font-bold mb-1">Activacion Requiere Verificacion</p>
        <p className="text-[11px] text-yellow-600 leading-relaxed">
          Tu cuenta se activara una vez que el equipo de YouBox verifique tu boleta de deposito. Inicias en nivel <strong>Master Box</strong> con vigencia de <strong>2 meses</strong>.
        </p>
      </div>

      <button 
        type="submit" 
        className="btn-primary w-full py-4 text-base font-black shadow-lg"
      >
        Enviar Solicitud de Socio
      </button>
    </motion.form>
  );
}
