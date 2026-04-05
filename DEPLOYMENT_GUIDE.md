# VibeLedger Smart Contract Deployment Guide

## Prerequisites

1. **Install Hardhat dependencies**
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv
   ```

2. **Get test MATIC**
   - Add Polygon Amoy network to MetaMask
   - Get free test MATIC from: https://faucet.polygon.technology/

3. **Export your private key from MetaMask**
   - Open MetaMask → Account Details → Export Private Key
   - ⚠️ **NEVER share this key or commit it to Git!**

## Deployment Steps

### Step 1: Set up your private key
Add your MetaMask private key to .env (create .env if it doesn't exist):
```bash
PRIVATE_KEY=your_private_key_here_without_0x
POLYGONSCAN_API_KEY=KMZTD5MBGTTC8QPQ2EPG4H9B6ZG129XDR5
```

### Step 2: Compile contracts
```bash
npx hardhat compile
```

### Step 3: Deploy to Polygon Amoy
```bash
npx hardhat run scripts/deploy.js --network polygonAmoy
```

This will:
- Deploy all 3 contracts (TrackRegistry, LicenseManager, RoyaltyDistributor)
- Save addresses to `deployments/amoy.json`
- Update your `.env` file with contract addresses
- Show verification commands

### Step 4: Verify contracts on Polygonscan (optional but recommended)
After deployment, run the verification commands shown in the output:
```bash
npx hardhat verify --network polygonAmoy <CONTRACT_ADDRESS>
```

### Step 5: Update contract ABIs in the app
The ABIs are automatically generated in `artifacts/contracts/`. You need to copy them to the frontend:

```bash
# Copy ABIs (PowerShell)
Copy-Item artifacts/contracts/TrackRegistry.sol/TrackRegistry.json services/abis/ -Force
Copy-Item artifacts/contracts/LicenseManager.sol/LicenseManager.json services/abis/ -Force
Copy-Item artifacts/contracts/RoyaltyDistributor.sol/RoyaltyDistributor.json services/abis/ -Force
```

Then update `services/contractService.ts` to import the real ABIs.

## Troubleshooting

**Error: insufficient funds**
- Get more test MATIC from the faucet
- Check your balance: `npx hardhat run scripts/check-balance.js --network polygonAmoy`

**Error: nonce too high**
- Reset MetaMask: Settings → Advanced → Reset Account

**Gas estimation failed**
- Check your contract logic for errors
- Ensure you're on the correct network

## After Deployment

1. ✅ Contract addresses are now in `.env`
2. ✅ Start the app: `npm run dev`
3. ✅ Connect MetaMask to Polygon Amoy
4. ✅ Register a track and test licensing!

## Demo Mode vs Production Mode

- **Demo Mode**: If contract addresses are not set or invalid, the app simulates transactions (localStorage only)
- **Production Mode**: With valid addresses, all transactions go on-chain to Polygon Amoy

## Security Notes

- Never commit your `.env` file
- Never share your private key
- Use test networks for development
- Audit contracts before mainnet deployment
