const {getHostFromRequest, compileReviews} = require("./misc");
const {createContract} = require("./contract");

let contractTxs;
let web3;
let parsedABI;
let IPFSInteractor;

class ServerRequestsHandler {
    constructor(web3Subscription, IPFSInt) {
        if (!web3Subscription) {
            throw new Error('Web3 connection not provided');
        }
        if (!IPFSInt) {
            throw new Error('IPFS interactor not provided');
        }
        web3 = web3Subscription;
        contractTxs = createContract(web3);
        IPFSInteractor = IPFSInt;
        parsedABI = JSON.parse(process.env.CONTRACT_ABI);
    }

    async isWeb3Connected() {
        try {
            return await web3.eth.net.isListening();
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    async pingServer(req, res) {
        try {
            console.log('Ping from', req.ip);
            res.json({success: true, message: 'Pong'});
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: true, message: 'Ping reached but server encountered error during pinging back.'
            });
        }
    }

    async fetchAddAuthorizedEditorTransaction(req, res) {
        try {
            const {initiator, address} = req.query;
            console.log('Received add authorized editor request from', initiator, 'using address', address);
            if (!initiator) {
                console.log('Missing initiator');
                return res.status(400).json({success: false, message: 'Missing address'});
            }
            if (!address) {
                console.log('Missing address');
                return res.status(400).json({success: false, message: 'Missing address'});
            }
            const tx = await contractTxs.createAddAuthorizedEditorTransaction(initiator, address);
            console.log('Sending back an add authorized editor transaction for', initiator, ':', tx);
            res.status(200).json({
                success: true,
                message: JSON.parse(JSON.stringify(tx, (_, v) => typeof v === 'bigint' ? v.toString() : v))
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({success: false, message: 'Failed to create transaction'});
        }
    }

    async fetchRemoveAuthorizedEditorTransaction(req, res) {
        try {
            const {initiator} = req.query;
            const {address} = req.params;
            console.log('Received remove authorized editor request from', initiator, 'using address', address);
            if (!initiator) {
                console.log('Missing initiator');
                return res.status(400).json({success: false, message: 'Missing address'});
            }
            if (!address) {
                console.log('Missing address');
                return res.status(400).json({success: false, message: 'Missing address'});
            }
            const tx = await contractTxs.createRemoveAuthorizedEditorTransaction(initiator, address);
            console.log('Sending back a remove authorized editor transaction for', initiator, ':', JSON.stringify(tx, (_, v) => typeof v === 'bigint' ? v.toString() : v));
            res.status(200).json({
                success: true,
                message: JSON.parse(JSON.stringify(tx, (_, v) => typeof v === 'bigint' ? v.toString() : v))
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({success: false, message: 'Failed to create transaction'});
        }
    }

    async fetchAuthorizedEditors(req, res) {
        try {
            const {address} = req.params;
            if (address) {
                console.log('Received authorized editor check request from', req.ip, 'for address', address);
                const tx = await contractTxs.createIsAuthorizedEditorTransaction(address);
                const result = await web3.eth.call(tx);
                const outputs = parsedABI.find((element) => element.name === 'isAuthorizedEditorAddress').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                console.log('Authorized editor status for ', address, ':', decodedResult[0]);
                console.log('Sending back authorized editor status for', address);
                res.status(200).json({success: true, message: decodedResult[0]});
            } else {
                console.log('Received authorized editor list request from', req.ip);
                const tx = await contractTxs.createGetAuthorizedEditorsTransaction();
                const result = await web3.eth.call(tx);
                const outputs = parsedABI.find((element) => element.name === 'getAuthorizedEditors').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                console.log('Authorized editors:', decodedResult[0]);
                console.log('Sending back authorized editors for', req.ip);
                res.status(200).json({success: true, message: decodedResult[0]});
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({success: false, message: 'Failed to retrieve authorized editors'});
        }
    }

    async fetchUpdateInfoIPFSHashOfItemTransaction(req, res) {
        try {
            const {itemName} = req.params;
            const {initiator, ipfsHash} = req.query;
            console.log('Received item IPFS hash update request for', itemName, 'from', req.ip, 'using address', initiator);
            if (!initiator) {
                console.log('Missing initiator');
                res.status(400).json({success: false, message: 'Missing address'});
            }
            if (!itemName) {
                console.log('Missing item name');
                res.status(400).json({success: false, message: 'Missing item name'});
            }
            if (!ipfsHash) {
                console.log('Missing IPFS hash');
                res.status(400).json({success: false, message: 'Missing IPFS hash'});
            }
            const tx = await contractTxs.createUpdateInfoIPFSHashOfItemTransaction(initiator, itemName, ipfsHash);
            console.log('Sending back IPFS hash update transaction for', initiator, ':', tx);
            res.status(200).json({
                success: true, message: JSON.stringify(tx, (_, v) => typeof v === 'bigint' ? v.toString() : v)
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({success: false, message: 'Failed to create transaction'});
        }
    }

    async fetchGetInfoIPFSHashOfItem(req, res) {
        try {
            const {itemName} = req.params;
            console.log('Received item IPFS hash request for', itemName, 'from', req.ip);
            if (!itemName) {
                console.log('Missing item name');
                res.status(400).json({success: false, message: 'Missing item name'});
            }
            const tx = await contractTxs.createGetInfoIPFSHashOfItemTransaction(itemName);
            const result = await web3.eth.call(tx);
            const outputs = parsedABI.find((element) => element.name === 'getInfoIPFSHashOfItem').outputs;
            const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
            const ipfsHash = decodedResult[0];
            console.log('IPFS hash:', ipfsHash);
            console.log('Sending back IPFS hash for', req.ip);
            res.status(200).json({success: true, message: ipfsHash});
        } catch (error) {
            console.error(error);
            res.status(500).json({success: false, message: 'Failed to retrieve IPFS hash'});
        }
    }

    async fetchAddReviewTransaction(req, res) {
        try {
            const {itemName} = req.params;
            const {initiator} = req.query;
            const {comment, rating} = req.body;
            console.log('Received review request for', itemName, 'from', req.ip, 'using address', initiator);
            if (!initiator) {
                console.log('Missing initiator');
                res.status(400).json({success: false, message: 'Missing address'});
            }
            if (!itemName) {
                console.log('Missing item name');
                res.status(400).json({success: false, message: 'Missing item name'});
            }
            if (!rating) {
                console.log('Missing rating');
                res.status(400).json({success: false, message: 'Missing rating'});
            }
            console.log('Review comment:\n', comment);
            console.log('Review rating:\n', rating);
            const hostName = getHostFromRequest(req);
            const tx = await contractTxs.createAddReviewTransaction(initiator, hostName, itemName, comment, rating);
            console.log('Sending back add reviews transaction for', initiator,':', tx);
            res.status(200).json({
                success: true,
                message: JSON.parse(JSON.stringify(tx, (_, v) => typeof v === 'bigint' ? v.toString() : v))
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({success: false, message: 'Failed to add review'});
        }
    }

    async fetchDomainID(req, res) {
        try {
            const {domainName} = req.params;
            console.log('Received domain request for', domainName, 'from', req.ip);
            const tx = await contractTxs.createGetDomainIDTransaction(domainName);
            const result = await web3.eth.call(tx);
            const outputs = parsedABI.find((element) => element.name === 'getDomainID').outputs;
            const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
            console.log('Domain ID:', decodedResult[0]);
            console.log('Sending back domain ID for', req.ip);
            res.status(200).json({success: true, message: Number(decodedResult[0])});
        } catch (error) {
            console.error(error);
            res.status(500).json({success: false, message: 'Failed to retrieve domain ID'});
        }
    }

    async fetchDomains(req, res) {
        try {
            const {domainID} = req.query;
            const {domainName, itemName} = req.params;
            if (domainID || domainName) {
                let result;
                let outputs;
                if (domainID) {
                    console.log('Received domain request for ID', domainID, 'from', req.ip);
                    const tx = await contractTxs.createGetDomainByIDTransaction(domainID);
                    result = await web3.eth.call(tx);
                    outputs = parsedABI.find((element) => element.name === 'getDomainByID').outputs;
                } else if (domainName) {
                    console.log('Received domain request for', domainName, 'from', req.ip);
                    const tx = await contractTxs.createGetDomainTransaction(domainName);
                    result = await web3.eth.call(tx);
                    outputs = parsedABI.find((element) => element.name === 'getDomain').outputs;
                }
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                const domain = {
                    id: Number(decodedResult[0][0]), name: decodedResult[0][1], itemNames: decodedResult[0][2]
                }
                console.log('Domain:', domain);
                console.log('Sending back domain for', req.ip);
                res.status(200).json({success: true, message: domain});
            }  else if (itemName) {
                const tx = await contractTxs.createGetItemTransaction(itemName);
                const result = await web3.eth.call(tx);
                const outputs = parsedABI.find((element) => element.name === 'getItem').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                const availableOnDomainNames = decodedResult[0][3];
                console.log('Domains:', availableOnDomainNames);
                console.log('Sending back domains of item for', req.ip);
                res.status(200).json({success: true, message: availableOnDomainNames});
            }
            else {
                console.log('Received domains request from', req.ip);
                const tx = await contractTxs.createGetDomainsTransaction();
                let result = await web3.eth.call(tx);
                let outputs = parsedABI.find((element) => element.name === 'getDomains').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                const domains = [];
                for (let i = 0; i < decodedResult[0].length; i++) {
                    domains.push({
                        id: Number(decodedResult[0][i][0]), name: decodedResult[0][i][1], itemNames: decodedResult[0][i][2]
                    });
                }
                console.log('Domains:', domains);
                console.log('Sending back domains for', req.ip);
                res.status(200).json({success: true, message: domains});
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({success: false, message: 'Failed to retrieve domain'});
        }
    }

    async fetchItemID(req, res) {
        try {
            const {itemName} = req.params;
            console.log('Received item ID request for', itemName, 'from', req.ip);
            if (!itemName) {
                res.status(400).json({success: false, message: 'Missing item name'});
            }
            const tx = await contractTxs.createGetItemIDTransaction(itemName);
            const itemID = await web3.eth.call(tx);
            const outputs = parsedABI.find((element) => element.name === 'getItemID').outputs;
            const decodedResult = web3.eth.abi.decodeParameters(outputs, itemID);
            console.log('Item ID:', decodedResult[0]);
            console.log('Sending back item ID for', req.ip);
            res.status(200).json({success: true, message: Number(decodedResult[0])});
        } catch (error) {
            console.error(error);
            res.status(500).json({success: false, message: 'Failed to retrieve item ID'});
        }
    }

    async fetchItems(req, res) {
        try {
            const {itemName, itemID} = req.params;
            if (itemName || itemID) {
                let result;
                let outputs;
                if (itemName) {
                    console.log('Received item request for', itemName, 'from', req.ip);
                    const tx = await contractTxs.createGetItemTransaction(itemName);
                    result = await web3.eth.call(tx);
                    outputs = parsedABI.find((element) => element.name === 'getItem').outputs;
                } else if (itemID) {
                    console.log('Received item request for ID', itemID, 'from', req.ip);
                    const tx = await contractTxs.createGetItemByIDTransaction(itemID);
                    result = await web3.eth.call(tx);
                    outputs = parsedABI.find((element) => element.name === 'getItemByID').outputs;
                }
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                const item = {
                    id: Number(decodedResult[0][0]),
                    name: decodedResult[0][1],
                    infoIPFSHash: decodedResult[0][2],
                    availableOnDomainNames: decodedResult[0][3],
                    rating: decodedResult[0][4]
                }
                console.log('Item:', item);
                console.log('Sending back item for', req.ip);
                res.status(200).json({success: true, message: item})
            } else {
                console.log('Received items request from', req.ip);
                const outputs = parsedABI.find((element) => element.name === 'getItems').outputs;
                const tx = await contractTxs.createGetItemsTransaction();
                const result = await web3.eth.call(tx);
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                const items = [];
                for (let i = 0; i < decodedResult[0].length; i++) {
                    items.push({
                        id: Number(decodedResult[0][i][0]),
                        name: decodedResult[0][i][1],
                        infoIPFSHash: decodedResult[0][i][2],
                        availableOnDomainNames: decodedResult[0][i][3],
                        rating: decodedResult[0][i][4]
                    });
                }
                console.log('Items:', items);
                console.log('Sending back items for', req.ip);
                res.status(200).json({
                    success: true, message: items
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({success: false, message: 'Failed to retrieve item'});
        }
    }

    async fetchReviews(req, res) {
        try {
            const {domainID} = req.query;
            const {reviewID, itemName, address, domainName, itemID} = req.params;
            if (domainID) {
                console.log('Received reviews for domain ID request for', domainID, 'from', req.ip);
                const tx = await contractTxs.createGetReviewsForDomainByIDTransaction(domainID);
                const result = await web3.eth.call(tx);
                const outputs = parsedABI.find((element) => element.name === 'getReviewsForDomainByID').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                let reviews = compileReviews(decodedResult);
                console.log('Reviews:', reviews);
                console.log('Sending back reviews for domain for', req.ip);
                res.status(200).json({success: true, message: reviews});
            } else if (reviewID) {
                console.log('Received review request for ID', reviewID, 'from', req.ip);
                const tx = await contractTxs.createGetReviewByIDTransaction(reviewID);
                const result = await web3.eth.call(tx);
                const outputs = parsedABI.find((element) => element.name === 'getReviewByID').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                const review = {
                    id: Number(decodedResult[0][0]),
                    reviewer: decodedResult[0][1],
                    itemName: decodedResult[0][2],
                    domainName: decodedResult[0][3],
                    comment: decodedResult[0][4],
                    rating: decodedResult[0][5]
                }
                console.log('Review:', review);
                console.log('Sending back review for', req.ip);
                res.status(200).json({success: true, message: review});
            } else if (itemName) {
                console.log('Received reviews for item request for', itemName, 'from', req.ip);
                const tx = await contractTxs.createGetReviewsForItemTransaction(itemName);
                const result = await web3.eth.call(tx);
                const outputs = parsedABI.find((element) => element.name === 'getReviewsForItem').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                let reviews = compileReviews(decodedResult);
                console.log('Reviews:', reviews);
                console.log('Sending back reviews for item for', req.ip);
                res.status(200).json({success: true, message: reviews});
            } else if (itemID){
                console.log('Received reviews for item ID request for', itemID, 'from', req.ip);
                const tx = await contractTxs.createGetReviewsForItemByIDTransaction(itemID);
                const result = await web3.eth.call(tx);
                const outputs = parsedABI.find((element) => element.name === 'getReviewsForItemByID').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                let reviews = compileReviews(decodedResult);
                console.log('Reviews:', reviews);
                console.log('Sending back reviews for item for', req.ip);
                res.status(200).json({success: true, message: reviews});
            } else if (address) {
                console.log('Received reviews for user request for', address, 'from', req.ip);
                const tx = await contractTxs.createGetUserReviewsTransaction(address);
                const result = await web3.eth.call(tx);
                const outputs = parsedABI.find((element) => element.name === 'getUserReviews').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                let reviews = compileReviews(decodedResult);
                console.log('Reviews:', reviews);
                console.log('Sending back reviews of user for', req.ip);
                res.status(200).json({success: true, message: reviews});
            } else if (domainName) {
                console.log('Received reviews for domain request for', domainName, 'from', req.ip);
                const tx = await contractTxs.createGetReviewsForDomainTransaction(domainName);
                const result = await web3.eth.call(tx);
                const outputs = parsedABI.find((element) => element.name === 'getReviewsForDomain').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                let reviews = compileReviews(decodedResult);
                console.log('Reviews:', reviews);
                console.log('Sending back reviews for domain for', req.ip);
                res.status(200).json({success: true, message: reviews});
            } else {
                console.log('Received reviews request from', req.ip);
                const tx = await contractTxs.createGetReviewsTransaction();
                const result = await web3.eth.call(tx);
                const outputs = parsedABI.find((element) => element.name === 'getReviews').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                const reviews = compileReviews(decodedResult);
                console.log('Reviews:', reviews);
                console.log('Sending back reviews for', req.ip);
                res.status(200).json({success: true, message: reviews});
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({success: false, message: 'Failed to retrieve review'});
        }
    }

    async fetchReviewsForItemOfDomain(req, res) {
        try {
            const {domainName, domainID, itemName, itemID} = req.params;
            console.log('Received reviews for item of domain request from', req.ip);
            let tx;
            let result;
            let outputs;
            let decodedResult;
            let reviews;
            if (domainName) {
                if (itemName){
                    tx = await contractTxs.createGetReviewsForItemOfDomainTransaction(domainName, itemName);
                    result = await web3.eth.call(tx);
                    outputs = parsedABI.find((element) => element.name === 'getReviewsForItemOfDomain').outputs;
                } else if (itemID) {
                    tx = await contractTxs.createGetReviewsForItemIDOfDomainTransaction(domainName, itemID);
                    result = await web3.eth.call(tx);
                    outputs = parsedABI.find((element) => element.name === 'getReviewsForItemIDOfDomain').outputs;
                } else {
                    console.log('Missing item name or ID');
                    return res.status(400).json({success: false, message: 'Missing item name or ID'});
                }
            } else if (domainID) {
                if (itemName) {
                    tx = await contractTxs.createGetReviewsForItemOfDomainByIDTransaction(domainID, itemName);
                    result = await web3.eth.call(tx);
                    outputs = parsedABI.find((element) => element.name === 'getReviewsForItemOfDomainByID').outputs;
                } else if (itemID) {
                    tx = await contractTxs.createGetReviewsForItemIDOfDomainByIDTransaction(domainID, itemID);
                    result = await web3.eth.call(tx);
                    outputs = parsedABI.find((element) => element.name === 'getReviewsForItemIDOfDomain').outputs;
                } else {
                    console.log('Missing item name or ID');
                    return res.status(400).json({success: false, message: 'Missing item name or ID'});
                }
            } else {
                console.log('Missing domain name or ID');
                return res.status(400).json({success: false, message: 'Missing domain name or ID'});
            }
            decodedResult = web3.eth.abi.decodeParameters(outputs, result);
            reviews = compileReviews(decodedResult);
            console.log('Reviews:', reviews);
            console.log('Sending back reviews for item of domain for', req.ip);
            res.status(200).json({success: true, message: reviews});
        } catch (error) {
            console.error(error);
            res.status(500).json({success: false, message: 'Failed to retrieve reviews for item of domain'});
        }
    }

    async updateItemInfo(req, res) {
        try {
            const {initiator} = req.query;
            const {itemName} = req.params;
            const {alternateName, description, images} = req.body;
            if (!initiator) {
                console.log('Missing initiator');
                return res.status(400).json({success: false, message: 'Missing address'});
            }
            if (!itemName) {
                console.log('Missing item name');
                return res.status(400).json({success: false, message: 'Missing item name'});
            }
            if (req.body === undefined || req.body.length === 0) {
                console.log('Missing body');
                return res.status(400).json({success: false, message: 'Missing body'});
            }

            console.log('Received update item info request for', itemName, 'from', req.ip, 'using address', initiator);
            console.log('Alternate name:', alternateName);
            console.log('Description:', description);
            console.log('Images:', images);

            // Check if the address is even able to update the item
            console.log('Checking if', initiator, 'is authorized to update item info');
            const txCheck = await contractTxs.createIsAuthorizedEditorTransaction(initiator);
            const result = await web3.eth.call(txCheck);
            const outputs = parsedABI.find((element) => element.name === 'isAuthorizedEditorAddress').outputs;
            const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
            if (!decodedResult[0]) {
                console.log('Unauthorized to update item info');
                return res.status(403).json({success: false, message: 'Unauthorized to update item info'});
            }
            console.log(initiator, 'is authorized to update item info');

            // Check if item even exists
            console.log('Checking if', itemName, 'exists');
            const txCheckItem = await contractTxs.createGetItemTransaction(itemName);
            const resultItem = await web3.eth.call(txCheckItem);
            const outputsItem = parsedABI.find((element) => element.name === 'getItem').outputs;
            const decodedResultItem = web3.eth.abi.decodeParameters(outputsItem, resultItem);
            if (!decodedResultItem[0]) {
                console.log('Item does not exist');
                return res.status(404).json({success: false, message: 'Item does not exist'});
            }
            console.log(itemName, 'exists');
            console.log('Updating IPFS info for', itemName);
            const data = {
                "Item Name": itemName, "Alternate Name": alternateName, "Description": description, "Images": images
            };
            const ipfsHash = await IPFSInteractor.saveToIPFS(JSON.stringify(data), itemName);
            console.log('IPFS hash:', ipfsHash);
            console.log('Sending back IPFS hash update transaction for', initiator);
            const tx = await contractTxs.createUpdateInfoIPFSHashOfItemTransaction(initiator, itemName, ipfsHash);
            res.status(200).json({
                success: true,
                message: JSON.parse(JSON.stringify(tx, (_, v) => typeof v === 'bigint' ? v.toString() : v))
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({success: false, message: 'Failed to update item info'});
        }
    }

    async fetchItemInfo(req, res) {
        try {
            const {itemName} = req.params;
            console.log('Received item info request for', itemName, 'from', req.ip);
            if (!itemName) {
                console.log('Missing item name');
                return res.status(400).json({success: false, message: 'Missing item name'});
            }
            console.log('Fetching item info for', itemName);
            const tx = await contractTxs.createGetInfoIPFSHashOfItemTransaction(itemName);
            const result = await web3.eth.call(tx);
            const outputs = parsedABI.find((element) => element.name === 'getInfoIPFSHashOfItem').outputs;
            const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
            const ipfsHash = decodedResult[0];
            console.log('Getting item info from IPFS with hash:', ipfsHash)
            const response = await IPFSInteractor.getFromIPFS(ipfsHash);
            console.log('Item info:', response);
            console.log('Sending back item info for', req.ip);
            res.status(200).json({success: true, message: response});
        } catch (error) {
            console.error(error);
            res.status(500).json({success: false, message: 'Failed to retrieve item info'});
        }
    }
}

function createServerRequestsHandler(web3Subscription, IPFSInteractor) {
    return new ServerRequestsHandler(web3Subscription, IPFSInteractor);
}

module.exports = {
    createServerRequestsHandler
}