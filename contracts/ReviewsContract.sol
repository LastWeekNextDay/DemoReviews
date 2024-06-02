// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

library FloatString {
    function toFloatingPointString(uint integerPart, uint fractionalPart) internal pure returns (string memory) {
        return string(abi.encodePacked(uint2str(integerPart), ".", uint2str(fractionalPart)));
    }

    function uint2str(uint _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}

contract ReviewsContract {
    struct Review {
        uint ID;
        address reviewer;
        string itemName;
        string domainName;
        string comment;
        uint8 rating;
    }

    struct Item {
        uint ID;
        string name;
        string infoIPFSHash; // IPFS hash of item info
        string[] availableOnDomainNames;
        string rating; // Average rating of item as string for floating point precision
    }

    struct Domain {
        uint ID;
        string name;
        string[] itemNames; // Items available on domain
    }

    address private owner;
    address[] private authorizedEditors;
    mapping(address => bool) private isAuthorizedEditor;

    uint private reviewIDIterator;
    uint private itemIDIterator;
    uint private domainIDIterator;

    mapping(address => uint[]) private userReviewIDs; // User address => review IDs

    mapping(string => Domain) private domains; // domainName => Domain
    mapping(string => bool) private domainExists; // domainName => bool
    mapping(uint => string) private domainNameOfID; // domainID => domainName
    mapping(string => mapping(string => bool)) private domainProvidesItem; // domainName => itemName => bool

    mapping(string => Item) private items; // itemName => Item
    mapping(string => bool) private itemExists; // itemName => bool
    mapping(uint => string) private itemNameOfID; // itemID => itemName
    mapping(string => uint) private itemReviewCount; // itemName => count of reviews
    mapping(string => uint) private itemTotalAccumulatedRating; // itemName => total accumulated rating

    mapping(string => uint[]) private reviewIDs; // itemName => review IDs
    mapping(uint => Review) private reviewOfIDs; // reviewID => Review
    mapping(string => mapping(address => bool)) private itemReviewForUserExists; // itemName => user => bool

    constructor(){
        owner = msg.sender;
        authorizedEditors.push(owner);
        isAuthorizedEditor[owner] = true;
    }

    //*** AUTHORIZATION ***//

    function addAuthorizedEditor(address editor) external {
        require(msg.sender == owner, "Only owner");
        require(!isAuthorizedEditor[editor], "Editor exists");
        authorizedEditors.push(editor);
        isAuthorizedEditor[editor] = true;
    }

    function removeAuthorizedEditor(address editor) external {
        require(msg.sender == owner, "Only owner");
        require(editor != owner, "Owner irremovable");
        require(isAuthorizedEditor[editor], "Editor does not exist");
        isAuthorizedEditor[editor] = false;
        for (uint i = 0; i < authorizedEditors.length; i++) {
            if (authorizedEditors[i] == editor) {
                authorizedEditors[i] = authorizedEditors[authorizedEditors.length - 1];
                authorizedEditors.pop();
                break;
            }
        }
    }

    function getAuthorizedEditors() external view returns (address[] memory) {
        return authorizedEditors;
    }

    function isAuthorizedEditorAddress(address editor) external view returns (bool) {
        return isAuthorizedEditor[editor];
    }

    //*** ITEM INFO ***//

    function updateInfoIPFSHashOfItem(string memory itemName, string memory itemIPFSHash) external {
        require(isAuthorizedEditor[msg.sender] || msg.sender == owner, "Only authorized editors");
        require(itemExists[itemName], "Item does not exist");

        items[itemName].infoIPFSHash = itemIPFSHash;
    }

    function getInfoIPFSHashOfItem(string memory itemName) external view returns (string memory) {
        require(itemExists[itemName], "Item does not exist");

        return items[itemName].infoIPFSHash;
    }

    //*** ADD REVIEW ***//

    function addReview(string memory domainName, string memory itemName, string memory comment, uint8 rating) external {
        require(rating >= 1 && rating <= 5, "Rating not between 1 and 5");
        if (bytes(domainName).length == 0 || bytes(itemName).length == 0) {
            revert("Invalid input");
        }

        // Check if review exists
        if (itemReviewForUserExists[itemName][msg.sender]) {
            revert("User already reviewed this item");
        }

        // Check if domain exists
        if (!domainExists[domainName]) {
            addDomain(domainName);
        }

        // Check if item exists
        if (!itemExists[itemName]) {
            addItem(itemName);
        }

        // Add review
        Review memory review = Review(reviewIDIterator, msg.sender, itemName, domainName, comment, rating);
        itemReviewCount[itemName]++;
        itemTotalAccumulatedRating[itemName] += rating;
        uint averageRating = (itemTotalAccumulatedRating[itemName] * 100) / itemReviewCount[itemName];
        items[itemName].rating = FloatString.toFloatingPointString(averageRating / 100, averageRating % 100);
        reviewOfIDs[reviewIDIterator] = review;
        reviewIDs[itemName].push(reviewIDIterator);
        itemReviewForUserExists[itemName][msg.sender] = true;
        userReviewIDs[msg.sender].push(reviewIDIterator);
        reviewIDIterator++;

        // Add item to domain if not already in domain
        if (!domainProvidesItem[domainName][itemName]) {
            domains[domainName].itemNames.push(itemName);
            items[itemName].availableOnDomainNames.push(domainName);
            domainProvidesItem[domainName][itemName] = true;
        }
    }

    function addDomain(string memory domainName) private {
        Domain memory domain = Domain(domainIDIterator, domainName, new string[](0));
        domains[domainName] = domain;
        domainExists[domainName] = true;
        domainNameOfID[domainIDIterator] = domainName;
        domainIDIterator++;
    }

    function addItem(string memory itemName) private {
        Item memory item = Item(itemIDIterator, itemName, "", new string[](0), "0.00");
        items[itemName] = item;
        itemExists[itemName] = true;
        itemNameOfID[itemIDIterator] = itemName;
        itemIDIterator++;
    }

    //*** GETTERS ***//

    //*** DOMAIN ***//

    function getDomainID(string memory domainName) external view returns (uint) {
        require(domainExists[domainName], "Domain does not exist");

        return domains[domainName].ID;
    }

    function getDomainByID(uint domainID) external view returns (Domain memory) {
        return getDomain(domainNameOfID[domainID]);
    }

    function getDomain(string memory domainName) public view returns (Domain memory) {
        require(domainExists[domainName], "Domain does not exist");

        return domains[domainName];
    }

    function getDomains() external view returns (Domain[] memory) {
        Domain[] memory domainArray = new Domain[](domainIDIterator);
        for (uint i = 0; i < domainIDIterator; i++) {
            domainArray[i] = domains[domainNameOfID[i]];
        }
        return domainArray;
    }

    //*** ITEM ***//

    function getItemID(string memory itemName) external view returns (uint) {
        require(itemExists[itemName], "Item does not exist");

        return items[itemName].ID;
    }

    function getItemByID(uint itemID) external view returns (Item memory) {
        return getItem(itemNameOfID[itemID]);
    }

    function getItem(string memory itemName) public view returns (Item memory) {
        require(itemExists[itemName], "Item does not exist");

        return items[itemName];
    }

    function getItems() external view returns (Item[] memory) {
        Item[] memory itemArray = new Item[](itemIDIterator);
        for (uint i = 0; i < itemIDIterator; i++) {
            itemArray[i] = items[itemNameOfID[i]];
        }
        return itemArray;
    }

    //*** REVIEW ***//

    function getReviewByID(uint reviewID) external view returns (Review memory) {
        require(reviewID < reviewIDIterator || reviewID > reviewIDIterator, "Review does not exist");

        return reviewOfIDs[reviewID];
    }

    function getReviews() external view returns (Review[] memory) {
        Review[] memory reviews = new Review[](reviewIDIterator);
        for (uint i = 0; i < reviewIDIterator; i++) {
            reviews[i] = reviewOfIDs[i];
        }
        return reviews;
    }

    //*** REVIEWS FOR DOMAIN ***//

    function getReviewsForDomain(string memory domainName) public view returns (Review[] memory) {
        require(domainExists[domainName], "Domain does not exist");

        Domain memory domain = domains[domainName];
        string[] memory itemNames = domain.itemNames;
        uint totalReviews = 0;
        for (uint i = 0; i < itemNames.length; i++) {
            totalReviews += reviewIDs[itemNames[i]].length;
        }
        Review[] memory reviewsForDomain = new Review[](totalReviews);
        uint index = 0;
        for (uint i = 0; i < itemNames.length; i++) {
            uint[] memory reviewIDsForItem = reviewIDs[itemNames[i]];
            for (uint j = 0; j < reviewIDsForItem.length; j++) {
                Review memory review = reviewOfIDs[reviewIDsForItem[j]];
                if (keccak256(bytes(review.domainName)) == keccak256(bytes(domainName))) {
                    reviewsForDomain[index] = review;
                    index++;
                }
            }
        }
        return reviewsForDomain;
    }

    function getReviewsForDomainByID(uint domainID) external view returns (Review[] memory) {
        return getReviewsForDomain(domainNameOfID[domainID]);
    }

    //*** REVIEWS FOR ITEM ***//

    function getReviewsForItem(string memory itemName) public view returns (Review[] memory) {
        require(itemExists[itemName], "Item does not exist");

        uint[] memory reviewIDsForItem = reviewIDs[itemName];
        Review[] memory reviewsForItem = new Review[](reviewIDsForItem.length);
        for (uint i = 0; i < reviewIDsForItem.length; i++) {
            reviewsForItem[i] = reviewOfIDs[reviewIDsForItem[i]];
        }
        return reviewsForItem;
    }

    function getReviewsForItemByID(uint itemID) external view returns (Review[] memory) {
        return getReviewsForItem(itemNameOfID[itemID]);
    }

    //*** USER REVIEWS ***//

    function getUserReviews(address user) external view returns (Review[] memory) {
        uint[] memory userReviewIDsArray = userReviewIDs[user];
        require(userReviewIDsArray.length > 0, "User has no reviews");

        Review[] memory reviewsForUser = new Review[](userReviewIDsArray.length);
        for (uint i = 0; i < userReviewIDsArray.length; i++) {
            reviewsForUser[i] = reviewOfIDs[userReviewIDsArray[i]];
        }
        return reviewsForUser;
    }

    //*** REVIEWS FOR ITEM OF DOMAIN ***//

    function getReviewsForItemOfDomain(string memory domainName, string memory itemName) public view returns (Review[] memory) {
        require(domainExists[domainName], "Domain does not exist");
        require(itemExists[itemName], "Item does not exist");
        require(domainProvidesItem[domainName][itemName], "Item not on domain");

        uint[] memory reviewIDsForItem = reviewIDs[itemName];
        Review[] memory reviewsForItemOfDomain = new Review[](reviewIDsForItem.length);
        uint index = 0;
        for (uint i = 0; i < reviewIDsForItem.length; i++) {
            if (keccak256(bytes(reviewOfIDs[reviewIDsForItem[i]].domainName)) == keccak256(bytes(domainName))) {
                reviewsForItemOfDomain[index] = reviewOfIDs[reviewIDsForItem[i]];
                index++;
            }
        }
        return reviewsForItemOfDomain;
    }

    function getReviewsForItemIDOfDomainByID(uint domainID, uint itemID) external view returns (Review[] memory) {
        return getReviewsForItemOfDomain(domainNameOfID[domainID], itemNameOfID[itemID]);
    }

    function getReviewsForItemOfDomainByID(uint domainID, string memory itemName) external view returns (Review[] memory) {
        return getReviewsForItemOfDomain(domainNameOfID[domainID], itemName);
    }

    function getReviewsForItemIDOfDomain(string memory domainName, uint itemID) external view returns (Review[] memory) {
        return getReviewsForItemOfDomain(domainName, itemNameOfID[itemID]);
    }
}
