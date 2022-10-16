// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Greeter {
    
    function getTime() public view returns (uint256) {
        
        return block.timestamp;
    
    }
}