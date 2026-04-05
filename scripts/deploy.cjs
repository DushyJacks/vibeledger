const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying VibeLedger contracts to Polygon Amoy...\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MATIC\n");

  // Deploy TrackRegistry
  console.log("📀 Deploying TrackRegistry...");
  const TrackRegistry = await hre.ethers.getContractFactory("TrackRegistry");
  const trackRegistry = await TrackRegistry.deploy();
  await trackRegistry.waitForDeployment();
  const trackRegistryAddress = await trackRegistry.getAddress();
  console.log("✅ TrackRegistry deployed to:", trackRegistryAddress);

  // Deploy LicenseManager
  console.log("\n🎫 Deploying LicenseManager...");
  const LicenseManager = await hre.ethers.getContractFactory("LicenseManager");
  const licenseManager = await LicenseManager.deploy(trackRegistryAddress);
  await licenseManager.waitForDeployment();
  const licenseManagerAddress = await licenseManager.getAddress();
  console.log("✅ LicenseManager deployed to:", licenseManagerAddress);

  // Deploy RoyaltyDistributor
  console.log("\n💰 Deploying RoyaltyDistributor...");
  const RoyaltyDistributor = await hre.ethers.getContractFactory("RoyaltyDistributor");
  const royaltyDistributor = await RoyaltyDistributor.deploy(trackRegistryAddress);
  await royaltyDistributor.waitForDeployment();
  const royaltyDistributorAddress = await royaltyDistributor.getAddress();
  console.log("✅ RoyaltyDistributor deployed to:", royaltyDistributorAddress);

  // Save deployment info
  const deploymentInfo = {
    network: "Polygon Amoy Testnet",
    chainId: 80002,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      TrackRegistry: trackRegistryAddress,
      LicenseManager: licenseManagerAddress,
      RoyaltyDistributor: royaltyDistributorAddress
    }
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "amoy.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Create .env file content
  const envContent = `
# VibeLedger Environment Configuration

# IPFS Configuration
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
VITE_IPFS_API_URL=
VITE_IPFS_API_TOKEN=

# Blockchain Configuration
VITE_NETWORK_NAME=Polygon Amoy Testnet
VITE_CHAIN_ID=80002
VITE_RPC_URL=https://rpc-amoy.polygon.technology/
VITE_BLOCK_EXPLORER_URL=https://amoy.polygonscan.com

# Smart Contract Addresses (Deployed)
VITE_TRACK_REGISTRY_CONTRACT=${trackRegistryAddress}
VITE_ROYALTY_DISTRIBUTOR_CONTRACT=${royaltyDistributorAddress}
VITE_LICENSE_MANAGER_CONTRACT=${licenseManagerAddress}

# Deployment
PRIVATE_KEY=your_private_key_here
POLYGONSCAN_API_KEY=KMZTD5MBGTTC8QPQ2EPG4H9B6ZG129XDR5
`;

  fs.writeFileSync(path.join(__dirname, "..", ".env"), envContent.trim());

  console.log("\n\n✨ Deployment Summary ✨");
  console.log("═══════════════════════════════════════════════════════");
  console.log("📍 Network:", "Polygon Amoy Testnet");
  console.log("🔗 Chain ID:", "80002");
  console.log("\n📋 Contract Addresses:");
  console.log("   TrackRegistry:       ", trackRegistryAddress);
  console.log("   LicenseManager:      ", licenseManagerAddress);
  console.log("   RoyaltyDistributor:  ", royaltyDistributorAddress);
  console.log("\n📄 Deployment info saved to: deployments/amoy.json");
  console.log("🔧 .env file created with contract addresses");
  console.log("\n🔍 Verify contracts on Polygonscan:");
  console.log(`   npx hardhat verify --network polygonAmoy ${trackRegistryAddress}`);
  console.log(`   npx hardhat verify --network polygonAmoy ${licenseManagerAddress} ${trackRegistryAddress}`);
  console.log(`   npx hardhat verify --network polygonAmoy ${royaltyDistributorAddress} ${trackRegistryAddress}`);
  console.log("═══════════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
