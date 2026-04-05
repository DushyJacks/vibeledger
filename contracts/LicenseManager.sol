// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITrackRegistry {
    function getTrack(uint256 trackId)
        external
        view
        returns (
            string memory ipfsHash,
            uint256 pricePerLicense,
            address[] memory creators,
            uint256[] memory shares,
            uint256 totalRoyalties
        );
    function addRoyalties(uint256 trackId, uint256 amount) external;
}

/**
 * @title LicenseManager
 * @dev Purchase and manage music licenses
 */
contract LicenseManager {
    enum LicenseType {
        Streaming,
        Commercial,
        Exclusive
    }

    struct License {
        uint256 id;
        uint256 trackId;
        address licensee;
        LicenseType licenseType;
        uint256 purchasedAt;
        bool exists;
    }

    ITrackRegistry public trackRegistry;
    uint256 private _licenseIdCounter;
    mapping(uint256 => License) public licenses;
    mapping(address => uint256[]) public userLicenses;

    event LicensePurchased(
        uint256 indexed licenseId,
        uint256 indexed trackId,
        address indexed licensee,
        uint256 timestamp
    );

    address private owner;

    constructor(address _trackRegistry) {
        trackRegistry = ITrackRegistry(_trackRegistry);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    /**
     * @dev Set the TrackRegistry address (in case it needs updating)
     */
    function setTrackRegistry(address _trackRegistry) external onlyOwner {
        require(_trackRegistry != address(0), "Invalid registry address");
        trackRegistry = ITrackRegistry(_trackRegistry);
    }

    /**
     * @dev Get the TrackRegistry address
     */
    function getTrackRegistry() external view returns (address) {
        return address(trackRegistry);
    }

    /**
     * @dev Purchase a license for a track
     * @param trackId ID of the track
     * @param licenseType Type of license (0: Streaming, 1: Commercial, 2: Exclusive)
     */
    function purchaseLicense(uint256 trackId, uint8 licenseType)
        external
        payable
        returns (uint256)
    {
        require(licenseType <= 2, "Invalid license type");

        // Get track info
        (
            ,
            uint256 pricePerLicense,
            address[] memory creators,
            uint256[] memory shares,

        ) = trackRegistry.getTrack(trackId);

        require(msg.value >= pricePerLicense, "Insufficient payment");

        uint256 licenseId = _licenseIdCounter++;

        licenses[licenseId] = License({
            id: licenseId,
            trackId: trackId,
            licensee: msg.sender,
            licenseType: LicenseType(licenseType),
            purchasedAt: block.timestamp,
            exists: true
        });

        userLicenses[msg.sender].push(licenseId);

        // Distribute payment to creators
        for (uint256 i = 0; i < creators.length; i++) {
            uint256 creatorShare = (msg.value * shares[i]) / 100;
            payable(creators[i]).transfer(creatorShare);
        }

        // Update track royalties
        trackRegistry.addRoyalties(trackId, msg.value);

        // Refund excess payment
        if (msg.value > pricePerLicense) {
            payable(msg.sender).transfer(msg.value - pricePerLicense);
        }

        emit LicensePurchased(licenseId, trackId, msg.sender, block.timestamp);

        return licenseId;
    }

    /**
     * @dev Get license information
     */
    function getLicense(uint256 licenseId)
        external
        view
        returns (
            uint256 trackId,
            address licensee,
            uint8 licenseType,
            uint256 purchasedAt
        )
    {
        require(licenses[licenseId].exists, "License does not exist");
        License memory license = licenses[licenseId];
        return (
            license.trackId,
            license.licensee,
            uint8(license.licenseType),
            license.purchasedAt
        );
    }

    /**
     * @dev Get all licenses owned by a user
     */
    function getUserLicenses(address user) external view returns (uint256[] memory) {
        return userLicenses[user];
    }
}
