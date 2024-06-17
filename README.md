# WEB3 Decentralized Reviews

<font color="#A10B0B">MAKE SURE YOU HAVE A .ENV FILE IN ROOT DIRECTORY OF PROJECT</font>

## Dealing with contracts

<b>Environment Variables For Contract</b>
> <b>WEB3_ENDPOINT</b> - endpoint of web3 provider<br>
> <b>ETHEREUM_NETWORK</b> - name of network to deploy contract<br>
> <b>CONTRACT_OWNER</b> - wallet address of contract owner<br>
> <b>CONTRACT_OWNER_PRIVATE_KEY</b> - private key of contract owner<br>
> <b>CONTRACT_ADDRESS</b> - address of deployed contract<br>
> <b>CONTRACT_ABI</b> - ABI of deployed contract<br>
>
>> IF USING INFURA:<br>
> <b>INFURA_API_KEY</b> - Infura API key<br>

<b>Compile</b>
> - <strong>Contract should be in /contracts</strong><br>
> - Run contract_compile_script with name of contract<br>
>> node .\contract_deployment_script.js TestContract<br>

<b>Deploy</b>
> - <strong>Compiled contract JSON should be in /contracts</strong><br>
> - Run contract_deployment_script with name of contract<br>
>> node .\contract_deployment_script.js TestContract<br>

## Dealing with IPFS

<b>Environment Variables For IPFS</b>
> <b>IPFS_MODE</b> - LOCAL or INFURA<br>
>
>> IF USING INFURA:<br>
> <b>INFURA_API_KEY</b> - Infura API key<br>
> <b>INFURA_API_SECRET</b> - Infura API secret<br>

Local IPFS uses the default settings of the IPFS desktop app. Make sure the daemon is running before running the server on IPFS
Local mode.

## Server Endpoints

ALL ENDPOINTS RETURN MESSAGES IN THE RESPONSE JSON USING THIS FORMAT:
```
{
    success, - was the request successful
    message - error or requested message
}
```

Going forward, RESPONSE will show the expected response in the message portion of the returned JSON.

Registration related files will be located in the /reg directory of the project.

Logs will be located in the /logs directory of the project.

> <b>GET</b> /ping - Check if server is running<br>
> 
> <b>RESPONSE</b><br>
> ```
> PONG
> ```

> <b>POST</b> /authorizedEditors/add?initiator=<b>{address1}</b>&address=<b>{address2}</b> - Add an authorized editor
> 
> <b>RESPONSE</b><br>
> 
> ```
> RETURNS A TRANSACTION
> ```

> <b>DELETE</b> /authorizedEditors/<b>{address2}</b>/remove?initiator=<b>{address1}</b> - Remove an authorized editor
> 
> <b>RESPONSE</b><br>
> 
> ```
> RETURNS A TRANSACTION
> ```

> <b>GET</b> /authorizedEditors/<b>{optionalAddress}</b> - Get the list of authorized editors or check if an address is an authorized editor
>
> <b>RESPONSE</b><br>
> ```
> [address1, address2, ...] FOR LIST OF EDITORS
> 
> TRUE OR FALSE FOR CHECKING IF AN ADDRESS IS AN AUTHORIZED EDITOR
> ```

> <b>PUT</b> /items/<b>{itemName}</b>/ipfs/update?initiator=<b>{address}</b>&ipfsHash=<b>{ipfsHash}</b> - Update the IPFS hash of an item
>
> <b>RESPONSE</b><br>
> ```
> RETURNS A TRANSACTION
> ```

> <b>GET</b> /items/<b>{itemName}</b>/ipfs - Get the IPFS hash of an item
>
> <b>RESPONSE</b><br>
> ```
> IPFS HASH
> ```

> <b>PUT</b> /items/<b>{itemName}</b>/info/update?initiator=<b>{address}</b> - Update the information of an item
>
> <b>RESPONSE</b><br>
> ```
> RETURNS A TRANSACTION
> ```

> <b>GET</b> /items/<b>{itemName}</b>/info?useMapping=<b>{trueFalse}</b> - Get the information of an item, with or without registration mapping
>
> <b>RESPONSE</b><br>
> ```
> {
>    "Item Name": string, 
>    "Alternate Name": string, 
>    "Description": string, 
>    "Images": array of encoded images
> };
> ```

> <b>GET</b> /items/<b>{optionalItemName}</b> - Get the list of items or the information of a specific item
>
> <b>RESPONSE</b><br>
> ```
> IF ITEM NAME PROVIDED:
> {
>     id: Number,
>     name: string,
>     infoIPFSHash: string,
>     availableOnDomainNames: array of strings,
>     rating: string (float)
> }
> 
> IF ITEM NAME NOT PROVIDED:
>  RETURNS ARRAY OF ABOVE OBJECTS
> ```
> IF

> <b>GET</b> /items/id/<b>{optionalItemId}</b> - Get the information of an item by its ID
>
> <b>RESPONSE</b><br>
> ```
> IF ID PROVIDED:
> {
>     id: Number,
>     name: string,
>     infoIPFSHash: string,
>     availableOnDomainNames: array of strings,
>     rating: string (float)
> }
> 
> IF ID NOT PROVIDED:
> RETURNS ARRAY OF ABOVE OBJECTS
> ```

> <b>GET</b> /items/<b>{itemName}</b>/id - Get the ID of an item
>
> <b>RESPONSE</b><br>
> ```
> ID OF THE ITEM
> ```

