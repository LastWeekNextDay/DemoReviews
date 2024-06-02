const {getHostFromRequest, compileReviews} = require("./misc");
const {createContract} = require("./contract");
const {dateLog} = require("./logger");

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
            dateLog('Ping from', req.ip);
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
            dateLog('Received add authorized editor request from', initiator, 'using address', address);
            if (!initiator) {
                dateLog('Missing initiator');
                return res.status(400).json({success: false, message: 'Missing address'});
            }
            if (!address) {
                dateLog('Missing address');
                return res.status(400).json({success: false, message: 'Missing address'});
            }
            const tx = await contractTxs.createAddAuthorizedEditorTransaction(initiator, address);
            dateLog('Sending back an add authorized editor transaction for', initiator, ':\n', JSON.stringify(tx, (_, v) => typeof v === 'bigint' ? v.toString() : v));
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
            dateLog('Received remove authorized editor request from', initiator, 'using address', address);
            if (!initiator) {
                dateLog('Missing initiator');
                return res.status(400).json({success: false, message: 'Missing address'});
            }
            if (!address) {
                dateLog('Missing address');
                return res.status(400).json({success: false, message: 'Missing address'});
            }
            const tx = await contractTxs.createRemoveAuthorizedEditorTransaction(initiator, address);
            dateLog('Sending back a remove authorized editor transaction for', initiator, ':\n', JSON.stringify(tx, (_, v) => typeof v === 'bigint' ? v.toString() : v));
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
                dateLog('Received authorized editor check request from', req.ip, 'for address', address);
                const tx = await contractTxs.createIsAuthorizedEditorTransaction(address);
                const result = await web3.eth.call(tx);
                const outputs = parsedABI.find((element) => element.name === 'isAuthorizedEditorAddress').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                dateLog('Authorized editor status for ', address, ':', decodedResult[0]);
                dateLog('Sending back authorized editor status for', address);
                res.status(200).json({success: true, message: decodedResult[0]});
            } else {
                dateLog('Received authorized editor list request from', req.ip);
                const tx = await contractTxs.createGetAuthorizedEditorsTransaction();
                const result = await web3.eth.call(tx);
                const outputs = parsedABI.find((element) => element.name === 'getAuthorizedEditors').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                dateLog('Authorized editors:', decodedResult[0]);
                dateLog('Sending back authorized editors for', req.ip);
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
            dateLog('Received item IPFS hash update request for', itemName, 'from', req.ip, 'using address', initiator);
            if (!initiator) {
                dateLog('Missing initiator');
                res.status(400).json({success: false, message: 'Missing address'});
            }
            if (!itemName) {
                dateLog('Missing item name');
                res.status(400).json({success: false, message: 'Missing item name'});
            }
            if (!ipfsHash) {
                dateLog('Missing IPFS hash');
                res.status(400).json({success: false, message: 'Missing IPFS hash'});
            }
            const tx = await contractTxs.createUpdateInfoIPFSHashOfItemTransaction(initiator, itemName, ipfsHash);
            dateLog('Sending back IPFS hash update transaction for', initiator, ':\n', JSON.stringify(tx, (_, v) => typeof v === 'bigint' ? v.toString() : v));
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
            dateLog('Received item IPFS hash request for', itemName, 'from', req.ip);
            if (!itemName) {
                dateLog('Missing item name');
                res.status(400).json({success: false, message: 'Missing item name'});
            }
            const tx = await contractTxs.createGetInfoIPFSHashOfItemTransaction(itemName);
            const result = await web3.eth.call(tx);
            const outputs = parsedABI.find((element) => element.name === 'getInfoIPFSHashOfItem').outputs;
            const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
            const ipfsHash = decodedResult[0];
            dateLog('IPFS hash:', ipfsHash);
            dateLog('Sending back IPFS hash for', req.ip);
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
            dateLog('Received review request for', itemName, 'from', req.ip, 'using address', initiator);
            if (!initiator) {
                dateLog('Missing initiator');
                res.status(400).json({success: false, message: 'Missing address'});
            }
            if (!itemName) {
                dateLog('Missing item name');
                res.status(400).json({success: false, message: 'Missing item name'});
            }
            if (!rating) {
                dateLog('Missing rating');
                res.status(400).json({success: false, message: 'Missing rating'});
            }
            dateLog('\nReview comment:\n', comment, '\nReview rating:\n', rating);
            const hostName = getHostFromRequest(req);
            const tx = await contractTxs.createAddReviewTransaction(initiator, hostName, itemName, comment, rating);
            dateLog('Sending back add reviews transaction for', initiator,':\n', JSON.stringify(tx, (_, v) => typeof v === 'bigint' ? v.toString() : v));
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
            dateLog('Received domain request for', domainName, 'from', req.ip);
            const tx = await contractTxs.createGetDomainIDTransaction(domainName);
            const result = await web3.eth.call(tx);
            const outputs = parsedABI.find((element) => element.name === 'getDomainID').outputs;
            const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
            dateLog('Domain ID:', decodedResult[0]);
            dateLog('Sending back domain ID for', req.ip);
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
                    dateLog('Received domain request for ID', domainID, 'from', req.ip);
                    const tx = await contractTxs.createGetDomainByIDTransaction(domainID);
                    result = await web3.eth.call(tx);
                    outputs = parsedABI.find((element) => element.name === 'getDomainByID').outputs;
                } else if (domainName) {
                    dateLog('Received domain request for', domainName, 'from', req.ip);
                    const tx = await contractTxs.createGetDomainTransaction(domainName);
                    result = await web3.eth.call(tx);
                    outputs = parsedABI.find((element) => element.name === 'getDomain').outputs;
                }
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                const domain = {
                    id: Number(decodedResult[0][0]), name: decodedResult[0][1], itemNames: decodedResult[0][2]
                }
                dateLog('Domain:\n', domain);
                dateLog('Sending back domain for', req.ip);
                res.status(200).json({success: true, message: domain});
            }  else if (itemName) {
                const tx = await contractTxs.createGetItemTransaction(itemName);
                const result = await web3.eth.call(tx);
                const outputs = parsedABI.find((element) => element.name === 'getItem').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                const availableOnDomainNames = decodedResult[0][3];
                dateLog('Domains:', availableOnDomainNames);
                dateLog('Sending back domains of item for', req.ip);
                res.status(200).json({success: true, message: availableOnDomainNames});
            }
            else {
                dateLog('Received domains request from', req.ip);
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
                dateLog('Domains:', domains);
                dateLog('Sending back domains for', req.ip);
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
            dateLog('Received item ID request for', itemName, 'from', req.ip);
            if (!itemName) {
                res.status(400).json({success: false, message: 'Missing item name'});
            }
            const tx = await contractTxs.createGetItemIDTransaction(itemName);
            const itemID = await web3.eth.call(tx);
            const outputs = parsedABI.find((element) => element.name === 'getItemID').outputs;
            const decodedResult = web3.eth.abi.decodeParameters(outputs, itemID);
            dateLog('Item ID:', decodedResult[0]);
            dateLog('Sending back item ID for', req.ip);
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
                    dateLog('Received item request for', itemName, 'from', req.ip);
                    const tx = await contractTxs.createGetItemTransaction(itemName);
                    result = await web3.eth.call(tx);
                    outputs = parsedABI.find((element) => element.name === 'getItem').outputs;
                } else if (itemID) {
                    dateLog('Received item request for ID', itemID, 'from', req.ip);
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
                dateLog('Item:\n', item);
                dateLog('Sending back item for', req.ip);
                res.status(200).json({success: true, message: item})
            } else {
                dateLog('Received items request from', req.ip);
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
                dateLog('Items:\n', items);
                dateLog('Sending back items for', req.ip);
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
                dateLog('Received reviews for domain ID request for', domainID, 'from', req.ip);
                const tx = await contractTxs.createGetReviewsForDomainByIDTransaction(domainID);
                const result = await web3.eth.call(tx);
                const outputs = parsedABI.find((element) => element.name === 'getReviewsForDomainByID').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                let reviews = compileReviews(decodedResult);
                dateLog('Reviews:\n', reviews);
                dateLog('Sending back reviews for domain for', req.ip);
                res.status(200).json({success: true, message: reviews});
            } else if (reviewID) {
                dateLog('Received review request for ID', reviewID, 'from', req.ip);
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
                dateLog('Review:\n', review);
                dateLog('Sending back review for', req.ip);
                res.status(200).json({success: true, message: review});
            } else if (itemName) {
                dateLog('Received reviews for item request for', itemName, 'from', req.ip);
                const tx = await contractTxs.createGetReviewsForItemTransaction(itemName);
                const result = await web3.eth.call(tx);
                const outputs = parsedABI.find((element) => element.name === 'getReviewsForItem').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                let reviews = compileReviews(decodedResult);
                dateLog('Reviews:\n', reviews);
                dateLog('Sending back reviews for item for', req.ip);
                res.status(200).json({success: true, message: reviews});
            } else if (itemID){
                dateLog('Received reviews for item ID request for', itemID, 'from', req.ip);
                const tx = await contractTxs.createGetReviewsForItemByIDTransaction(itemID);
                const result = await web3.eth.call(tx);
                const outputs = parsedABI.find((element) => element.name === 'getReviewsForItemByID').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                let reviews = compileReviews(decodedResult);
                dateLog('Reviews:\n', reviews);
                dateLog('Sending back reviews for item for', req.ip);
                res.status(200).json({success: true, message: reviews});
            } else if (address) {
                dateLog('Received reviews for user request for', address, 'from', req.ip);
                const tx = await contractTxs.createGetUserReviewsTransaction(address);
                const result = await web3.eth.call(tx);
                const outputs = parsedABI.find((element) => element.name === 'getUserReviews').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                let reviews = compileReviews(decodedResult);
                dateLog('Reviews:\n', reviews);
                dateLog('Sending back reviews of user for', req.ip);
                res.status(200).json({success: true, message: reviews});
            } else if (domainName) {
                dateLog('Received reviews for domain request for', domainName, 'from', req.ip);
                const tx = await contractTxs.createGetReviewsForDomainTransaction(domainName);
                const result = await web3.eth.call(tx);
                const outputs = parsedABI.find((element) => element.name === 'getReviewsForDomain').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                let reviews = compileReviews(decodedResult);
                dateLog('Reviews:\n', reviews);
                dateLog('Sending back reviews for domain for', req.ip);
                res.status(200).json({success: true, message: reviews});
            } else {
                dateLog('Received reviews request from', req.ip);
                const tx = await contractTxs.createGetReviewsTransaction();
                const result = await web3.eth.call(tx);
                const outputs = parsedABI.find((element) => element.name === 'getReviews').outputs;
                const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
                const reviews = compileReviews(decodedResult);
                dateLog('Reviews:\n', reviews);
                dateLog('Sending back reviews for', req.ip);
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
            dateLog('Received reviews for item of domain request from', req.ip);
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
                    dateLog('Missing item name or ID');
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
                    dateLog('Missing item name or ID');
                    return res.status(400).json({success: false, message: 'Missing item name or ID'});
                }
            } else {
                dateLog('Missing domain name or ID');
                return res.status(400).json({success: false, message: 'Missing domain name or ID'});
            }
            decodedResult = web3.eth.abi.decodeParameters(outputs, result);
            reviews = compileReviews(decodedResult);
            dateLog('Reviews:\n', reviews);
            dateLog('Sending back reviews for item of domain for', req.ip);
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
                dateLog('Missing initiator');
                return res.status(400).json({success: false, message: 'Missing address'});
            }
            if (!itemName) {
                dateLog('Missing item name');
                return res.status(400).json({success: false, message: 'Missing item name'});
            }
            if (req.body === undefined || req.body.length === 0) {
                dateLog('Missing body');
                return res.status(400).json({success: false, message: 'Missing body'});
            }

            dateLog('Received update item info request for', itemName, 'from', req.ip, 'using address', initiator);
            dateLog('\nAlternate name:', alternateName, '\nDescription:', description, '\nImages:', images);

            // Check if the address is even able to update the item
            dateLog('Checking if', initiator, 'is authorized to update item info');
            const txCheck = await contractTxs.createIsAuthorizedEditorTransaction(initiator);
            const result = await web3.eth.call(txCheck);
            const outputs = parsedABI.find((element) => element.name === 'isAuthorizedEditorAddress').outputs;
            const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
            if (!decodedResult[0]) {
                dateLog('Unauthorized to update item info');
                return res.status(403).json({success: false, message: 'Unauthorized to update item info'});
            }
            dateLog(initiator, 'is authorized to update item info');

            // Check if item even exists
            dateLog('Checking if', itemName, 'exists');
            const txCheckItem = await contractTxs.createGetItemTransaction(itemName);
            const resultItem = await web3.eth.call(txCheckItem);
            const outputsItem = parsedABI.find((element) => element.name === 'getItem').outputs;
            const decodedResultItem = web3.eth.abi.decodeParameters(outputsItem, resultItem);
            if (!decodedResultItem[0]) {
                dateLog('Item does not exist');
                return res.status(404).json({success: false, message: 'Item does not exist'});
            }
            dateLog(itemName, 'exists');
            dateLog('Updating IPFS info for', itemName);
            const data = {
                "Item Name": itemName, "Alternate Name": alternateName, "Description": description, "Images": images
            };
            const ipfsHash = await IPFSInteractor.saveToIPFS(JSON.stringify(data), itemName);
            dateLog('IPFS hash:', ipfsHash);
            dateLog('Sending back IPFS hash update transaction for', initiator);
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
            dateLog('Received item info request for', itemName, 'from', req.ip);
            if (!itemName) {
                dateLog('Missing item name');
                return res.status(400).json({success: false, message: 'Missing item name'});
            }
            dateLog('Fetching item info for', itemName);
            const tx = await contractTxs.createGetInfoIPFSHashOfItemTransaction(itemName);
            const result = await web3.eth.call(tx);
            const outputs = parsedABI.find((element) => element.name === 'getInfoIPFSHashOfItem').outputs;
            const decodedResult = web3.eth.abi.decodeParameters(outputs, result);
            const ipfsHash = decodedResult[0];
            dateLog('Getting item info from IPFS with hash:', ipfsHash)
            const response = await IPFSInteractor.getFromIPFS(ipfsHash);
            dateLog('Item info:\n', response);
            dateLog('Sending back item info for', req.ip);
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