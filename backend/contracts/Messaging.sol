// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Messaging
 * @dev On-chain encrypted messaging system
 */
contract Messaging {
    struct Message {
        address sender;
        address recipient;
        string encryptedContent; // Encrypted message content
        uint256 timestamp;
        bool read;
    }
    
    mapping(address => Message[]) public inbox; // recipient => messages
    mapping(address => Message[]) public sent; // sender => messages
    mapping(address => mapping(address => bool)) public blockedUsers; // user => blocked addresses
    
    uint256 public totalMessages;
    
    event MessageSent(
        address indexed sender,
        address indexed recipient,
        uint256 timestamp,
        uint256 messageId
    );
    event MessageRead(address indexed recipient, uint256 messageId);
    event UserBlocked(address indexed blocker, address indexed blocked);
    event UserUnblocked(address indexed blocker, address indexed unblocked);
    
    modifier notBlocked(address _recipient) {
        require(!blockedUsers[_recipient][msg.sender], "You are blocked by this user");
        _;
    }
    
    function sendMessage(address _recipient, string memory _encryptedContent) 
        public 
        notBlocked(_recipient) 
        returns (uint256) 
    {
        require(_recipient != address(0), "Cannot send to zero address");
        require(_recipient != msg.sender, "Cannot send message to yourself");
        require(bytes(_encryptedContent).length > 0, "Message cannot be empty");
        
        Message memory newMessage = Message({
            sender: msg.sender,
            recipient: _recipient,
            encryptedContent: _encryptedContent,
            timestamp: block.timestamp,
            read: false
        });
        
        inbox[_recipient].push(newMessage);
        sent[msg.sender].push(newMessage);
        
        uint256 messageId = totalMessages;
        totalMessages++;
        
        emit MessageSent(msg.sender, _recipient, block.timestamp, messageId);
        
        return messageId;
    }
    
    function markAsRead(uint256 _messageIndex) public {
        require(_messageIndex < inbox[msg.sender].length, "Message not found");
        
        inbox[msg.sender][_messageIndex].read = true;
        
        emit MessageRead(msg.sender, _messageIndex);
    }
    
    function getInboxCount() public view returns (uint256) {
        return inbox[msg.sender].length;
    }
    
    function getSentCount() public view returns (uint256) {
        return sent[msg.sender].length;
    }
    
    function getInboxMessage(uint256 _index) public view returns (
        address sender,
        string memory encryptedContent,
        uint256 timestamp,
        bool read
    ) {
        require(_index < inbox[msg.sender].length, "Message not found");
        
        Message memory message = inbox[msg.sender][_index];
        return (message.sender, message.encryptedContent, message.timestamp, message.read);
    }
    
    function getSentMessage(uint256 _index) public view returns (
        address recipient,
        string memory encryptedContent,
        uint256 timestamp,
        bool read
    ) {
        require(_index < sent[msg.sender].length, "Message not found");
        
        Message memory message = sent[msg.sender][_index];
        return (message.recipient, message.encryptedContent, message.timestamp, message.read);
    }
    
    function getUnreadCount() public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < inbox[msg.sender].length; i++) {
            if (!inbox[msg.sender][i].read) {
                count++;
            }
        }
        return count;
    }
    
    function blockUser(address _user) public {
        require(_user != address(0), "Cannot block zero address");
        require(_user != msg.sender, "Cannot block yourself");
        require(!blockedUsers[msg.sender][_user], "User already blocked");
        
        blockedUsers[msg.sender][_user] = true;
        
        emit UserBlocked(msg.sender, _user);
    }
    
    function unblockUser(address _user) public {
        require(blockedUsers[msg.sender][_user], "User not blocked");
        
        blockedUsers[msg.sender][_user] = false;
        
        emit UserUnblocked(msg.sender, _user);
    }
    
    function isBlocked(address _user) public view returns (bool) {
        return blockedUsers[msg.sender][_user];
    }
}
