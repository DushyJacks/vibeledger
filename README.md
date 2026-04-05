## Problem Statement

Music creators face significant challenges in managing intellectual property rights, tracking royalties, and ensuring fair compensation across multiple platforms. Current systems lack transparency, have high intermediary costs, and often delay or withhold royalty payments. Blockchain technology can provide a decentralized, immutable, and transparent solution for track registration, licensing, and automated royalty distribution.

## Project Name

**VibeLedger** - Decentralized Music Rights & Royalties Platform

## Team Name

ByteQuest-2025 - Team: The Code Fathers

## Live Website

🚀 **VibeLedger is live!** Access at: https://vibeledger.netlify.app/

## Demonstration Video

📹 Watch the 2-minute demo: [VibeLedger Demo Video](https://drive.google.com/file/d/1wEs6sY7NG1AwuULOcjFFPPJW9C3VbJok/view?usp=sharing)

## Presentation

📊 View the presentation: [VibeLedger Presentation](https://docs.google.com/presentation/d/1vgYq1QJ9GGyFufNVNOj8iVVAnZugqg5W/edit?usp=sharing&ouid=117163059437689779580&rtpof=true&sd=true)

## Deployed Link

Smart Contracts deployed on Polygon Amoy Testnet:
- **TrackRegistry Contract**: [0x577d1924AbE1B5d76433FC3ea948f0aDFd6e1CbC](https://amoy.polygonscan.com/address/0x577d1924AbE1B5d76433FC3ea948f0aDFd6e1CbC)
- **LicenseManager Contract**: [0xCBE787553FF93078ABA874BE2f993F04B0D24070](https://amoy.polygonscan.com/address/0xCBE787553FF93078ABA874BE2f993F04B0D24070)
- **RoyaltyDistributor Contract**: [0x4aA8f5e73bfA67cD4d39a2a621f007Ac5298Fd73](https://amoy.polygonscan.com/address/0x4aA8f5e73bfA67cD4d39a2a621f007Ac5298Fd73)

---

# Project Overview

VibeLedger is a blockchain-based music rights management and royalty distribution platform built on Polygon Amoy. It enables music creators to:

- **Register Tracks On-Chain**: Store track metadata on IPFS with immutable smart contract records
- **Define Creator Splits**: Specify multiple creators and their royalty share percentages
- **License Distribution**: Enable fair and transparent licensing with multiple license types
- **Automated Royalties**: Automatic distribution of royalty payments to all creators based on their share percentage

### Key Features

- **Web3 Integration**: MetaMask wallet connection and real blockchain transactions
- **IPFS Storage**: Decentralized storage for audio files and metadata
- **Smart Contracts**: Solidity contracts for track registration, licensing, and royalty distribution
- **Real-Time Updates**: Live balance tracking and transaction confirmation
- **Polygonscan Integration**: Direct links to verify transactions and contract interactions

---

## Setup and Installation Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask browser extension
- Test MATIC from [Polygon Amoy Faucet](https://faucet.polygon.technology/)

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ByteQuest-2025/GFGBQ-Team-the-code-fathers.git
   cd Vibeledger
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   - Copy `.env.example` to `.env`
   - Add your Infura API key for Polygon RPC
   - Add your Polygonscan API key for contract verification
   - Contract addresses are already pre-configured with deployed contracts

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - Open your browser and navigate to `http://localhost:3000`
   - Connect your MetaMask wallet (ensure you're on Polygon Amoy testnet)

---

## Usage Instructions

### For Music Creators

1. **Connect Wallet**: Click the wallet icon in the header and connect your MetaMask account
2. **Register Track**:
   - Fill in track details (title, artist, description)
   - Upload audio file (stored on IPFS)
   - Add cover image and banner
   - Specify creator splits (e.g., 70% to you, 30% to featured artist)
   - Click "Register Track" to submit on-chain transaction
3. **View Your Profile**: Check registered tracks and royalty earnings in the dashboard

### For Licensees

1. **Browse Tracks**: View all registered tracks in the marketplace
2. **Purchase License**:
   - Select a track
   - Choose license type:
     - **Streaming**: Use in streaming services (0.001 MATIC)
     - **Commercial**: Commercial use rights (0.01 MATIC)
     - **Exclusive**: Exclusive rights (0.1 MATIC)
   - Approve transaction in MetaMask
   - Royalties automatically distribute to creators

### Dashboard Features

- **Track Statistics**: View total tracks registered, active licenses, and total royalties
- **Creator Profile**: Manage your tracks, track earnings, and view your creator shares
- **Transaction History**: View all on-chain transactions with links to Polygonscan

---

## Technical Stack

- **Frontend**: React 19.2.3, TypeScript, Vite, Tailwind CSS
- **Blockchain**: ethers.js, Polygon Amoy Testnet
- **Smart Contracts**: Solidity 0.8.20, Hardhat
- **Storage**: IPFS (via Infura)
- **Wallet**: MetaMask
- **Data**: localStorage for client-side state

## Smart Contract Functions

### TrackRegistry
- `registerTrack()`: Register a new track with creator splits
- `getTrack()`: Retrieve track information
- `getOwnerTracks()`: Get all tracks owned by an address

### LicenseManager
- `purchaseLicense()`: Purchase a license for a track with automatic royalty distribution
- `getUserLicenses()`: Get all licenses owned by an address

### RoyaltyDistributor
- `distributeRoyalties()`: Manually distribute royalties to creators

---

## Troubleshooting

**MetaMask Connection Issues**: 
- Ensure MetaMask is installed and unlocked
- Check that you're on the Polygon Amoy network (Chain ID: 80002)

**Insufficient Balance**: 
- Get free test MATIC from [Polygon Amoy Faucet](https://faucet.polygon.technology/)

**IPFS Upload Fails**: 
- Ensure your internet connection is stable
- Check that IPFS gateway is accessible

---

## Future Enhancements

- Batch royalty distributions
- NFT-based licenses
- Royalty splits with time-lock release
- Advanced analytics dashboard
- Integration with streaming platforms
- Mobile app
