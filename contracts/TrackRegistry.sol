// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TrackRegistry
 * @dev Register music tracks with IPFS metadata and creator splits
 */
contract TrackRegistry {
    struct Track {
        uint256 id;
        string ipfsHash;
        uint256 pricePerLicense;
        address owner;
        address[] creators;
        uint256[] shares;
        uint256 totalRoyalties;
        uint256 registeredAt;
        bool exists;
    }

    uint256 private _trackIdCounter;
    mapping(uint256 => Track) public tracks;
    mapping(address => uint256[]) public ownerTracks;

    event TrackRegistered(
        uint256 indexed trackId,
        address indexed owner,
        string ipfsHash,
        uint256 timestamp
    );

    /**
     * @dev Register a new track
     * @param ipfsHash IPFS hash containing track metadata
     * @param pricePerLicense Price per license in wei
     * @param creators Array of creator addresses
     * @param shares Array of percentage shares (must sum to 100)
     */
    function registerTrack(
        string memory ipfsHash,
        uint256 pricePerLicense,
        address[] memory creators,
        uint256[] memory shares
    ) external returns (uint256) {
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(pricePerLicense > 0, "Price must be greater than 0");
        require(creators.length > 0, "At least one creator required");
        require(creators.length == shares.length, "Creators and shares length mismatch");
        
        // Validate shares sum to 100
        uint256 totalShares = 0;
        for (uint256 i = 0; i < shares.length; i++) {
            require(creators[i] != address(0), "Invalid creator address");
            totalShares += shares[i];
        }
        require(totalShares == 100, "Shares must sum to 100");

        uint256 trackId = _trackIdCounter++;
        
        tracks[trackId] = Track({
            id: trackId,
            ipfsHash: ipfsHash,
            pricePerLicense: pricePerLicense,
            owner: msg.sender,
            creators: creators,
            shares: shares,
            totalRoyalties: 0,
            registeredAt: block.timestamp,
            exists: true
        });

        ownerTracks[msg.sender].push(trackId);

        emit TrackRegistered(trackId, msg.sender, ipfsHash, block.timestamp);

        return trackId;
    }

    /**
     * @dev Get track information
     */
    function getTrack(uint256 trackId)
        external
        view
        returns (
            string memory ipfsHash,
            uint256 pricePerLicense,
            address[] memory creators,
            uint256[] memory shares,
            uint256 totalRoyalties
        )
    {
        require(tracks[trackId].exists, "Track does not exist");
        Track memory track = tracks[trackId];
        return (
            track.ipfsHash,
            track.pricePerLicense,
            track.creators,
            track.shares,
            track.totalRoyalties
        );
    }

    /**
     * @dev Get total number of tracks
     */
    function getTotalTracks() external view returns (uint256) {
        return _trackIdCounter;
    }

    /**
     * @dev Get tracks owned by an address
     */
    function getOwnerTracks(address owner) external view returns (uint256[] memory) {
        return ownerTracks[owner];
    }

    /**
     * @dev Add royalties to a track (called by LicenseManager)
     */
    function addRoyalties(uint256 trackId, uint256 amount) external {
        require(tracks[trackId].exists, "Track does not exist");
        tracks[trackId].totalRoyalties += amount;
    }
}
