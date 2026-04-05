
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Wallet, Music, BarChart3, PlusCircle, LayoutDashboard, 
  Search, Bell, Settings as SettingsIcon, ArrowUpRight,
  ShieldCheck, Loader2, CheckCircle2, DollarSign, Disc, Users,
  Hash, Database, Link as LinkIcon, User, CreditCard, ChevronRight,
  Zap, BellRing, Lock, Globe, Cpu, Moon, Sun, Smartphone, Copy, Check, LogOut,
  Filter, SortDesc, SortAsc, Clock, Tag, Plus, Trash2, FileCheck, ExternalLink,
  Shield, Activity, Award, Edit3, Camera, Image as ImageIcon, X
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip
} from 'recharts';

import { ViewState, Track, RoyaltyPayment, Creator, LicenseRecord } from './types';
import { NAV_ITEMS, INITIAL_TRACKS, MOCK_PAYMENTS } from './constants';
import { Button, Card, Input, Badge, StatCard, Progress } from './components/UI';
import { TrackCard } from './components/TrackCard';
import { web3Service } from './services/web3Service';
import { ipfsService } from './services/ipfsService';
import { contractService } from './services/contractService';

const explorerBase = ((import.meta as any).env?.VITE_BLOCK_EXPLORER_URL || 'https://amoy.polygonscan.com').replace(/\/$/, '');

const getTxUrl = (hash: string) => `${explorerBase}/tx/${hash}`;
const getAddressUrl = (addr: string) => `${explorerBase}/address/${addr}`;

