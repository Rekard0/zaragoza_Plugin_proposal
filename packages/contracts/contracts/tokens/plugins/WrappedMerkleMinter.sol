// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";

import "../../plugin/aragonPlugin/AragonApp.sol";
import "../MerkleMinter.sol";
import "../MerkleDistributor.sol";

contract WrappedMerkleMinter is AragonApp, MerkleMinter {
    function initialize(
        address _trustedForwarder,
        IDAO.DAOsPlugin memory _tokenPlugin,
        uint256 _pluginCount
    ) external initializer {
        // get dao from the dao slot
        IDAO dao = dao();

        // get dependecy from dao's installed plugins
        address _token = dao.getPluginAddress(
            keccak256(abi.encodePacked(_tokenPlugin.node, _tokenPlugin.semanticVersion)),
            _pluginCount
        );

        token = _token;
        distributorBase = new MerkleDistributor(); // example of utility

        __MerkleMinter_init(
            dao,
            _trustedForwarder,
            IERC20MintableUpgradeable(_token),
            MerkleDistributor(distributorBase)
        );
    }
}
