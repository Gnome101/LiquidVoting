// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.3;
import "../hyperlaneInterfaces/IMailbox.sol";
import "../hyperlaneInterfaces/IMessageRecipient.sol";
import "../hyperlaneInterfaces/IInterchainGasPaymaster.sol";
import "../hyperlaneInterfaces/IInterchainQueryRouter.sol";

import "./IERC721.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";

contract otherChainVault {
    mapping(address => uint256[]) public userPositions;
    // Only immutables can be declared without using the hash locations
    IERC721 immutable token;
    IERC20 immutable govToken;
    IERC20 immutable weth;
    uint24 immutable feeTier;

    //Hyplerlane stuff
    address immutable mainVotingContract =
        0x6F374ed9E54e961C5BeDFA468fB332e6ec5e68A1;
    uint32 constant gnosisChainDomain = 100;
    IMailbox immutable mailBox;
    IInterchainQueryRouter public immutable queryRouter;
    IInterchainGasPaymaster public immutable interchainGasPaymaster;

    INonfungiblePositionManager immutable NFTPositionManager;
    IUniswapV3Factory immutable Factory;

    constructor(
        IERC721 _token,
        IERC20 _govToken,
        IERC20 _weth,
        uint24 _feeTier,
        INonfungiblePositionManager _NFTPositionManager,
        IUniswapV3Factory _Factory,
        address goerliMailBoxAddy,
        address goerliQueryAddy,
        address goerliGasAddy
    ) {
        token = _token;
        govToken = _govToken;
        weth = _weth;
        feeTier = _feeTier;
        NFTPositionManager = _NFTPositionManager;
        Factory = _Factory;

        queryRouter = IInterchainQueryRouter(goerliQueryAddy);
        mailBox = IMailbox(goerliMailBoxAddy);
        interchainGasPaymaster = IInterchainGasPaymaster(goerliGasAddy);
    }

    struct posInfo {
        address desiredPool;
        int24 centerTick;
        int24 width;
        address userToken;
        uint256 token0AmountDesired;
        uint256 token1AmountDesired;
    }

    function mintPosition(posInfo memory v3Info, address gnosisUser) external {
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
    }

    function sendPositionInfo(
        address sender,
        address specifiedUser,
        int24 lowerBound,
        int24 upperBound,
        uint256 gasAmount
    ) public {
        bytes memory message = abi.encode(
            specifiedUser,
            lowerBound,
            upperBound
        );

        bytes32 _messageId = mailBox.dispatch(
            gnosisChainDomain,
            addressToBytes32(mainVotingContract),
            abi.encode(message, sender)
            //abi.encode(message)
        );
    }

    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }

    //Dont forget to specify the interchainSecurityModule()
    // function interchainSecurityModule() external pure returns (address) {
    //     return 0x5Fe9b2cAcD42593408A49D97aa061a1666C595E9;
    // }
}
