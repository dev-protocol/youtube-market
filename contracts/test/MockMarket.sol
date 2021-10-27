// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.8.4;
// import {IMarket} from "contracts/YoutubeMarket.sol";
import {IMarket} from "@devprotocol/protocol-l2/contracts/interface/IMarket.sol";

contract MockMarket {
    address public latestMetrics;

    // function authenticate(
    //     address,
    //     string memory,
    //     string memory,
    //     string memory,
    //     string memory,
    //     string memory
    // ) external returns (bool) {
    //     return true;
    // }

    function setLatestMetrics(address _metrics) external {
        latestMetrics = _metrics;
    }

    // function authenticatedCallback(address, bytes32)
    //     external
    //     override
    //     returns (address)
    // {
    //     return latestMetrics;
    // }

    // // solium-disable-next-line no-empty-blocks
    // function deauthenticate(address) external override {}

    // function schema() external override view returns (string memory) {
    //     return "";
    // }

    // function behavior() external override view returns (address) {
    //     return address(0);
    // }

    // function enabled() external override view returns (bool) {
    //     return true;
    // }

    // function votingEndBlockNumber() external view returns (uint256) {
    //     return 0;
    // }

    // // solium-disable-next-line no-empty-blocks
    // function toEnable() external override {}
}
