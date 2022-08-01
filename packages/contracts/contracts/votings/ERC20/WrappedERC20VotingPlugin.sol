// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";

import "../../plugin/aragonPlugin/AragonApp.sol";
import "./ERC20Voting.sol";

contract WrappedERC20VotingPlugin is AragonApp, ERC20Voting {
    function initialize(
        address _gsnForwarder,
        uint64 _participationRequiredPct,
        uint64 _supportRequiredPct,
        uint64 _minDuration,
        IDAO.DAOsPlugin memory _tokenPlugin,
        uint256 _pluginCount
    ) public initializer {
        // get dao from the DAO slot
        IDAO dao = dao();

        // get dependecy from dao's installed plugins
        address _token = dao.getPluginAddress(
            keccak256(abi.encodePacked(_tokenPlugin.node, _tokenPlugin.semanticVersion)),
            _pluginCount
        );

        __ERC20Voting_init(
            dao,
            _gsnForwarder,
            _participationRequiredPct,
            _supportRequiredPct,
            _minDuration,
            ERC20VotesUpgradeable(_token)
        );
    }

    function changeVoteConfig(
        uint64 _participationRequiredPct,
        uint64 _supportRequiredPct,
        uint64 _minDuration
    ) external auth(MODIFY_VOTE_CONFIG) {
        super.changeVoteConfig(_participationRequiredPct, _supportRequiredPct, _minDuration);
    }

    function execute(uint256 _voteId) public {
        super.execute(dao(), _voteId);
    }
}
