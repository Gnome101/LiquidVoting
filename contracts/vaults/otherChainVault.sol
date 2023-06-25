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

contract otherChainVault {
    mapping(address => uint256[]) public userPositions;
    // Only immutables can be declared without using the hash locations
    IERC721 immutable token;
    IERC20 immutable govToken;
    IERC20 immutable weth;
    uint24 immutable feeTier;

    //Hyplerlane stuff

    IMailbox immutable mailBox;
    //IInterchainQueryRouter public immutable queryRouter;
    IInterchainGasPaymaster public immutable interchainGasPaymaster;
    uint32 immutable foreignChainID;
    INonfungiblePositionManager immutable NFTPositionManager;

    constructor(
        IERC721 _token,
        IERC20 _govToken,
        IERC20 _weth,
        uint24 _feeTier,
        INonfungiblePositionManager _NFTPositionManager,
        address mailBoxAddy,
        //address polyQueryAddy,
        address gasAddy,
        uint32 _foreignChainID
    ) {
        token = _token;
        govToken = _govToken;
        weth = _weth;
        feeTier = _feeTier;
        NFTPositionManager = _NFTPositionManager;
        mailBox = IMailbox(mailBoxAddy);
        interchainGasPaymaster = IInterchainGasPaymaster(gasAddy);
        foreignChainID = _foreignChainID;
    }

    struct posInfo {
        address desiredPool;
        int24 centerTick;
        int24 width;
        address userToken;
        uint256 token0AmountDesired;
        uint256 token1AmountDesired;
    }

    function mintPosition(posInfo memory v3Info) external payable {
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
        int24 lowerBound = v3Info.centerTick -
            v3Info.width *
            IUniswapV3Pool(v3Info.desiredPool).tickSpacing();
        int24 upperBound = v3Info.centerTick +
            v3Info.width *
            IUniswapV3Pool(v3Info.desiredPool).tickSpacing();
        INonfungiblePositionManager.MintParams
            memory params = INonfungiblePositionManager.MintParams({
                token0: IUniswapV3Pool(v3Info.desiredPool).token0(),
                token1: IUniswapV3Pool(v3Info.desiredPool).token1(),
                fee: feeTier,
                tickLower: lowerBound,
                tickUpper: upperBound,
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
        //V3Vault address:
        // 0xc1C87Bb2862ad5dD28d5846eD981c2c088893D2E
        sendPositionInfo(
            msg.sender,
            0xaD3d2dbAE27c6F17b76487ce0875c33d2047EFa4,
            200000,
            msg.sender,
            v3Info.width,
            liquidity,
            lowerBound,
            upperBound
        );
    }

    function sendPositionInfo(
        address sender,
        address destination,
        uint256 gasAmount,
        address specifiedUser,
        int24 width,
        uint128 liquidty,
        int24 lowerBound,
        int24 upperBound
    ) public payable {
        bytes memory message = abi.encode(
            specifiedUser,
            lowerBound,
            upperBound,
            width,
            liquidty
        );

        bytes32 _messageId = mailBox.dispatch(
            foreignChainID,
            addressToBytes32(destination),
            abi.encode(message, sender)
            //abi.encode(message)
        );

        interchainGasPaymaster.payForGas{value: msg.value}(
            _messageId,
            foreignChainID,
            gasAmount,
            msg.sender
        );
    }

    function transferBack(address payable user) public {
        user.transfer(address(this).balance);
    }

    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }

    //Dont forget to specify the interchainSecurityModule()
    // function interchainSecurityModule() external pure returns (address) {
    //     return 0x5Fe9b2cAcD42593408A49D97aa061a1666C595E9;
    // }
}
