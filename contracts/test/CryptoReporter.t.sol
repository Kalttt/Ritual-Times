// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {CryptoReporter} from "../src/CryptoReporter.sol";

contract MockScheduler {
    uint256 public nextCallId = 1;
    function schedule(
        bytes calldata /*data*/,
        uint32 /*gas*/,
        uint32 /*startBlock*/,
        uint32 /*numCalls*/,
        uint32 /*frequency*/,
        uint32 /*ttl*/,
        uint256 /*maxFeePerGas*/,
        uint256 /*maxPriorityFeePerGas*/,
        uint256 /*value*/,
        address /*payer*/
    ) external returns (uint256 callId) {
        return nextCallId++;
    }

    function cancel(uint256 /*callId*/) external {}
    function approveScheduler(address /*schedulerContract*/) external {}
}

contract CryptoReporterTest is Test {
    CryptoReporter public reporter;
    MockScheduler public scheduler;

    function setUp() public {
        scheduler = new MockScheduler();
        reporter = new CryptoReporter(address(scheduler));
    }

    function testScheduleDailyReport() public {
        reporter.scheduleDailyReport(address(1), "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd", 246858, 365);
        assertEq(reporter.activeScheduleId(), 1);
    }
}
