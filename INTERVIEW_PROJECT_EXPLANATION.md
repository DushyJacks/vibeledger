# VibeLedger — Interview Project Explanation

## 1) What this project does (30-second pitch)
VibeLedger is a decentralized music rights platform. Creators register a track with metadata on IPFS and ownership splits on-chain. Buyers purchase licenses through a smart contract, and payments are automatically split among creators based on predefined percentages.

In short:
- **Track metadata** → IPFS
- **Ownership + pricing** → `TrackRegistry` smart contract
- **License purchases + payout splitting** → `LicenseManager` smart contract
- **Frontend UX** → React + TypeScript + ethers.js

---

## 2) Tech stack and architecture

### Frontend
- React + TypeScript (single-page app in `App.tsx`)
- Vite build setup
- Local state persistence via `localStorage`

### Web3 Layer
- `ethers.js` for wallet/provider/signer and contract calls
- MetaMask integration via `web3Service`
- Network: **Polygon Amoy testnet** (chainId `80002`)

### Storage
- IPFS for files and metadata using `ipfs-http-client`
- If IPFS env config is missing, the app falls back to mock hashes (demo-friendly)

### Smart Contracts (Solidity)
- `TrackRegistry.sol` — register tracks and store creator shares
- `LicenseManager.sol` — purchase licenses, distribute payment to creators
- `RoyaltyDistributor.sol` — optional manual royalty distribution (not core current UI flow)

---

## 3) Core project structure
- `App.tsx`: main UI, state management, transaction handlers
- `services/web3Service.ts`: wallet connection, chain switch, signer/provider access
- `services/ipfsService.ts`: file/JSON uploads + gateway URL generation
- `services/contractService.ts`: all contract interactions and tx parsing
- `contracts/*.sol`: Solidity source contracts
- `deployments/amoy.json`: deployed contract addresses on Polygon Amoy

---

## 4) End-to-end flow #1 — Register Track
This flow is handled by `handleRegisterTrack` in `App.tsx`.

### Step-by-step
1. **Validate form**
   - Wallet connected
   - Title/artist present
   - License price > 0
   - Creator wallet addresses are valid `0x...`
   - Creator shares sum exactly to 100

2. **Upload media to IPFS**
   - Audio file upload (optional)
   - Cover art upload (optional)
   - Build metadata JSON `{ title, artist, genre, audioHash, coverArtHash, creators }`
   - Upload metadata JSON to IPFS and receive `metadataHash`

3. **Write to blockchain**
   - `contractService.registerTrack(...)` sends tx to `TrackRegistry.registerTrack`
   - Inputs: `metadataHash`, `pricePerLicense`, `creators[]`, `shares[]`
   - Waits for tx receipt, parses `TrackRegistered` event, extracts `trackId`

4. **Persist in frontend state**
   - Create local `Track` object containing:
     - local display ID (`TRK-...`)
     - on-chain `blockchainTrackId`
     - IPFS hash
     - tx hash / block number
   - Push into `tracks` state and `localStorage`

### Key contract checks (`TrackRegistry.sol`)
- `ipfsHash` cannot be empty
- `pricePerLicense > 0`
- creators and shares lengths must match
- share total must equal `100`

---

## 5) End-to-end flow #2 — Purchase License
This flow is handled by `handleLicenseTrack` in `App.tsx`.

### Step-by-step
1. User picks a track and clicks license purchase
2. Frontend resolves numeric `trackId` (prefers blockchain ID)
3. Calls `contractService.purchaseLicense(...)`
4. Service verifies the track exists in `TrackRegistry`
5. Sends payable tx to `LicenseManager.purchaseLicense(trackId, licenseType)`
6. On success:
   - Parses `LicensePurchased` event for `licenseId`
   - Updates UI states: payments, licenses, track royalties
   - Reloads wallet balance

### Payment distribution logic (`LicenseManager.sol`)
When purchase tx is received:
- Fetches track creators and shares from `TrackRegistry`
- Ensures `msg.value >= pricePerLicense`
- Transfers each creator: `(msg.value * share[i]) / 100`
- Calls `trackRegistry.addRoyalties(trackId, msg.value)`
- Refunds overpayment to license buyer

This is the core trustless part: split payout is enforced by contract code, not by a centralized backend.

---

## 6) Service-layer code explanation

### `web3Service.ts`
Responsibilities:
- Detect MetaMask
- Connect wallet (`eth_requestAccounts`)
- Enforce Polygon Amoy network (switch/add chain if needed)
- Expose signer/provider for contract calls
- Read balance and listen to account/network changes

### `ipfsService.ts`
Responsibilities:
- Upload files and JSON to IPFS
- Build gateway URL from CID
- Fallback to generated mock CIDs when API is not configured

### `contractService.ts`
Responsibilities:
- Hold contract addresses from env vars
- Validate deployment address format
- Wrap contract calls:
  - `registerTrack`
  - `purchaseLicense`
  - `getTrackInfo`
  - debugging helpers (`testReadContract`, `verifyTrackExists`)
- Parse logs to extract emitted IDs (`trackId`, `licenseId`)
- Normalize and surface readable errors

---

## 7) Data model (frontend)
Defined in `types.ts`:
- `Track`: metadata, pricing, creators, tx details, royalties
- `Creator`: wallet + role + ownership share
- `RoyaltyPayment`: transaction records for royalty payments
- `LicenseRecord`: purchased license records tied to tracks

The app persists key arrays (`tracks`, `payments`, `licenses`) and profile/settings in `localStorage`.

---

## 8) Contracts deployed on Amoy
From `deployments/amoy.json`:
- `TrackRegistry`: `0x577d1924AbE1B5d76433FC3ea948f0aDFd6e1CbC`
- `LicenseManager`: `0xCBE787553FF93078ABA874BE2f993F04B0D24070`
- `RoyaltyDistributor`: `0x4aA8f5e73bfA67cD4d39a2a621f007Ac5298Fd73`

---

## 9) Interview talking points (what to emphasize)
1. **Problem solved**: transparent and automated royalty splits.
2. **Why blockchain**: immutable registry + programmable payouts.
3. **Design decision**: store large media off-chain (IPFS), keep critical rights/payment logic on-chain.
4. **Security/data integrity**: share-sum validation and on-chain enforcement of payouts.
5. **UX practicality**: local persistence, wallet/network checks, clear error notifications.
6. **Scalability direction**: indexer/subgraph + backend for analytics + richer license terms.

---

## 10) Known limitations and next improvements
- `RoyaltyDistributor` is deployed but not central in current UI flow.
- Gas price is currently hardcoded in service methods (could use dynamic fee strategy).
- No backend/indexer yet; UI relies on local state + direct on-chain calls.
- IPFS currently supports fallback mock hashes for demo mode; production should enforce real pinning.

---

## 11) One-minute explanation script
"VibeLedger is a React + Solidity dApp on Polygon Amoy for music rights. A creator uploads track metadata to IPFS, then registers the IPFS hash, license price, and creator split percentages in `TrackRegistry`. When someone buys a license through `LicenseManager`, the contract automatically splits payment across creators by percentage and updates cumulative royalties. The frontend handles wallet connection, file upload, and transaction UX through dedicated services (`web3Service`, `ipfsService`, `contractService`). So the core value is transparent ownership and trustless royalty distribution, enforced directly by smart contracts."