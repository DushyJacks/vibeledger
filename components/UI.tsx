
import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass' }> = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = "px-5 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed text-sm tracking-tight";
  const variants = {
    primary: "bg-[#4FD1FF] text-[#0A0A0A] hover:bg-[#3db8e0] shadow-[0_0_15px_rgba(79,209,255,0.25)]",
    secondary: "bg-[#F5F5F7] text-[#0A0A0A] hover:bg-white",
    outline: "border border-[rgba(255,255,255,0.1)] text-[#F5F5F7] hover:bg-white/5",
    ghost: "text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/5",
    glass: "bg-white/5 backdrop-blur-md border border-white/10 text-[#F5F5F7] hover:bg-white/10"
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; elevated?: boolean }> = ({ children, className = '', elevated = false }) => (
  <div className={`${elevated ? 'bg-[#181818]' : 'bg-[#121212]'} rounded-2xl p-6 border border-[rgba(255,255,255,0.06)] transition-all duration-300 ${className}`}>
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; variant?: 'default' | 'success' | 'outline' }> = ({ children, variant = 'default' }) => {
  const styles = {
    default: "bg-[#4FD1FF]/10 text-[#4FD1FF]",
    success: "bg-[#4ADE80]/10 text-[#4ADE80]",
    outline: "border border-white/10 text-[#A1A1AA]"
  };
  return (
    <span className={`${styles[variant]} text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase`}>
      {children}
    </span>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input 
    {...props} 
    className={`w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#F5F5F7] focus:outline-none focus:border-[#4FD1FF]/50 transition-all placeholder:text-[#71717A] ${props.className}`}
  />
);

export const Progress: React.FC<{ value: number; color?: string }> = ({ value, color = 'bg-[#4FD1FF]' }) => (
  <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
    <div className={`${color} h-full transition-all duration-700 ease-out`} style={{ width: `${value}%` }} />
  </div>
);

export const StatCard: React.FC<{ label: string; value: string | number; trend?: string; trendUp?: boolean }> = ({ label, value, trend, trendUp = true }) => (
  <Card className="flex flex-col justify-between h-32">
    <p className="text-xs font-semibold text-[#71717A] uppercase tracking-widest">{label}</p>
    <div className="flex items-end justify-between">
      <h3 className="text-3xl font-medium tracking-tight text-[#F5F5F7]">{value}</h3>
      {trend && (
        <span className={`text-xs font-medium ${trendUp ? 'text-[#4ADE80]' : 'text-red-400'}`}>
          {trend}
        </span>
      )}
    </div>
  </Card>
);
