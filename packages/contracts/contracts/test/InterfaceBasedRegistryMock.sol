// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "../registry/InterfaceBasedRegistry.sol";

contract InterfaceBasedRegistryMock is InterfaceBasedRegistry {
    bytes32 public constant REGISTER_ROLE = keccak256("REGISTER_ROLE");

    event Registered(address);

    function initialize(IDAO _dao) external initializer {
        __InterfaceBasedRegistry_init(_dao, type(IDAO).interfaceId);
    }

    function register(address registrant) external auth(REGISTER_ROLE) {
        _register(registrant);

        emit Registered(registrant);
    }
}
