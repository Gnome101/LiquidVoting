// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.3;

import "../libraries/History.sol";
import "../libraries/Storage.sol";
import "./IERC721.sol";
import "../interfaces/IERC20.sol";
import "./IVotingVault.sol";
import "../interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";

import "../hyperlaneInterfaces/IMailbox.sol";
import "hardhat/console.sol";

contract V3Vault is IVotingVault {
    // Bring our libraries into scope
    using History for *;
    using Storage for *;

    // Only immutables can be declared without using the hash locations
    IERC721 immutable token;
    IERC20 immutable govToken;
    IERC20 immutable weth;
    uint24 immutable feeTier;
    INonfungiblePositionManager immutable NFTPositionManager;
    IUniswapV3Factory immutable Factory;
    address public immutable polyChainVault;
    IMailbox immutable mailBox;
    uint32 public immutable goerliDomain;

    constructor(
        IERC721 _token,
        IERC20 _govToken,
        IERC20 _weth,
        uint24 _feeTier,
        INonfungiblePositionManager _NFTPositionManager,
        IUniswapV3Factory _Factory,
        address _polyVault,
        IMailbox _mailbox,
        uint32 _goerliDomain
    ) {
        token = _token;
        govToken = _govToken;
        weth = _weth;
        feeTier = _feeTier;
        NFTPositionManager = _NFTPositionManager;
        Factory = _Factory;

        polyChainVault = _polyVault;
        mailBox = _mailbox;
        goerliDomain = _goerliDomain;
    }

    /// @notice Returns the historical voting power tracker
    /// @return A struct which can push to and find items in block indexed storage
    function _votingPower()
        internal
        pure
        returns (History.HistoricalBalances memory)
    {
        // This call returns a storage mapping with a unique non overwrite-able storage location
        // which can be persisted through upgrades, even if they change storage layout
        return (History.load("votingPower"));
    }

    /// @notice Transfers one NFT of our collection to this contract and then adds one vote to the user's voting power
    /// @param tokenId The token Id, not the NFT to transfer.
    function deposit(uint256 tokenId) external {
        // Get the token from the user
        token.transferFrom(msg.sender, address(this), tokenId);
        // Get the hash pointer to the history mapping
        History.HistoricalBalances memory votingPower = _votingPower();
        // Load the user votes
        uint256 currentVotes = votingPower.loadTop(msg.sender);
        // Push their new voting power
        votingPower.push(msg.sender, currentVotes + 1);
    }

    struct posInfo {
        address desiredPool;
        int24 centerTick;
        int24 width;
        address userToken;
        uint256 token0AmountDesired;
        uint256 token1AmountDesired;
    }

    function viewUserPosition(uint256 index) external view returns (uint256) {
        mapping(address => uint256[]) storage userData = Storage
            .mappingAddressToUnit256ArrayPtr("userPositions");
        return userData[msg.sender][index];
    }

    function mintPosition(posInfo memory v3Info) external {
        // Get the token from the user

        IERC20(IUniswapV3Pool(v3Info.desiredPool).token0()).transferFrom(
            msg.sender,
            address(this),
            v3Info.token0AmountDesired
        );
        IERC20(IUniswapV3Pool(v3Info.desiredPool).token1()).transferFrom(
            msg.sender,
            address(this),
            v3Info.token1AmountDesired
        );

        bool suc = IERC20(IUniswapV3Pool(v3Info.desiredPool).token0()).approve(
            address(NFTPositionManager),
            v3Info.token0AmountDesired
        );
        require(suc);
        bool suc2 = IERC20(IUniswapV3Pool(v3Info.desiredPool).token1()).approve(
            address(NFTPositionManager),
            v3Info.token1AmountDesired
        );
        require(suc2);

        INonfungiblePositionManager.MintParams
            memory params = INonfungiblePositionManager.MintParams({
                token0: IUniswapV3Pool(v3Info.desiredPool).token0(),
                token1: IUniswapV3Pool(v3Info.desiredPool).token1(),
                fee: feeTier,
                tickLower: v3Info.centerTick -
                    v3Info.width *
                    IUniswapV3Pool(v3Info.desiredPool).tickSpacing(),
                tickUpper: v3Info.centerTick +
                    v3Info.width *
                    IUniswapV3Pool(v3Info.desiredPool).tickSpacing(),
                amount0Desired: v3Info.token0AmountDesired,
                amount1Desired: v3Info.token1AmountDesired,
                amount0Min: 0,
                amount1Min: 0,
                recipient: address(this),
                deadline: block.timestamp + 1000000
            });
        //Need to develop a slippage estimation process
        (uint256 tokenId, uint128 liquidity, , ) = NFTPositionManager.mint(
            params
        );
        mapping(address => uint256[]) storage userData = Storage
            .mappingAddressToUnit256ArrayPtr("userPositions");
        userData[msg.sender].push(tokenId);
        // Get the hash pointer to the history mapping
        History.HistoricalBalances memory votingPower = _votingPower();
        // Load the user votes
        uint256 currentVotes = votingPower.loadTop(msg.sender);
        // Push their new voting power

        votingPower.push(msg.sender, currentVotes + 1);

        mapping(address => int256[]) storage data = Storage
            .mappingAddressToInt256ArrayPtr("userOwnerShip");

        data[msg.sender].push(int128(liquidity));
        data[msg.sender].push(
            v3Info.centerTick -
                v3Info.width *
                IUniswapV3Pool(v3Info.desiredPool).tickSpacing()
        );
        data[msg.sender].push(
            v3Info.centerTick +
                v3Info.width *
                IUniswapV3Pool(v3Info.desiredPool).tickSpacing()
        );
    }

    function addPosition(
        address user,
        int24 width,
        uint128 liquidity,
        int24 lowerBound,
        int24 upperBound
    ) public {
        History.HistoricalBalances memory votingPower = _votingPower();
        // Load the user votes
        uint256 currentVotes = votingPower.loadTop(user);
        // Push their new voting power

        votingPower.push(user, currentVotes + 1);

        mapping(address => int256[]) storage data = Storage
            .mappingAddressToInt256ArrayPtr("userOwnerShip");

        data[user].push(int128(liquidity));
        data[user].push(lowerBound);
        data[user].push(upperBound);
    }

    function queryVotePower(
        address user,
        uint256 blockNumber,
        bytes calldata //This can be the current V3
    ) external view override returns (uint256) {
        History.HistoricalBalances memory votingPower = _votingPower();
        // Get our reference to historical data

        mapping(address => int256[]) storage data = Storage
            .mappingAddressToInt256ArrayPtr("userOwnerShip");
        // Find the historical data in our mapping
        (, int24 currentTick, , , , , ) = IUniswapV3Pool(
            Factory.getPool(address(govToken), address(weth), feeTier)
        ).slot0();

        uint256 i = 0;
        uint256 votingPowerTotal = 0;
        while (i < votingPower.find(user, blockNumber) * 3) {
            if (data[msg.sender][i + 1] > currentTick) {
                //If the lower one is above the currentTick
                i = i + 3;
                continue;
            }
            if (data[msg.sender][i + 2] < currentTick) {
                //If the lower one is above the currentTick
                i = i + 3;
                continue;
            }
            votingPowerTotal += uint256(data[msg.sender][i]);
            i = i + 3;
        }
        return votingPowerTotal;
    }

    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _message
    ) external {
        origin = _origin;
        sender = msg.sender;
        (bytes memory res, address user) = abi.decode(
            _message,
            (bytes, address)
        );
        (
            address specifiedUser,
            int24 lowerBound,
            int24 upperBound,
            int24 width,
            uint128 liqudity
        ) = abi.decode(res, (address, int24, int24, int24, uint128));
        addPosition(specifiedUser, width, liqudity, lowerBound, upperBound);
        randNum = 3;
    }

    uint256 public randNum = 0;
    address public sender;
    uint32 public origin;
}
//338374998097383714278
//338374998097383714278