> <b>GET</b> /items/<b>{itemName}</b>/domains - Get the domains of an item
>
> <b>RESPONSE</b><br>
> ```
> [domain1, domain2, ...]
> ```

> <b>POST</b> /items/add?itemName=<b>{itemName}</b>&initiator=<b>{address}</b> - Add an item
> 
> <b>RESPONSE</b><br>
> ```
> RETURNS A TRANSACTION
> ```

> <b>GET</b> /domains/<b>{optionalDomainName}</b> - Get the list of domains or the information of a specific domain
>
> <b>RESPONSE</b><br>
> ```
> IF DOMAIN NAME PROVIDED:
> {
>    id: Number,
>    name: string,
>    itemName: array of strings
> }
> 
> IF DOMAIN NAME NOT PROVIDED:
> RETURNS ARRAY OF ABOVE OBJECTS
> ```

> <b>GET</b> /domains/id?domainID=<b>{optionalID}</b> - Get domain by ID
>
> <b>RESPONSE</b><br>
> ```
> IF ID PROVIDED:
> {
>    id: Number,
>    name: string,
>    itemName: array of strings
> }
> 
> IF ID NOT PROVIDED:
> RETURNS ARRAY OF ABOVE OBJECTS
> ```

> <b>GET</b> /domains/<b>{domainName}</b>/id - Get the ID of a domain
>
> <b>RESPONSE</b><br>
> ```
> ID OF THE DOMAIN
> ```

> <b>POST</b> /reviews/<b>{itemName}</b>/add?initiator=<b>{address}</b> - Add a review to an item
>
> <b>RESPONSE</b><br>
> ```
> RETURNS A TRANSACTION
> ```

> <b>GET</b> /reviews/<b>{optionalItemName}</b> - Get the reviews of an item or the list of all reviews
>
> <b>RESPONSE</b><br>
> ```
> IF ITEM NAME PROVIDED:
> {
>   id: number,
>   reviewer: string,
>   itemName: string,
>   domainName: string,
>   comment: string,
>   rating: number
> }
> 
> IF ITEM NAME NOT PROVIDED:
> RETURNS ARRAY OF ABOVE OBJECTS
> ```

> <b>GET</b> /reviews/id/<b>{optionalReviewID}</b> - Get a review by its ID or the list of all reviews
>
> <b>RESPONSE</b><br>
> ```
> IF ID PROVIDED:
> {
>   id: number,
>   reviewer: string,
>   itemName: string,
>   domainName: string,
>   comment: string,
>   rating: number
> }
> 
> IF ID NOT PROVIDED:
> RETURNS ARRAY OF ABOVE OBJECTS
> ```

> <b>GET</b> /reviews/user/<b>{address}</b> - Get the reviews made by a user
>
> <b>RESPONSE</b><br>
> ```
> [ {
>   id: number,
>   reviewer: string,
>   itemName: string,
>   domainName: string,
>   comment: string,
>   rating: number
> }, ... ] - ARRAY OF REVIEWS
> ```

> <b>GET</b> /reviews/domains/<b>{domainName}</b> - Get the reviews of a domain
>
> <b>RESPONSE</b><br>
> ```
> [ {
>   id: number,
>   reviewer: string,
>   itemName: string,
>   domainName: string,
>   comment: string,
>   rating: number
> }, ... ] - ARRAY OF REVIEWS
> ```

> <b>GET</b> /reviews/domains/<b>{domainName}</b>/items/<b>{itemName}</b> - Get the reviews of an item in a domain
>
> <b>RESPONSE</b><br>
> ```
> [{
>   id: number,
>   reviewer: string,
>   itemName: string,
>   domainName: string,
>   comment: string,
>   rating: number
> }, ...] - ARRAY OF REVIEWS
> ```

> <b>GET</b> /reviews/domains/id/<b>{domainID}</b>/items/id/<b>{itemID}</b> - Get the reviews of an item in a domain by domain ID and item ID
>
> <b>RESPONSE</b><br>
> ```
> [{
>   id: number,
>   reviewer: string,
>   itemName: string,
>   domainName: string,
>   comment: string,
>   rating: number
> }, ...] - ARRAY OF REVIEWS
> ``` 

> <b>POST</b> /registrations/register?itemName=<b>{itemName}</b> - Put item into queue for registration for domain
> 
> <b>RESPONSE</b><br>
> ```
> STATUS ON REGISTRATION REQUEST
> ```

> <b>DELETE</b> /registrations/queue/remove?initiator=<b>{address}</b>&proposedItemName=<b>{itemName}</b>&domain=<b>{domainName}</b> - Remove item from queue for registration for domain
> 
> <b>RESPONSE</b><br>
> ```
> STATUS ON REMOVAL REQUEST
> ```

> <b>GET</b> /registrations/<b>{itemName}</b> - Check if item is registered for domain
> 
> <b>RESPONSE</b><br>
> ```
> IF REGISTERED:
> 
> ASSIGNED ITEM NAME
> 
> IF NOT REGISTERED:
> 
> "Item not registered for domain"

> <b>POST</b> /registrations/mapping?initiator=<b>{address}</b>&proposedItemName=<b>{itemName}</b>&domain=<b>{domainName}</b>&itemName=<b>{itemName}</b> - Map proposed item name to actual item name
> 
> <b>RESPONSE</b><br>
> ```
> STATUS ON MAPPING REQUEST
> ```