const App: React.FC = () => {
  // --- Web3 State ---
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [chainId, setChainId] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Persistent State Initialization ---
  const [activeView, setActiveView] = useState<ViewState>(ViewState.DASHBOARD);
  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem('vibeledger_tracks');
    return saved ? JSON.parse(saved) : INITIAL_TRACKS;
  });
  const [payments, setPayments] = useState<RoyaltyPayment[]>(() => {
    const saved = localStorage.getItem('vibeledger_payments');
    return saved ? JSON.parse(saved) : MOCK_PAYMENTS;
  });
  const [licenses, setLicenses] = useState<LicenseRecord[]>(() => {
    const saved = localStorage.getItem('vibeledger_licenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [isWalletConnected, setIsWalletConnected] = useState(() => {
    return localStorage.getItem('vibeledger_wallet_connected') === 'true';
  });

  // Demo mode - for testing without testnet funds
  const [isDemoMode, setIsDemoMode] = useState(() => {
    return localStorage.getItem('vibeledger_demo_mode') === 'true';
  });
  
  // Profile State - Removed Mock Content
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('vibeledger_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Unnamed Creator',
      bio: 'Welcome to VibeLedger. Update your profile to get started.',
      avatar: '',
      banner: ''
    };
  });

  // Settings persistence
  const [userSettings, setUserSettings] = useState(() => {
    const saved = localStorage.getItem('vibeledger_settings');
    return saved ? JSON.parse(saved) : {
      realTimePayouts: true,
      publicProfile: true,
      notificationsEnabled: true,
      network: 'Polygon Amoy',
      twoFactor: false,
      autoSyncIPFS: true
    };
  });

  // --- Marketplace Filter & Sort State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<{key: 'registeredAt' | 'pricePerLicense', direction: 'asc' | 'desc'}>({
    key: 'registeredAt',
    direction: 'desc'
  });
  const [priceFilter] = useState<{min: number, max: number}>({ min: 0, max: 2.0 });

  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // --- Registration Form State ---
  const [newTrack, setNewTrack] = useState({
    title: '',
    artist: '',
    genre: 'Lo-Fi',
    price: 0.05,
    creators: [{ address: walletAddress || '', name: 'You', role: 'Main Artist', share: 100 }] as Creator[]
  });
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);

  // --- Web3 Effects ---
  useEffect(() => {
    // Load wallet address from localStorage only (no auto-connect)
    const savedAddress = localStorage.getItem('vibeledger_wallet_address');
    if (savedAddress) {
      setWalletAddress(savedAddress);
    }

    // Listen for account changes
    web3Service.onAccountsChanged((accounts) => {
      if (accounts.length === 0) {
        handleDisconnectWallet();
      } else {
        setWalletAddress(accounts[0]);
        loadWalletBalance(accounts[0]);
      }
    });

    // Listen for chain changes
    web3Service.onChainChanged((chainId) => {
      setChainId(parseInt(chainId, 16));
      window.location.reload(); // Reload on network change
    });
  }, []);

  // Update new track creator address when wallet connects
  useEffect(() => {
    if (walletAddress && newTrack.creators.length > 0) {
      setNewTrack(prev => ({
        ...prev,
        creators: prev.creators.map((c, i) => 
          i === 0 ? { ...c, address: walletAddress } : c
        )
      }));
    }
  }, [walletAddress]);

  // --- Persistence Effects ---
  useEffect(() => {
    try {
      localStorage.setItem('vibeledger_tracks', JSON.stringify(tracks));
    } catch (e) {
      console.error('Failed to save tracks:', e);
    }
  }, [tracks]);

  useEffect(() => {
    try {
      localStorage.setItem('vibeledger_payments', JSON.stringify(payments));
    } catch (e) {
      console.error('Failed to save payments:', e);
    }
  }, [payments]);

  useEffect(() => {
    try {
      localStorage.setItem('vibeledger_licenses', JSON.stringify(licenses));
    } catch (e) {
      console.error('Failed to save licenses:', e);
    }
  }, [licenses]);

  useEffect(() => {
    try {
      localStorage.setItem('vibeledger_wallet_connected', isWalletConnected.toString());
      if (isWalletConnected && walletAddress) {
        localStorage.setItem('vibeledger_wallet_address', walletAddress);
      } else {
        localStorage.removeItem('vibeledger_wallet_address');
      }
    } catch (e) {
      console.error('Failed to save wallet connection status:', e);
    }
  }, [isWalletConnected, walletAddress]);

  useEffect(() => {
    try {
      localStorage.setItem('vibeledger_settings', JSON.stringify(userSettings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, [userSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('vibeledger_profile', JSON.stringify(userProfile));
    } catch (e) {
      console.error('Failed to save profile:', e);
      showNotification('Profile too large. Try smaller images.', 'info');
    }
  }, [userProfile]);

  // --- Derived State ---
  const totalRoyalties = useMemo(() => {
    const total = tracks.reduce((sum, t) => sum + (t.totalRoyalties || 0), 0);
    return isNaN(total) ? 0 : total;
  }, [tracks]);
  
  const genresList = useMemo(() => {
    const g = Array.from(new Set(tracks.map(t => t.genre)));
    return ['All', ...g];
  }, [tracks]);

  const filteredAndSortedTracks = useMemo(() => {
    return tracks
      .filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.artist.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGenre = selectedGenre === 'All' || t.genre === selectedGenre;
        const matchesPrice = t.pricePerLicense >= priceFilter.min && t.pricePerLicense <= priceFilter.max;
        return matchesSearch && matchesGenre && matchesPrice;
      })
      .sort((a, b) => {
        const valA = a[sortConfig.key] || 0;
        const valB = b[sortConfig.key] || 0;
        if (sortConfig.direction === 'asc') return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
      });
  }, [tracks, searchQuery, selectedGenre, sortConfig, priceFilter]);

  const chartData = useMemo(() => {
    if (payments.length === 0) return [];
    return payments.map((p, i) => ({
      name: new Date(p.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      total: parseFloat(payments.slice(0, i + 1).reduce((s, curr) => s + curr.amount, 0).toFixed(3))
    })).slice(-8);
  }, [payments]);

  const totalSplitPercentage = useMemo(() => {
    return newTrack.creators.reduce((sum, c) => sum + (c.share || 0), 0);
  }, [newTrack.creators]);

  const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr.trim());

  const isRegisterFormValid = useMemo(() => {
    return isWalletConnected
      && totalSplitPercentage === 100
      && newTrack.title.trim().length > 0
      && newTrack.artist.trim().length > 0
      && newTrack.price > 0
      && newTrack.creators.every(c => c.address.trim().length === 0 || isValidAddress(c.address));
  }, [isWalletConnected, totalSplitPercentage, newTrack.title, newTrack.artist, newTrack.price, newTrack.creators]);

  // --- Handlers ---
  const loadWalletBalance = async (address: string) => {
    try {
      const balance = await web3Service.getBalance(address);
      setWalletBalance(parseFloat(balance).toFixed(4));
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const handleConnectWallet = async () => {
    if (!web3Service.isMetaMaskInstalled()) {
      showNotification('MetaMask not installed. Visit metamask.io to install.', 'info');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      const { address, chainId: connectedChainId } = await web3Service.connectWallet();
      setWalletAddress(address);
      setChainId(connectedChainId);
      setIsWalletConnected(true);
      
      await loadWalletBalance(address);
      
      showNotification('Wallet connected successfully', 'success');
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      showNotification(error.message || 'Failed to connect wallet', 'info');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectWallet = () => {
    web3Service.disconnect();
    setWalletAddress('');
    setWalletBalance('0');
    setChainId(0);
    setIsWalletConnected(false);
    showNotification('Wallet disconnected', 'info');
  };

  const handleTestContractRead = async () => {
    if (!isWalletConnected) {
      showNotification('Please connect wallet first', 'info');
      return;
    }

    try {
      setIsProcessing(true);
      const signer = await web3Service.getSigner();
      const totalTracks = await contractService.testReadContract(signer);
      
      if (totalTracks >= 0) {
        showNotification(`✅ Contract is accessible! Total tracks: ${totalTracks}`, 'success');
      } else {
        showNotification('❌ Failed to read contract', 'info');
      }
    } catch (error: any) {
      console.error('Test error:', error);
      showNotification(`Test failed: ${error.message}`, 'info');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTrackForm = () => {
    setNewTrack({
      title: '',
      artist: '',
      genre: 'Lo-Fi',
      price: 0.05,
      creators: [{ address: walletAddress || '', name: 'You', role: 'Main Artist', share: 100 }]
    });
    setAudioFile(null);
    setCoverArtFile(null);
  };

  const showNotification = (message: string, type: 'success' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleRegisterTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWalletConnected) {
      showNotification('Please connect wallet first', 'info');
      return;
    }
    if (totalSplitPercentage !== 100) {
      showNotification('Ownership splits must total exactly 100%', 'info');
      return;
    }
    if (!newTrack.title.trim() || !newTrack.artist.trim()) {
      showNotification('Title and artist are required.', 'info');
      return;
    }
    if (newTrack.price <= 0) {
      showNotification('License price must be greater than zero.', 'info');
      return;
    }
    
    // Validate and sanitize addresses
    const creatorAddresses = newTrack.creators.map(c => {
      const trimmed = c.address.trim();
      if (!trimmed || !isValidAddress(trimmed)) {
        throw new Error(`Invalid wallet address: ${trimmed}. Must be valid Ethereum address (0x...)`);
      }
      // Normalize to lowercase
      return trimmed.toLowerCase();
    });

    setIsProcessing(true);
    try {
      // Step 1: Upload files to IPFS
      showNotification('Uploading to IPFS...', 'info');
      
      let audioHash = '';
      let coverArtHash = '';
      
      if (audioFile) {
        audioHash = await ipfsService.uploadFile(audioFile);
      }
      
      if (coverArtFile) {
        coverArtHash = await ipfsService.uploadFile(coverArtFile);
      }
      
      // Step 2: Create metadata
      const metadata = {
        title: newTrack.title,
        artist: newTrack.artist,
        genre: newTrack.genre,
        audioHash,
        coverArtHash,
        creators: newTrack.creators
      };
      
      const metadataHash = await ipfsService.uploadJSON(metadata);
      
      // Step 3: Register on blockchain (if contracts deployed)
      let txHash = '';
      let trackId = 0;
      let blockNumber = 0;
      
      if (contractService.areContractsDeployed()) {
        showNotification('Registering on blockchain...', 'info');
        const signer = web3Service.getSigner();
        const result = await contractService.registerTrack(
          signer,
          metadataHash,
          newTrack.price.toString(),
          creatorAddresses,
          newTrack.creators.map(c => c.share)
        );
        txHash = result.txHash;
        trackId = result.trackId;
        
        // Get block number
        const provider = web3Service.getProvider();
        const receipt = await provider.getTransactionReceipt(txHash);
        blockNumber = receipt?.blockNumber || 0;
      } else {
        throw new Error('Smart contracts not deployed. Please check your network configuration.');
      }
      
      // Step 4: Create track object
      const track: Track = {
        id: `TRK-${Date.now()}`,  // Local display ID
        blockchainTrackId: trackId,  // Actual blockchain track ID (0, 1, 2, etc.)
        title: newTrack.title,
        artist: newTrack.artist,
        genre: newTrack.genre,
        ipfsHash: metadataHash,
        coverArt: coverArtHash ? ipfsService.getGatewayUrl(coverArtHash) : 
                 `https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400`,
        creators: newTrack.creators,
        registeredAt: Date.now(),
        pricePerLicense: newTrack.price,
        totalRoyalties: 0,
        status: 'Active',
        blockNumber,
        contractAddress: (import.meta as any).env.VITE_TRACK_REGISTRY_CONTRACT,
        txHash // Store transaction hash for verification
      };
      
      setTracks([track, ...tracks]);
      showNotification(`Track registered successfully! Blockchain ID: ${trackId}`, 'success');
      setActiveView(ViewState.DASHBOARD);
      
      // Reset form
      setNewTrack({
        title: '',
        artist: '',
        genre: 'Lo-Fi',
        price: 0.05,
        creators: [{ address: walletAddress, name: 'You', role: 'Main Artist', share: 100 }]
      });
      setAudioFile(null);
      setCoverArtFile(null);
      
    } catch (error: any) {
      console.error('Track registration error:', error);
      showNotification(error.message || 'Failed to register track', 'info');
    } finally {
      setIsProcessing(false);
    }
  };

  const addCreatorSplit = () => {
    setNewTrack({
      ...newTrack,
      creators: [...newTrack.creators, { address: '', name: '', role: 'Collaborator', share: 0 }]
    });
  };

  const removeCreatorSplit = (index: number) => {
    if (newTrack.creators.length === 1) return;
    const updated = [...newTrack.creators];
    updated.splice(index, 1);
    setNewTrack({ ...newTrack, creators: updated });
  };

  const updateCreatorField = (index: number, field: keyof Creator, value: string | number) => {
    const updated = [...newTrack.creators];
    updated[index] = { ...updated[index], [field]: value };
    setNewTrack({ ...newTrack, creators: updated });
  };

  const handleLicenseTrack = async (track: Track) => {
    if (!isWalletConnected) {
      showNotification('Please connect wallet first', 'info');
      return;
    }
    
    // Use blockchain track ID if available, otherwise parse from display ID
    const trackIdNumeric = track.blockchainTrackId ?? parseInt(track.id.replace('TRK-', ''), 10);
    
    if (isNaN(trackIdNumeric)) {
      showNotification('Invalid track identifier. Please refresh and try again.', 'info');
      return;
    }
    
    setIsProcessing(true);
    try {
      if (!contractService.areContractsDeployed()) {
        throw new Error('Smart contracts not deployed. Please check your network configuration.');
      }

      showNotification('Processing license purchase...', 'info');
      const signer = web3Service.getSigner();
      const result = await contractService.purchaseLicense(
        signer,
        trackIdNumeric,
        0, // 0 = Streaming license
        track.pricePerLicense.toString()
      );
      
      const txHash = result.txHash;
      const licenseId = result.licenseId;
      
      const payment: RoyaltyPayment = {
        id: `TX-${Math.floor(Math.random() * 10000)}`,
        trackId: track.id,
        payer: walletAddress,
        amount: track.pricePerLicense,
        timestamp: Date.now(),
        txHash
      };
      
      const license: LicenseRecord = {
        id: `LIC-${licenseId}`,
        trackId: track.id,
        licensee: walletAddress,
        type: 'Streaming',
        timestamp: Date.now(),
        txHash,
        trackTitle: track.title,
        artistName: track.artist,
        coverArt: track.coverArt
      };
      
      setPayments([...payments, payment]);
      setLicenses([license, ...licenses]);
      setTracks(tracks.map(t => t.id === track.id ? { ...t, totalRoyalties: t.totalRoyalties + track.pricePerLicense } : t));
      
      await loadWalletBalance(walletAddress);
      showNotification(`License secured for ${track.title}!`, 'success');
      
    } catch (error: any) {
      console.error('License purchase error:', error);
      showNotification(error.message || 'Failed to purchase license', 'info');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setUserSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Image too large. Please use an image under 5MB.', 'info');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Compress image: max dimensions
          const maxWidth = type === 'avatar' ? 400 : 1200;
          const maxHeight = type === 'avatar' ? 400 : 400;
          
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG with quality compression
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          setUserProfile((prev: any) => ({
            ...prev,
            [type]: compressedDataUrl
          }));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    showNotification('Address copied to clipboard', 'info');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F7] flex selection:bg-[#4FD1FF]/30">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-white/5 sticky top-0 h-screen bg-[#0A0A0A] z-40">
        <div className="p-8 pb-12 cursor-pointer" onClick={() => setActiveView(ViewState.DASHBOARD)}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#4FD1FF] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(79,209,255,0.3)]">
              <Music className="text-[#0A0A0A]" size={18} strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold tracking-tight">VibeLedger</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-[14px] ${
                activeView === item.id 
                  ? 'bg-white/5 text-[#F5F5F7] font-medium' 
                  : 'text-[#71717A] hover:text-[#F5F5F7] hover:bg-white/[0.02]'
              }`}
            >
              <span className={activeView === item.id ? 'text-[#4FD1FF]' : 'text-inherit opacity-70'}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/5">
          {isWalletConnected ? (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_8px_#4ADE80]" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-[#71717A] font-bold uppercase tracking-widest">Network</p>
                <p className="text-xs font-semibold text-[#F5F5F7]">{userSettings.network}</p>
              </div>
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] text-[#71717A] font-bold uppercase tracking-widest">Account</p>
                <div className="flex items-center justify-between bg-black/40 rounded-lg p-2 border border-white/5">
                  <a href={walletAddress ? getAddressUrl(walletAddress) : undefined} target="_blank" rel="noreferrer" className="text-[11px] font-mono text-[#4FD1FF] truncate mr-2 hover:underline">
                    {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected'}
                  </a>
                  <button onClick={copyAddress} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-[#71717A] hover:text-[#4FD1FF]">
                    {isCopied ? <Check size={12} className="text-[#4ADE80]" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
              <button onClick={handleDisconnectWallet} className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest text-[#71717A] hover:text-red-400 transition-colors pt-2 border-t border-white/5 mt-2">
                <LogOut size={12} /> Disconnect
              </button>
            </div>
          ) : (
            <Button variant="primary" className="w-full h-11" onClick={handleConnectWallet}>
              Connect Wallet
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-20 px-8 flex items-center justify-between border-b border-white/5 bg-[#0A0A0A]/50 backdrop-blur-xl sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4 text-sm font-medium">
             <span className="text-[#71717A] uppercase tracking-widest">{NAV_ITEMS.find(n => n.id === activeView)?.label || activeView}</span>
          </div>
          <div className="flex items-center gap-4">
            <button className={`p-2 transition-colors relative ${activeView === ViewState.NOTIFICATIONS ? 'text-[#4FD1FF]' : 'text-[#71717A] hover:text-[#F5F5F7]'}`} onClick={() => setActiveView(ViewState.NOTIFICATIONS)}>
              <Bell size={18} />
              {payments.length > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#4ADE80] rounded-full border border-[#0A0A0A]" />}
            </button>
            <button className={`p-2 transition-colors ${activeView === ViewState.SETTINGS ? 'text-[#4FD1FF]' : 'text-[#71717A] hover:text-[#F5F5F7]'}`} onClick={() => setActiveView(ViewState.SETTINGS)}>
              <SettingsIcon size={18} />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-[#F5F5F7]">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isWalletConnected ? 'bg-[#4ADE80]' : 'bg-[#FACC15]'}`}></span>
                <span className="font-mono text-[11px] truncate max-w-[140px]">
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected'}
                </span>
              </div>
              <span className="text-[#71717A]">|
              </span>
              <span className="text-[11px] text-[#A1A1AA]">{walletBalance} POL</span>
              <Button variant="outline" className="h-8 px-3 text-[11px]" onClick={isWalletConnected ? handleDisconnectWallet : handleConnectWallet}>
                {isWalletConnected ? 'Disconnect' : 'Connect'}
              </Button>
              {isWalletConnected && (
                <Button 
                  variant="outline" 
                  className="h-8 px-3 text-[11px]" 
                  onClick={handleTestContractRead}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 size={12} className="animate-spin" /> : 'Test Contract'}
                </Button>
              )}
            </div>
            <div className={`w-8 h-8 rounded-full bg-[#181818] border transition-all cursor-pointer overflow-hidden flex items-center justify-center ${activeView === ViewState.PROFILE ? 'border-[#4FD1FF] ring-2 ring-[#4FD1FF]/20' : 'border-white/10 hover:border-white/20'}`} onClick={() => setActiveView(ViewState.PROFILE)}>
              {userProfile.avatar ? (
                <img src={userProfile.avatar} className="w-full h-full object-cover" />
              ) : (
                <User size={16} className={activeView === ViewState.PROFILE ? 'text-[#4FD1FF]' : 'text-[#71717A]'} />
              )}
            </div>
          </div>
        </header>

        <div className="p-8 lg:p-12 max-w-[1400px] w-full mx-auto">
          {/* Dashboard View */}
          {activeView === ViewState.DASHBOARD && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Net Royalties" value={`${totalRoyalties.toFixed(2)} POL`} trend={payments.length > 0 ? "+100%" : "0%"} />
                <StatCard label="Catalog Size" value={tracks.length} />
                <StatCard label="Licenses Held" value={licenses.length} />
                <StatCard label="Network Health" value="Stable" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 overflow-hidden pb-0">
                  <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                      <h2 className="text-xl font-medium text-[#F5F5F7]">Portfolio Performance</h2>
                      <p className="text-sm text-[#71717A]">Revenue accumulation across all licensed assets.</p>
                    </div>
                  </div>
                  <div className="h-[320px] -mx-6 flex items-center justify-center relative">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4FD1FF" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#4FD1FF" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#3F3F46" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                          <YAxis hide />
                          <Tooltip cursor={{ stroke: '#4FD1FF', strokeWidth: 1 }} contentStyle={{ backgroundColor: '#181818', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                          <Area type="monotone" dataKey="total" stroke="#4FD1FF" strokeWidth={2} fillOpacity={1} fill="url(#colorArea)" animationDuration={1500} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center space-y-2 pb-12">
                        <p className="text-[#71717A] text-sm">No transaction data available yet.</p>
                        <Button variant="outline" onClick={() => setActiveView(ViewState.MARKETPLACE)} className="text-xs">Browse Assets</Button>
                      </div>
                    )}
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-medium">Activity Log</h2>
                    <ArrowUpRight size={16} className="text-[#71717A]" />
                  </div>
                  <div className="space-y-6">
                    {payments.length > 0 ? (
                      payments.slice(0, 5).reverse().map((p) => (
                        <div key={p.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[#4FD1FF]">
                              <Disc size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#F5F5F7] truncate max-w-[120px]">{tracks.find(t => t.id === p.trackId)?.title || "Unknown"}</p>
                              <p className="text-[11px] text-[#71717A]">{new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-[#4FD1FF]">+{p.amount}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center">
                        <p className="text-xs text-[#71717A]">No recent activity.</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Marketplace View */}
          {activeView === ViewState.MARKETPLACE && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                <div className="space-y-1 shrink-0">
                  <h1 className="text-3xl font-medium tracking-tight">Discover Assets</h1>
                  <p className="text-[#71717A]">Acquire verified music rights directly from creators.</p>
                </div>
                <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A] group-focus-within:text-[#4FD1FF] transition-colors" size={16} />
                  <Input 
                    placeholder="Search by title or artist..." 
                    className="pl-11 h-12 bg-[#121212] border-white/5 focus:border-[#4FD1FF]/30 transition-all" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Card className="p-4 bg-white/[0.02]">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                     <Filter size={14} className="text-[#71717A]" />
                     <div className="flex gap-1.5 overflow-x-auto no-scrollbar max-w-md">
                       {genresList.map(genre => (
                         <button
                          key={genre}
                          onClick={() => setSelectedGenre(genre)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border ${
                            selectedGenre === genre 
                            ? 'bg-[#4FD1FF]/10 border-[#4FD1FF]/30 text-[#4FD1FF]' 
                            : 'bg-white/5 border-transparent text-[#71717A] hover:bg-white/10 hover:text-white'
                          }`}
                         >
                           {genre}
                         </button>
                       ))}
                     </div>
                  </div>
                  <div className="h-4 w-px bg-white/5 hidden md:block" />
                  <div className="flex items-center gap-3">
                    <SortDesc size={14} className="text-[#71717A]" />
                    <select 
                      className="bg-transparent text-[11px] font-bold uppercase tracking-wider text-[#F5F5F7] outline-none cursor-pointer focus:text-[#4FD1FF]"
                      value={`${sortConfig.key}-${sortConfig.direction}`}
                      onChange={(e) => {
                        const [key, direction] = e.target.value.split('-') as [any, any];
                        setSortConfig({ key, direction });
                      }}
                    >
                      <option value="registeredAt-desc">Newest First</option>
                      <option value="registeredAt-asc">Oldest First</option>
                      <option value="pricePerLicense-asc">Price: Low to High</option>
                      <option value="pricePerLicense-desc">Price: High to Low</option>
                    </select>
                  </div>
                </div>
              </Card>
              {filteredAndSortedTracks.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                  {filteredAndSortedTracks.map(track => (
                    <TrackCard 
                      key={track.id} 
                      track={track} 
                      onLicense={handleLicenseTrack} 
                      onViewInfo={setSelectedTrack}
                      disabled={!isWalletConnected || isProcessing}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-32 text-center space-y-4">
                  <div className="inline-flex w-16 h-16 rounded-full bg-white/5 items-center justify-center text-[#71717A] mb-4">
                    <Search size={32} />
                  </div>
                  <h2 className="text-xl font-medium">No tracks found</h2>
                  <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedGenre('All'); }}>Clear Filters</Button>
                </div>
              )}
            </div>
          )}

          {/* Licenses View */}
          {activeView === ViewState.LICENSES && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="space-y-1">
                <h1 className="text-3xl font-medium tracking-tight">My Licenses</h1>
                <p className="text-[#71717A]">Verified digital rights records and on-chain streaming licenses.</p>
              </div>
              {licenses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {licenses.map(lic => (
                    <Card key={lic.id} className="p-0 overflow-hidden border-white/5 hover:border-[#4FD1FF]/30 transition-all group">
                      <div className="p-6 flex items-center gap-4">
                        <img src={lic.coverArt} className="w-16 h-16 rounded-xl object-cover" alt="" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold truncate text-[#F5F5F7]">{lic.trackTitle}</h3>
                          <p className="text-xs text-[#71717A]">{lic.artistName}</p>
                          <Badge variant="success" className="mt-2">Verified Owner</Badge>
                        </div>
                      </div>
                      <div className="bg-white/[0.02] p-4 border-t border-white/5 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] text-[#71717A] font-bold uppercase tracking-widest">On-Chain ID</p>
                          <p className="text-[11px] font-mono text-[#4FD1FF] opacity-70 group-hover:opacity-100 transition-opacity truncate max-w-[140px]">
                            {lic.txHash}
                          </p>
                        </div>
                        <a 
                          href={lic.txHash ? getTxUrl(lic.txHash) : undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-[#71717A] hover:text-[#F5F5F7] transition-colors"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-40 text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-white/5 mx-auto flex items-center justify-center text-[#71717A]">
                    <FileCheck size={40} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">No active licenses</h3>
                    <p className="text-[#71717A] text-sm mt-1">Acquire music rights in the marketplace to see them here.</p>
                  </div>
                  <Button variant="primary" onClick={() => setActiveView(ViewState.MARKETPLACE)}>Browse Discover</Button>
                </div>
              )}
            </div>
          )}

          {/* Asset Registration View (Rendered in-line to prevent focus loss) */}
          {activeView === ViewState.REGISTER && (
            <div className="max-w-3xl mx-auto space-y-12 animate-in zoom-in-95 duration-500 pb-20">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-medium">Asset Registration</h1>
                <p className="text-[#71717A]">Register your creative work and define on-chain ownership splits.</p>
              </div>
              <Card className="p-10 space-y-10">
                <form onSubmit={handleRegisterTrack} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#71717A] uppercase tracking-widest px-1">Track Title</label>
                      <Input required placeholder="E.g., Silicon Dream" value={newTrack.title} onChange={e => setNewTrack({...newTrack, title: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#71717A] uppercase tracking-widest px-1">Main Artist</label>
                      <Input required placeholder="E.g., Neon Pulse" value={newTrack.artist} onChange={e => setNewTrack({...newTrack, artist: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#71717A] uppercase tracking-widest px-1">Genre</label>
                      <Input placeholder="E.g., Synthwave" value={newTrack.genre} onChange={e => setNewTrack({...newTrack, genre: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#71717A] uppercase tracking-widest px-1">License Price (POL)</label>
                      <Input type="number" step="0.01" value={newTrack.price} onChange={e => setNewTrack({...newTrack, price: parseFloat(e.target.value)})} />
                    </div>
                  </div>
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <Users size={16} className="text-[#4FD1FF]" /> Ownership Splits
                        </h3>
                        <p className="text-xs text-[#71717A]">Distributed royalty shares across all contributors.</p>
                      </div>
                      <Button type="button" variant="outline" className="h-9 px-4 text-xs" onClick={addCreatorSplit}>
                        <Plus size={14} /> Add Contributor
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {newTrack.creators.map((c, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end animate-in fade-in duration-300">
                          <div className="md:col-span-3 space-y-1.5">
                            <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest px-1">Name</label>
                            <Input placeholder="Creator name" value={c.name} onChange={e => updateCreatorField(idx, 'name', e.target.value)} />
                          </div>
                          <div className="md:col-span-3 space-y-1.5">
                            <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest px-1">Wallet Address</label>
                            <Input placeholder="0x..." className="font-mono text-[11px]" value={c.address} onChange={e => updateCreatorField(idx, 'address', e.target.value)} />
                          </div>
                          <div className="md:col-span-3 space-y-1.5">
                            <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest px-1">Role</label>
                            <Input placeholder="Producer" value={c.role} onChange={e => updateCreatorField(idx, 'role', e.target.value)} />
                          </div>
                          <div className="md:col-span-2 space-y-1.5 relative">
                            <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest px-1">Share %</label>
                            <div className="relative">
                              <Input type="number" placeholder="0" className="pr-8" value={c.share} onChange={e => updateCreatorField(idx, 'share', parseInt(e.target.value) || 0)} />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] text-[11px]">%</span>
                            </div>
                          </div>
                          <div className="md:col-span-1 flex justify-center pb-1">
                            <button type="button" onClick={() => removeCreatorSplit(idx)} disabled={newTrack.creators.length === 1} className="p-2.5 rounded-xl hover:bg-red-400/10 text-[#71717A] hover:text-red-400 transition-colors disabled:opacity-0">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-500 ${totalSplitPercentage === 100 ? 'bg-[#4ADE80]/5 border-[#4ADE80]/20' : 'bg-red-400/5 border-red-400/20'}`}>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#71717A]">Total Allocation</p>
                        <p className={`text-xl font-medium ${totalSplitPercentage === 100 ? 'text-[#4ADE80]' : 'text-red-400'}`}>
                          {totalSplitPercentage}% <span className="text-xs font-normal text-[#71717A]">/ 100%</span>
                        </p>
                      </div>
                      {totalSplitPercentage === 100 ? (
                        <div className="flex items-center gap-2 text-[#4ADE80] text-xs font-medium">
                          <CheckCircle2 size={16} /> Verified
                        </div>
                      ) : (
                        <p className="text-[10px] text-red-400 font-bold uppercase tracking-tighter italic">Splits must sum to 100%</p>
                      )}
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-14 text-base font-semibold" disabled={!isRegisterFormValid || isProcessing}>
                    {!isWalletConnected ? 'CONNECT WALLET TO REGISTER' : isProcessing ? 'PROCESSING...' : 'MINT ASSET'}
                  </Button>
                </form>
              </Card>
            </div>
          )}

          {/* Profile View */}
          {activeView === ViewState.PROFILE && (
            <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
              {/* Profile Header */}
              <div className="mb-12">
                <div className="px-4 sm:px-8">
                  <div className="flex flex-col md:flex-row md:items-end gap-6">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border-4 border-[#0A0A0A] shadow-2xl flex items-center justify-center p-2 overflow-hidden group">
                        <div className="w-full h-full rounded-2xl bg-[#202020] flex items-center justify-center overflow-hidden relative">
                          {userProfile.avatar ? (
                            <img src={userProfile.avatar} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Avatar" />
                          ) : (
                            <User size={60} className="text-[#4FD1FF] transition-transform group-hover:scale-110 duration-500" />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => setIsEditingProfile(true)}>
                            <div className="text-center space-y-1">
                              <Edit3 size={24} className="text-white mx-auto" />
                              <p className="text-xs text-white font-medium">Edit</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Online Status Indicator */}
                      <div className="absolute bottom-3 right-3 w-5 h-5 bg-[#4ADE80] rounded-full border-4 border-[#0A0A0A] shadow-lg animate-pulse" />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 mb-2 space-y-3 min-w-0">
                      <div className="flex flex-col gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F5F7] break-words">
                              {userProfile.name}
                            </h1>
                            <Award size={28} className="text-[#FACC15] drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <button 
                              onClick={copyAddress}
                              className="group flex items-center gap-2 font-mono text-xs sm:text-sm text-[#4FD1FF] bg-[#4FD1FF]/5 px-3 py-1.5 rounded-lg border border-[#4FD1FF]/20 hover:bg-[#4FD1FF]/10 hover:border-[#4FD1FF]/30 transition-all"
                            >
                              <span className="truncate">{walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : 'Connect wallet'}</span>
                              {isCopied ? <Check size={14} className="text-[#4ADE80] flex-shrink-0" /> : <Copy size={14} className="opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
                            </button>
                            <Badge variant="success" className="shadow-lg">
                              <ShieldCheck size={14} /> Verified On-Chain
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          <Button variant="outline" className="h-11 px-6" onClick={() => setIsEditingProfile(true)}>
                            <Edit3 size={16} /> Edit Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Sidebar - Stats & About */}
                <div className="space-y-6">
                  {/* Portfolio Summary Card */}
                  <Card className="p-6 space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#71717A]">Portfolio Summary</h3>
                      <p className="text-2xl font-bold text-[#F5F5F7]">{totalRoyalties.toFixed(2)} <span className="text-sm text-[#4FD1FF] font-normal">POL</span></p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#4FD1FF]/5 border border-[#4FD1FF]/10 flex items-center justify-center">
                            <DollarSign size={18} className="text-[#4FD1FF]" />
                          </div>
                          <span className="text-sm text-[#A1A1AA]">Total Royalties</span>
                        </div>
                        <span className="text-[#F5F5F7] font-semibold">{totalRoyalties.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#4ADE80]/5 border border-[#4ADE80]/10 flex items-center justify-center">
                            <Music size={18} className="text-[#4ADE80]" />
                          </div>
                          <span className="text-sm text-[#A1A1AA]">Registered Tracks</span>
                        </div>
                        <span className="text-[#F5F5F7] font-semibold">{tracks.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#FACC15]/5 border border-[#FACC15]/10 flex items-center justify-center">
                            <FileCheck size={18} className="text-[#FACC15]" />
                          </div>
                          <span className="text-sm text-[#A1A1AA]">Active Licenses</span>
                        </div>
                        <span className="text-[#F5F5F7] font-semibold">{licenses.length}</span>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <p className="text-xs text-[#71717A] font-medium uppercase tracking-[0.2em]">Reputation Score</p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Progress value={92} color="bg-[#4ADE80]" />
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold text-[#4ADE80]">9.2</span>
                          <span className="text-xs text-[#71717A]">/10</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* About Card */}
                  <Card className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#4FD1FF]/5 border border-[#4FD1FF]/10 flex items-center justify-center">
                        <User size={16} className="text-[#4FD1FF]" />
                      </div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#71717A]">About</h3>
                    </div>
                    <p className="text-sm text-[#A1A1AA] leading-relaxed">{userProfile.bio}</p>
                  </Card>

                  {/* Quick Actions Card */}
                  <Card className="p-6 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#71717A] mb-2">Quick Actions</h3>
                    <Button variant="outline" className="w-full justify-start h-11" onClick={() => setActiveView(ViewState.REGISTER)}>
                      <PlusCircle size={18} /> Register New Track
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-11" onClick={() => setActiveView(ViewState.MARKETPLACE)}>
                      <Music size={18} /> Browse Marketplace
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-11" onClick={() => setActiveView(ViewState.LICENSES)}>
                      <FileCheck size={18} /> View Licenses
                    </Button>
                  </Card>
                </div>

                {/* Right Content - Active Catalog */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold tracking-tight text-[#F5F5F7]">Active Catalog</h2>
                      <p className="text-sm text-[#71717A]">Your registered tracks and ownership rights</p>
                    </div>
                    <Button className="h-11 px-6" onClick={() => setActiveView(ViewState.REGISTER)}>
                      <Plus size={18} /> New Asset
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {tracks.length > 0 ? (
                      tracks.map(t => (
                        <Card key={t.id} className="hover:bg-white/[0.04] transition-all cursor-pointer group" onClick={() => setSelectedTrack(t)}>
                          <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                              <img src={t.coverArt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-[#F5F5F7] truncate">{t.title}</h4>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-xs">{t.genre}</Badge>
                                <span className="text-xs text-[#71717A]">
                                  Registered {new Date(t.registeredAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                               <p className="text-lg font-bold text-[#4FD1FF]">{(t.totalRoyalties || 0).toFixed(2)} POL</p>
                               <p className="text-[10px] uppercase font-bold text-[#71717A] tracking-wider">Total Yield</p>
                            </div>
                            <ChevronRight size={20} className="text-[#71717A] group-hover:text-[#4FD1FF] transition-colors" />
                          </div>
                        </Card>
                      ))
                    ) : (
                      <Card className="py-32 text-center border-2 border-dashed border-white/5">
                        <div className="space-y-6">
                          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                            <Music className="text-[#71717A] opacity-30" size={40} />
                          </div>
                          <div className="space-y-2">
                            <p className="text-[#A1A1AA] font-medium">No tracks registered yet</p>
                            <p className="text-sm text-[#71717A]">Start building your music catalog on the blockchain</p>
                          </div>
                          <Button className="mx-auto" onClick={() => setActiveView(ViewState.REGISTER)}>
                            <Plus size={18} /> Register Your First Track
                          </Button>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications View */}
          {activeView === ViewState.NOTIFICATIONS && (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="space-y-1">
                <h1 className="text-3xl font-medium tracking-tight">System Feed</h1>
                <p className="text-[#71717A]">Event-driven updates from the VibeLedger network.</p>
              </div>
              <div className="space-y-4">
                {payments.length > 0 ? (
                  payments.slice().reverse().map(p => (
                    <Card key={p.id} className="flex items-center gap-6 hover:bg-white/[0.04] transition-colors border-white/5 group">
                      <div className="w-14 h-14 rounded-2xl bg-[#4ADE80]/5 border border-[#4ADE80]/10 flex items-center justify-center text-[#4ADE80] group-hover:bg-[#4ADE80]/10 transition-colors">
                        <DollarSign size={24} />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                           <p className="text-sm font-bold text-[#F5F5F7]">Royalty Settlement</p>
                           <span className="text-[10px] text-[#71717A] font-mono">{new Date(p.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm text-[#A1A1AA]">
                          Automatic payout of <span className="text-[#4FD1FF] font-medium">{p.amount} POL</span> credited for track <span className="text-white">"{tracks.find(t => t.id === p.trackId)?.title || 'Unknown'}"</span>.
                        </p>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="py-48 text-center space-y-4">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                       <BellRing size={40} className="text-[#71717A] opacity-20" />
                    </div>
                    <p className="text-[#71717A] text-sm">Your notification feed is currently clear.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings View */}
          {activeView === ViewState.SETTINGS && (
            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Preferences</h1>
                <p className="text-[#71717A] text-sm">Configure your decentralized workspace and node synchronization.</p>
              </div>
              <div className="space-y-10">
                  <section className="space-y-6">
                    <h3 className="text-xs font-bold text-[#71717A] uppercase tracking-[0.2em] px-1">Testing & Development</h3>
                    <Card className="space-y-0 p-0 overflow-hidden border-white/5 divide-y divide-white/5">
                      <div className="p-6 flex items-center justify-between group transition-colors bg-gradient-to-r from-[#1a1a2e] to-[#0a0a0a]">
                        <div className="flex items-center gap-5">
                          <div className="p-3 rounded-xl bg-[#ff6b6b]/10 text-[#ff6b6b] group-hover:bg-[#ff6b6b]/20 transition-colors">
                            <Zap size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Demo Mode</p>
                            <p className="text-[12px] text-[#71717A]">Simulate track registration & license purchases without testnet funds</p>
                          </div>
                        </div>
                        <button onClick={() => {
                          setIsDemoMode(!isDemoMode);
                          localStorage.setItem('vibeledger_demo_mode', String(!isDemoMode));
                          showNotification(isDemoMode ? 'Demo mode disabled' : 'Demo mode enabled', 'success');
                        }} className={`w-12 h-6 rounded-full transition-all relative ${isDemoMode ? 'bg-[#ff6b6b]' : 'bg-white/10'}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isDemoMode ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                    </Card>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xs font-bold text-[#71717A] uppercase tracking-[0.2em] px-1">Automation & Workflow</h3>
                    <Card className="space-y-0 p-0 overflow-hidden border-white/5 divide-y divide-white/5">
                      <div className="p-6 flex items-center justify-between group transition-colors">
                        <div className="flex items-center gap-5">
                          <div className="p-3 rounded-xl bg-white/5 text-[#4FD1FF] group-hover:bg-[#4FD1FF]/10 transition-colors">
                            <Zap size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Real-time Settlements</p>
                            <p className="text-[12px] text-[#71717A]">Distribute royalty splits the second they land on-chain.</p>
                          </div>
                        </div>
                        <button onClick={() => updateSetting('realTimePayouts', !userSettings.realTimePayouts)} className={`w-12 h-6 rounded-full transition-all relative ${userSettings.realTimePayouts ? 'bg-[#4FD1FF]' : 'bg-white/10'}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${userSettings.realTimePayouts ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                      <div className="p-6 flex items-center justify-between group transition-colors">
                        <div className="flex items-center gap-5">
                          <div className="p-3 rounded-xl bg-white/5 text-[#4FD1FF] group-hover:bg-[#4FD1FF]/10 transition-colors">
                            <Globe size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Public Metadata Hub</p>
                            <p className="text-[12px] text-[#71717A]">Allow search engines to index your verified assets via IPFS.</p>
                          </div>
                        </div>
                        <button onClick={() => updateSetting('publicProfile', !userSettings.publicProfile)} className={`w-12 h-6 rounded-full transition-all relative ${userSettings.publicProfile ? 'bg-[#4FD1FF]' : 'bg-white/10'}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${userSettings.publicProfile ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                      <div className="p-6 flex items-center justify-between group transition-colors">
                        <div className="flex items-center gap-5">
                          <div className="p-3 rounded-xl bg-white/5 text-[#4FD1FF] group-hover:bg-[#4FD1FF]/10 transition-colors">
                            <Bell size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Smart Notifications</p>
                            <p className="text-[12px] text-[#71717A]">Push alerts for network activity and licensing events.</p>
                          </div>
                        </div>
                        <button onClick={() => updateSetting('notificationsEnabled', !userSettings.notificationsEnabled)} className={`w-12 h-6 rounded-full transition-all relative ${userSettings.notificationsEnabled ? 'bg-[#4FD1FF]' : 'bg-white/10'}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${userSettings.notificationsEnabled ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                    </Card>
                  </section>
                  <section className="space-y-6">
                    <h3 className="text-xs font-bold text-[#71717A] uppercase tracking-[0.2em] px-1">Network Infrastructure</h3>
                    <Card elevated className="p-0 overflow-hidden divide-y divide-white/5 border-[#4FD1FF]/10">
                      <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div className="p-3 rounded-xl bg-[#4FD1FF]/5 text-[#4FD1FF]">
                            <Database size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Blockchain Endpoint</p>
                            <p className="text-[11px] font-mono text-[#71717A]">{userSettings.network}</p>
                          </div>
                        </div>
                        <Badge variant="outline">Connected</Badge>
                      </div>
                    </Card>
                  </section>
                  <section className="pt-6 space-y-6">
                    <div className="h-px bg-white/5" />
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Session Management</p>
                        <p className="text-xs text-[#71717A]">Terminate active wallet session and clear cache.</p>
                      </div>
                      <Button variant="outline" className="w-full md:w-auto text-red-400 border-red-400/20 hover:bg-red-400/5 px-8" onClick={() => {
                        if(confirm('Wipe local ledger data?')) { localStorage.clear(); window.location.reload(); }
                      }}>
                        Factory Reset
                      </Button>
                    </div>
                    <p className="text-center text-[10px] text-[#71717A] uppercase font-bold tracking-[0.3em] pt-4 opacity-50">
                      VibeLedger Ecosystem • Build 1.4.0
                    </p>
                  </section>
                </div>
              </div>
          )}
        </div>
      </main>

      {/* Notifications Overlay */}
      {notification && (
        <div className="fixed bottom-10 right-10 z-[70] animate-in slide-in-from-right duration-500">
           <div className="bg-[#181818] border border-white/10 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
             <CheckCircle2 className="text-[#4ADE80]" size={20} />
             <div className="space-y-0.5">
               <p className="text-sm font-medium">{notification.message}</p>
               <p className="text-[10px] text-[#71717A] tracking-wider uppercase">On-chain transaction successful</p>
             </div>
           </div>
        </div>
      )}

      {/* Edit Profile Modal (Rendered in-line with direct JSX to prevent focus loss) */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
          <div className="absolute inset-0" onClick={() => setIsEditingProfile(false)} />
          <Card className="relative max-w-2xl w-full p-0 overflow-hidden animate-in zoom-in-95 shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Profile</h2>
              <button onClick={() => setIsEditingProfile(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-[#71717A] hover:text-[#F5F5F7]">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <label className="text-xs font-bold text-[#71717A] uppercase tracking-widest px-1">Profile Banner</label>
                <div className="h-32 w-full rounded-2xl bg-[#0A0A0A] border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer group hover:border-[#4FD1FF]/50 transition-all overflow-hidden relative" onClick={(e) => { const input = (e.currentTarget as HTMLElement).querySelector('input[type="file"]') as HTMLInputElement; input?.click(); }}>
                  {userProfile.banner ? <img src={userProfile.banner} className="w-full h-full object-cover" /> : <>
                    <ImageIcon className="text-[#71717A] group-hover:text-[#4FD1FF] transition-colors" size={24} />
                    <span className="text-xs text-[#71717A] mt-2 group-hover:text-[#F5F5F7]">Recommended: 1500x500px</span>
                  </>}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={20} />
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleProfileImageUpload(e, 'banner')} />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-[#71717A] uppercase tracking-widest px-1">Profile Picture</label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-[#0A0A0A] border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer group hover:border-[#4FD1FF]/50 transition-all overflow-hidden relative" onClick={(e) => { const input = (e.currentTarget as HTMLElement).querySelector('input[type="file"]') as HTMLInputElement; input?.click(); }}>
                    {userProfile.avatar ? <img src={userProfile.avatar} className="w-full h-full object-cover" /> : <User className="text-[#71717A] group-hover:text-[#4FD1FF]" size={24} />}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={20} />
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleProfileImageUpload(e, 'avatar')} />
                  </div>
                  <div className="flex-1 space-y-1">
                     <p className="text-sm font-medium">Update Avatar</p>
                     <p className="text-xs text-[#71717A]">Square JPG, PNG or GIF.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#71717A] uppercase tracking-widest px-1">Display Name</label>
                  <Input placeholder="Enter your name" value={userProfile.name} onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#71717A] uppercase tracking-widest px-1">Bio</label>
                  <textarea 
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#4FD1FF]/50 transition-all placeholder:text-[#71717A] min-h-[100px] resize-none"
                    placeholder="Tell the community about yourself..."
                    value={userProfile.bio}
                    onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="p-8 border-t border-white/5 flex gap-4">
              <Button className="flex-1 h-12" onClick={() => { setIsEditingProfile(false); showNotification('Profile updated', 'success'); }}>Save Changes</Button>
              <Button variant="outline" className="flex-1 h-12" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Track Details Modal */}
      {selectedTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/40">
          <div className="absolute inset-0" onClick={() => setSelectedTrack(null)} />
          <Card className="relative max-w-4xl w-full p-0 overflow-hidden animate-in zoom-in-95">
            <div className="grid grid-cols-1 md:grid-cols-5 h-[600px]">
              <div className="md:col-span-2 relative">
                <img src={selectedTrack.coverArt} className="w-full h-full object-cover" alt="" />
                <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-[#4FD1FF] flex items-center justify-center text-[#0A0A0A]">
                      <Music size={20} strokeWidth={2.5} />
                   </div>
                   <div>
                      <p className="text-xs font-bold text-white uppercase tracking-tighter">Status</p>
                      <p className="text-sm text-[#4FD1FF] font-medium">Verified On-Chain</p>
                   </div>
                </div>
              </div>
              <div className="md:col-span-3 p-10 flex flex-col overflow-y-auto">
                <div className="flex-1 space-y-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline">{selectedTrack.genre}</Badge>
                      <h2 className="text-3xl font-medium mt-2">{selectedTrack.title}</h2>
                      <p className="text-[#71717A] text-lg">{selectedTrack.artist}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#71717A] font-bold uppercase mb-1 tracking-widest">Base Price</p>
                      <p className="text-2xl font-medium text-[#4FD1FF]">{selectedTrack.pricePerLicense} POL</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-[#71717A] uppercase tracking-widest flex items-center gap-2">
                       <Users size={14} /> Rights Holders
                    </h3>
                    <div className="space-y-2">
                      {selectedTrack.creators.map((c, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#181818] border border-white/10 flex items-center justify-center text-[10px] font-bold">
                              {c.name ? c.name.charAt(0) : '?'}
                            </div>
                            <span className="text-sm font-medium">{c.name || 'Anonymous'} <span className="text-[#71717A] text-[11px]">({c.role})</span></span>
                          </div>
                          <span className="text-sm font-bold text-[#4FD1FF]">{c.share}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pt-8 flex gap-3 sticky bottom-0 bg-[#121212]">
                  <Button className="flex-1 h-12" onClick={() => { handleLicenseTrack(selectedTrack); setSelectedTrack(null); }} disabled={!isWalletConnected}>
                    {isWalletConnected ? 'Purchase License' : 'Connect Wallet'}
                  </Button>
                  <Button variant="outline" className="h-12" onClick={() => setSelectedTrack(null)}>Dismiss</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default App;
