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
  type: 'deposit' | 'withdrawal';
  description: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'failed';
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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  level: UserLevel;
  role: UserRole;
  status: UserStatus;
  walletBalance: number;
  totalLbsThisMonth: number;
  referralLbsThisMonth: number;
  earningsThisMonth: number;
  totalEarnings: number;
  inTransitLbs: number;
  partnerCode: string; // e.g. YB-1234
  referralCode: string; // e.g. YBR-1234
  registeredAt: string;
}

export type PackageStatus = 'Registrado' | 'En Ruta' | 'Aduana' | 'Entregado';

export interface Package {
  id: string;
  trackingNumber: string;
  weight: number;
  origin: Origin;
  cost: number;
  status: PackageStatus;
  createdAt: string;
}
