// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UserRegistry
 * @dev Manages user registration and profiles on-chain
 */
contract UserRegistry {
    struct User {
        string username;
        string profileData; // JSON string for additional data
        uint256 registeredAt;
        bool exists;
    }
    
    mapping(address => User) public users;
    mapping(string => address) public usernameToAddress;
    
    address[] public userAddresses;
    
    event UserRegistered(address indexed userAddress, string username, uint256 timestamp);
    event ProfileUpdated(address indexed userAddress, string profileData);
    
    modifier onlyRegistered() {
        require(users[msg.sender].exists, "User not registered");
        _;
    }
    
    function registerUser(string memory _username, string memory _profileData) public {
        require(!users[msg.sender].exists, "User already registered");
        require(bytes(_username).length >= 3 && bytes(_username).length <= 20, "Username must be 3-20 characters");
        require(usernameToAddress[_username] == address(0), "Username already taken");
        
        users[msg.sender] = User({
            username: _username,
            profileData: _profileData,
            registeredAt: block.timestamp,
            exists: true
        });
        
        usernameToAddress[_username] = msg.sender;
        userAddresses.push(msg.sender);
        
        emit UserRegistered(msg.sender, _username, block.timestamp);
    }
    
    function updateProfile(string memory _profileData) public onlyRegistered {
        users[msg.sender].profileData = _profileData;
        emit ProfileUpdated(msg.sender, _profileData);
    }
    
    function getUser(address _address) public view returns (
        string memory username,
        string memory profileData,
        uint256 registeredAt,
        bool exists
    ) {
        User memory user = users[_address];
        return (user.username, user.profileData, user.registeredAt, user.exists);
    }
    
    function getUserByUsername(string memory _username) public view returns (
        address userAddress,
        string memory profileData,
        uint256 registeredAt
    ) {
        address addr = usernameToAddress[_username];
        require(addr != address(0), "Username not found");
        
        User memory user = users[addr];
        return (addr, user.profileData, user.registeredAt);
    }
    
    function isUsernameAvailable(string memory _username) public view returns (bool) {
        return usernameToAddress[_username] == address(0);
    }
    
    function getTotalUsers() public view returns (uint256) {
        return userAddresses.length;
    }
    
    function getAllUsers() public view returns (address[] memory) {
        return userAddresses;
    }
}
