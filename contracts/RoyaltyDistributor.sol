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
 * @title RoyaltyDistributor
 * @dev Distribute royalties to track creators
 */
contract RoyaltyDistributor {
    ITrackRegistry public trackRegistry;

    event RoyaltiesDistributed(
        uint256 indexed trackId,
        uint256 amount,
        uint256 timestamp
    );

    constructor(address _trackRegistry) {
        trackRegistry = ITrackRegistry(_trackRegistry);
    }

    /**
     * @dev Distribute royalties for a track
     * @param trackId ID of the track
     */
    function distributeRoyalties(uint256 trackId) external payable {
        require(msg.value > 0, "Must send royalties");

        // Get track info
        (
            ,
            ,
            address[] memory creators,
            uint256[] memory shares,

        ) = trackRegistry.getTrack(trackId);

        // Distribute to creators based on shares
        for (uint256 i = 0; i < creators.length; i++) {
            uint256 creatorShare = (msg.value * shares[i]) / 100;
            payable(creators[i]).transfer(creatorShare);
        }

        // Update track royalties
        trackRegistry.addRoyalties(trackId, msg.value);

        emit RoyaltiesDistributed(trackId, msg.value, block.timestamp);
    }

    /**
     * @dev Get track royalties (view function)
     */
    function getTrackRoyalties(uint256 trackId) external view returns (uint256) {
        (
            ,
            ,
            ,
            ,
            uint256 totalRoyalties
        ) = trackRegistry.getTrack(trackId);
        return totalRoyalties;
    }
}
