// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {CryptoReporter} from "../src/CryptoReporter.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address scheduler = 0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B;
        
        vm.startBroadcast(deployerPrivateKey);

        CryptoReporter reporter = new CryptoReporter(scheduler);
        
        // Deposit 0.05 RITUAL to cover execution fees
        reporter.depositForFees{value: 0.05 ether}();

        vm.stopBroadcast();
    }
}
