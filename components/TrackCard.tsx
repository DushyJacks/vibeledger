
import React from 'react';
import { Play, Info } from 'lucide-react';
import { Track } from '../types';
import { Card, Button, Badge } from './UI';

interface TrackCardProps {
  track: Track;
  onLicense: (track: Track) => void;
  onViewInfo: (track: Track) => void;
  disabled?: boolean;
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, onLicense, onViewInfo, disabled = false }) => {
  return (
    <div className="group space-y-3 cursor-pointer">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#181818] border border-white/5">
        <img 
          src={track.coverArt} 
          alt={track.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform">
            <Play fill="currentColor" size={20} className="ml-1" />
          </button>
        </div>
      </div>
      
      <div className="space-y-0.5 px-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-[15px] truncate text-[#F5F5F7]">{track.title}</h3>
          <span className="text-[13px] font-medium text-[#4FD1FF]">{track.pricePerLicense} POL</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-[#71717A]">{track.artist}</p>
          <Badge variant="outline">{track.genre}</Badge>
        </div>
      </div>

      <div className={`grid grid-cols-2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
        <Button variant="glass" disabled={disabled} onClick={() => onLicense(track)} className="py-2 text-xs">
          {disabled ? 'Connect Wallet' : 'License'}
        </Button>
        <Button variant="outline" disabled={disabled} onClick={() => onViewInfo(track)} className="py-2 text-xs">
          Details
        </Button>
      </div>
    </div>
  );
};
