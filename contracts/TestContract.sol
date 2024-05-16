// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract TestContract {
    address private owner;
    mapping(string => string) private items;

    constructor(){
        owner = msg.sender;
    }

    function modifyItemIPFSHash(string memory _item, string memory _ipfsHash) public {
        require(msg.sender == owner, "Only owner can modify this.");
        items[_item] = _ipfsHash;
    }

    function getItemIPFSHash(string memory _item) public view returns(string memory){
        return items[_item];
    }

    function processReview(int memory cost) public payable {
        require(cost <= address(msg.sender).balance, "Invalid cost");
        payable(owner).transfer(cost);
    }
}
