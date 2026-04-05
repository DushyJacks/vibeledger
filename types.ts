
export interface Creator {
  address: string;
  name: string;
  role: string;
  share: number; // Percentage (0-100)
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string;
  ipfsHash: string;
  coverArt: string;
  creators: Creator[];
  registeredAt: number;
  pricePerLicense: number; // in ETH/POL
  totalRoyalties: number;
  status: 'Active' | 'Pending' | 'Archived';
  // Blockchain specific metadata for transparency
  blockNumber?: number;
  contractAddress?: string;
  blockchainTrackId?: number; // Actual track ID from smart contract
  txHash?: string;
}

export interface RoyaltyPayment {
  id: string;
  trackId: string;
  payer: string;
  amount: number;
  timestamp: number;
  txHash: string;
}

export interface LicenseRecord {
  id: string;
  trackId: string;
  licensee: string;
  type: 'Streaming' | 'Commercial' | 'Exclusive';
  timestamp: number;
  txHash: string;
  // UI helpers
  trackTitle?: string;
  artistName?: string;
  coverArt?: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  MARKETPLACE = 'MARKETPLACE',
  REGISTER = 'REGISTER',
  PROFILE = 'PROFILE',
  NOTIFICATIONS = 'NOTIFICATIONS',
  SETTINGS = 'SETTINGS',
  LICENSES = 'LICENSES'
}
