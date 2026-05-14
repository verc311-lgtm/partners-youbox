/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserLevel {
  EXPLORADOR = "Explorador",
  EMPRENDEDOR = "Emprendedor",
  MASTER_BOX = "Master Box",
}

export enum Origin {
  LAREDO = "Laredo",
  MEXICO = "México",
}

export interface LevelConfig {
  minLbs: number;
  maxLbs: number;
  rates: {
    [key in Origin]: number;
  };
}

export const LEVEL_MAP: Record<UserLevel, LevelConfig> = {
  [UserLevel.EXPLORADOR]: {
    minLbs: 1,
    maxLbs: 10,
    rates: {
      [Origin.LAREDO]: 75,
      [Origin.MEXICO]: 33,
    },
  },
  [UserLevel.EMPRENDEDOR]: {
    minLbs: 11,
    maxLbs: 30,
    rates: {
      [Origin.LAREDO]: 70,
      [Origin.MEXICO]: 30,
    },
  },
  [UserLevel.MASTER_BOX]: {
    minLbs: 31,
    maxLbs: Infinity,
    rates: {
      [Origin.LAREDO]: 65,
      [Origin.MEXICO]: 25,
    },
  },
};

export interface Transaction {
  id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'referral_commission' | 'transfer_to_main' | 'payment';
  description: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'failed';
  frozen?: boolean;
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum UserRole {
  PARTNER = 'partner',
  ADMIN = 'admin',
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'frozen_commission' | 'bonus' | 'general' | 'level_downgrade';
  isRead: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  level: UserLevel;
  role: UserRole;
  status: UserStatus;
  isActive: boolean; // True if they have paid their Q500 activation
  sponsorId?: string; // ID of the parent who referred them
  walletBalance: number;
  referralBalance: number; // Networking Wallet
  frozenBalance: number; // Frozen commissions if not active
  totalLbsThisMonth: number;
  referralLbsThisMonth: number;
  earningsThisMonth: number;
  totalEarnings: number;
  inTransitLbs: number;
  partnerCode: string; // e.g. YBP001
  referralCode: string; // e.g. YBP001-REF
  registeredAt: string;
  depositSlipUrl?: string;
  gracePeriodEnd: string; // 2 months after registration — Master Box grace
  acceptedTerms: boolean;
  password?: string; // Hashed password in real life, plaintext for demo
  notifications: Notification[];
}

export type PackageStatus = 'Registrado' | 'En Ruta' | 'Aduana' | 'Entregado' | 'PAGADO';

export interface Package {
  id: string;
  ownerId: string; // User ID who owns this package
  trackingNumber: string;
  weight: number;
  origin: Origin;
  cost: number;
  status: PackageStatus;
  createdAt: string;
}
