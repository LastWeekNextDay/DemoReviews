var TestContract = artifacts.require("TestContract");

module.exports = function(deployer) {
    deployer.deploy(TestContract);
};