import { ethers, Contract, JsonRpcSigner } from 'ethers';

/**
 * Smart Contract ABIs (Application Binary Interface)
 * These define the contract methods and events
 * Generated from compiled contracts
 */

const TRACK_REGISTRY_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"trackId","type":"uint256"},{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"string","name":"ipfsHash","type":"string"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"TrackRegistered","type":"event"},{"inputs":[{"internalType":"uint256","name":"trackId","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"addRoyalties","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"getOwnerTracks","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTotalTracks","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"trackId","type":"uint256"}],"name":"getTrack","outputs":[{"internalType":"string","name":"ipfsHash","type":"string"},{"internalType":"uint256","name":"pricePerLicense","type":"uint256"},{"internalType":"address[]","name":"creators","type":"address[]"},{"internalType":"uint256[]","name":"shares","type":"uint256[]"},{"internalType":"uint256","name":"totalRoyalties","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"ownerTracks","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"ipfsHash","type":"string"},{"internalType":"uint256","name":"pricePerLicense","type":"uint256"},{"internalType":"address[]","name":"creators","type":"address[]"},{"internalType":"uint256[]","name":"shares","type":"uint256[]"}],"name":"registerTrack","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"tracks","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"string","name":"ipfsHash","type":"string"},{"internalType":"uint256","name":"pricePerLicense","type":"uint256"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"totalRoyalties","type":"uint256"},{"internalType":"uint256","name":"registeredAt","type":"uint256"},{"internalType":"bool","name":"exists","type":"bool"}],"stateMutability":"view","type":"function"}];

const LICENSE_MANAGER_ABI = [{"inputs":[{"internalType":"address","name":"_trackRegistry","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"licenseId","type":"uint256"},{"indexed":true,"internalType":"uint256","name":"trackId","type":"uint256"},{"indexed":true,"internalType":"address","name":"licensee","type":"address"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"LicensePurchased","type":"event"},{"inputs":[{"internalType":"uint256","name":"licenseId","type":"uint256"}],"name":"getLicense","outputs":[{"internalType":"uint256","name":"trackId","type":"uint256"},{"internalType":"address","name":"licensee","type":"address"},{"internalType":"uint8","name":"licenseType","type":"uint8"},{"internalType":"uint256","name":"purchasedAt","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getUserLicenses","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"licenses","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"trackId","type":"uint256"},{"internalType":"address","name":"licensee","type":"address"},{"internalType":"enum LicenseManager.LicenseType","name":"licenseType","type":"uint8"},{"internalType":"uint256","name":"purchasedAt","type":"uint256"},{"internalType":"bool","name":"exists","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"trackId","type":"uint256"},{"internalType":"uint8","name":"licenseType","type":"uint8"}],"name":"purchaseLicense","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"trackRegistry","outputs":[{"internalType":"contract ITrackRegistry","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"userLicenses","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];

// RoyaltyDistributor is unused in the current app flow, keeping for future use
const ROYALTY_DISTRIBUTOR_ABI = [
  'function distributeRoyalties(uint256 trackId) external payable',
  'function getTrackRoyalties(uint256 trackId) external view returns (uint256)',
  'event RoyaltiesDistributed(uint256 indexed trackId, uint256 amount, uint256 timestamp)'
];

/**
 * Smart Contract Service
 * Handles all blockchain contract interactions
 */
class ContractService {
  private trackRegistryAddress: string;
  private royaltyDistributorAddress: string;
  private licenseManagerAddress: string;

  constructor() {
    // Load contract addresses from environment variables
    // In production, these should be your deployed contract addresses
    this.trackRegistryAddress = (import.meta as any).env?.VITE_TRACK_REGISTRY_CONTRACT || '';
    this.royaltyDistributorAddress = (import.meta as any).env?.VITE_ROYALTY_DISTRIBUTOR_CONTRACT || '';
    this.licenseManagerAddress = (import.meta as any).env?.VITE_LICENSE_MANAGER_CONTRACT || '';
    
    console.log('ContractService initialized:', {
      trackRegistryAddress: this.trackRegistryAddress,
      royaltyDistributorAddress: this.royaltyDistributorAddress,
      licenseManagerAddress: this.licenseManagerAddress
    });
  }

  /**
   * Check if contracts are deployed
   */
  areContractsDeployed(): boolean {
    return [
      this.trackRegistryAddress,
      this.royaltyDistributorAddress,
      this.licenseManagerAddress
    ].every(addr => /^0x[a-fA-F0-9]{40}$/.test(addr));
  }

  /**
   * Get contract addresses for verification
   */
  getContractAddresses() {
    return {
      trackRegistry: this.trackRegistryAddress,
      licenseManager: this.licenseManagerAddress,
      royaltyDistributor: this.royaltyDistributorAddress
    };
  }

  /**
   * Register a new track on the blockchain
   */
  async registerTrack(
    signer: JsonRpcSigner,
    ipfsHash: string,
    pricePerLicense: string, // in ETH
    creators: string[],
    shares: number[]
  ): Promise<{ txHash: string; trackId: number }> {
    try {
      if (!this.areContractsDeployed()) {
        throw new Error('Smart contracts not deployed. Please deploy contracts first.');
      }

      // Validate inputs
      console.log('RegisterTrack inputs:', {
        ipfsHash,
        pricePerLicense,
        creators,
        shares,
        contractAddress: this.trackRegistryAddress
      });

      if (creators.length === 0) {
        throw new Error('At least one creator is required');
      }
      if (creators.length !== shares.length) {
        throw new Error('Number of creators must match number of shares');
      }
      
      const totalShares = shares.reduce((a, b) => a + b, 0);
      if (totalShares !== 100) {
        throw new Error(`Total shares must be 100, got ${totalShares}`);
      }

      const contract = new Contract(this.trackRegistryAddress, TRACK_REGISTRY_ABI, signer);
      
      // Convert price to wei
      const priceInWei = ethers.parseEther(pricePerLicense);
      
      // Ensure shares are plain numbers (not BigInt)
      const sharesArray = shares.map(s => Number(s));
      
      // Call contract method with plain numbers (ethers.js handles conversion)
      console.log('Calling registerTrack with:', {
        ipfsHash,
        priceInWei: priceInWei.toString(),
        creators,
        shares: sharesArray
      });
      
      // Register with actual price for production
      const tx = await contract.registerTrack(ipfsHash, priceInWei, creators, sharesArray, {
        gasLimit: 500000, // 500k gas
        gasPrice: ethers.parseUnits('50', 'gwei') // 50 gwei - reasonable for Polygon
      });
      
      console.log('Transaction sent:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait(1); // Wait for 1 block confirmation
      
      if (!receipt) {
        throw new Error('Transaction failed - no receipt received');
      }
      
      console.log('Transaction confirmed in block:', receipt.blockNumber, 'Hash:', receipt.hash);
      
      // Parse event to get track ID
      const event = receipt?.logs?.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'TrackRegistered';
        } catch {
          return false;
        }
      });
      
      let trackId = 0;
      if (event) {
        try {
          const parsed = contract.interface.parseLog(event);
          trackId = parsed ? Number(parsed.args[0]) : 0;
        } catch (e) {
          console.warn('Could not parse track ID from event', e);
        }
      }

      return {
        txHash: receipt.hash,
        trackId
      };
    } catch (error: any) {
      console.error('Track registration error details:', {
        message: error.message,
        code: error.code,
        reason: error.reason,
        data: error.data,
        fullError: error
      });
      
      // Provide more helpful error messages
      if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient MATIC balance. Please get test MATIC from the faucet.');
      }
      if (error.message.includes('IPFS hash required')) {
        throw new Error('Invalid IPFS hash. Please try again.');
      }
      if (error.message.includes('Shares must sum to 100')) {
        throw new Error('Share percentages must total exactly 100%.');
      }
      throw new Error(error.reason || error.message || 'Failed to register track on blockchain');
    }
  }

  /**
   * Purchase a license for a track
   */
  async purchaseLicense(
    signer: JsonRpcSigner,
    trackId: number,
    licenseType: number, // 0: Streaming, 1: Commercial, 2: Exclusive
    price: string // in ETH
  ): Promise<{ txHash: string; licenseId: number }> {
    try {
      if (!this.areContractsDeployed()) {
        throw new Error('Smart contracts not deployed. Please deploy contracts first.');
      }

      // Validate inputs
      console.log('PurchaseLicense inputs:', {
        trackId,
        licenseType,
        price,
        licenseManagerAddress: this.licenseManagerAddress
      });

      if (trackId === 0 || isNaN(trackId)) {
        throw new Error(`Invalid track ID: ${trackId}. Please select a valid track.`);
      }

      // First, verify the track exists in the registry
      console.log(`Verifying track ${trackId} exists in registry before license purchase...`);
      try {
        const registryContract = new Contract(this.trackRegistryAddress, TRACK_REGISTRY_ABI, signer);
        const trackData = await registryContract.getTrack(trackId);
        console.log('✅ Track verified in registry:', {
          ipfsHash: trackData[0],
          pricePerLicense: trackData[1].toString(),
          creators: trackData[2].length,
          totalRoyalties: trackData[4].toString()
        });
      } catch (verifyError: any) {
        console.error('❌ Track verification failed:', verifyError.message);
        throw new Error(`Track ${trackId} not found in registry. It may not have been registered successfully.`);
      }

      const contract = new Contract(this.licenseManagerAddress, LICENSE_MANAGER_ABI, signer);
      
      // Convert price to wei
      const priceInWei = ethers.parseEther(price);
      
      console.log('Calling purchaseLicense with:', {
        trackId,
        licenseType,
        priceInWei: priceInWei.toString()
      });
      
      // Send transaction with payment
      // Send license purchase with actual payment value
      const tx = await contract.purchaseLicense(trackId, licenseType, {
        value: priceInWei,
        gasLimit: 300000, // Explicit gas limit
        gasPrice: ethers.parseUnits('50', 'gwei') // 50 gwei gas price
      });
      
      console.log('Transaction sent:', tx.hash);
      
      const receipt = await tx.wait(1);
      
      if (!receipt) {
        throw new Error('Transaction failed - no receipt received');
      }
      
      console.log('Transaction confirmed in block:', receipt.blockNumber, 'Hash:', receipt.hash);
      
      // Parse event to get license ID
      const event = receipt?.logs?.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'LicensePurchased';
        } catch {
          return false;
        }
      });
      
      let licenseId = 0;
      if (event) {
        try {
          const parsed = contract.interface.parseLog(event);
          licenseId = parsed ? Number(parsed.args[0]) : 0;
        } catch (e) {
          console.warn('Could not parse license ID from event', e);
        }
      }

      return {
        txHash: receipt.hash,
        licenseId
      };
    } catch (error: any) {
      console.error('License purchase error details:', {
        message: error.message,
        code: error.code,
        reason: error.reason,
        data: error.data,
        fullError: error
      });
      
      if (error.message.includes('Invalid track ID')) {
        throw error;
      }
      if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient MATIC balance to purchase license.');
      }
      throw new Error(error.reason || error.message || 'Failed to purchase license');
    }
  }

  /**
   * Distribute royalties for a track
   */
  async distributeRoyalties(
    signer: JsonRpcSigner,
    trackId: number,
    amount: string // in ETH
  ): Promise<string> {
    try {
      if (!this.areContractsDeployed()) {
        throw new Error('Smart contracts not deployed. Please deploy contracts first.');
      }

      const contract = new Contract(this.royaltyDistributorAddress, ROYALTY_DISTRIBUTOR_ABI, signer);
      
      const tx = await contract.distributeRoyalties(trackId, {
        value: ethers.parseEther(amount)
      });
      
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error: any) {
      console.error('Royalty distribution error:', error);
      throw new Error(error.reason || error.message || 'Failed to distribute royalties');
    }
  }

  /**
   * Get track information from blockchain
   */
  async getTrackInfo(
    signer: JsonRpcSigner,
    trackId: number
  ): Promise<{
    ipfsHash: string;
    price: string;
    creators: string[];
    shares: number[];
    totalRoyalties: string;
  }> {
    try {
      if (!this.areContractsDeployed()) {
        throw new Error('Smart contracts not deployed');
      }

      const contract = new Contract(this.trackRegistryAddress, TRACK_REGISTRY_ABI, signer);
      const [ipfsHash, price, creators, shares, totalRoyalties] = await contract.getTrack(trackId);
      
      return {
        ipfsHash,
        price: ethers.formatEther(price),
        creators,
        shares: shares.map((s: any) => Number(s)),
        totalRoyalties: ethers.formatEther(totalRoyalties)
      };
    } catch (error: any) {
      console.error('Get track info error:', error);
      throw new Error(error.reason || error.message || 'Failed to fetch track info');
    }
  }

  /**
   * Get user's licenses
   */
  async getUserLicenses(
    signer: JsonRpcSigner,
    userAddress: string
  ): Promise<number[]> {
    try {
      if (!this.areContractsDeployed()) {
        return [];
      }

      const contract = new Contract(this.licenseManagerAddress, LICENSE_MANAGER_ABI, signer);
      const licenseIds = await contract.getUserLicenses(userAddress);
      
      return licenseIds.map((id: any) => Number(id));
    } catch (error: any) {
      console.error('Get user licenses error:', error);
      return [];
    }
  }

  /**
   * Check if a track exists in the registry (for debugging)
   */
  async verifyTrackExists(signer: JsonRpcSigner, trackId: number): Promise<boolean> {
    try {
      const contract = new Contract(this.trackRegistryAddress, TRACK_REGISTRY_ABI, signer);
      
      console.log(`Checking if track ${trackId} exists in registry ${this.trackRegistryAddress}...`);
      
      const trackData = await contract.getTrack(trackId);
      
      console.log('Track data retrieved:', {
        trackId,
        ipfsHash: trackData[0],
        pricePerLicense: trackData[1].toString(),
        creatorsCount: trackData[2].length,
        sharesCount: trackData[3].length,
        totalRoyalties: trackData[4].toString()
      });
      
      return true;
    } catch (error: any) {
      console.error(`Track ${trackId} verification failed:`, error.message || error);
      return false;
    }
  }

  /**
   * Simple test to read total tracks from registry (for debugging)
   */
  async testReadContract(signer: JsonRpcSigner): Promise<number> {
    try {
      console.log('Testing contract read...');
      const contract = new Contract(this.trackRegistryAddress, TRACK_REGISTRY_ABI, signer);
      
      const total = await contract.getTotalTracks();
      const totalNum = Number(total);
      
      console.log('✅ Contract read successful! Total tracks:', totalNum);
      return totalNum;
    } catch (error: any) {
      console.error('❌ Contract read failed:', error.message || error);
      return -1;
    }
  }

  /**
   * Get total tracks in registry (for debugging)
   */
  async getTotalTracksInRegistry(signer: JsonRpcSigner): Promise<number> {
    try {
      const contract = new Contract(this.trackRegistryAddress, TRACK_REGISTRY_ABI, signer);
      const total = await contract.getTotalTracks();
      console.log('Total tracks in registry:', total.toString());
      return Number(total);
    } catch (error: any) {
      console.error('Get total tracks error:', error);
      return 0;
    }
  }
}

export const contractService = new ContractService();
