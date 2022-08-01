/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.8.10;

import "@ensdomains/ens-contracts/contracts/registry/ENS.sol";
import "@ensdomains/ens-contracts/contracts/resolvers/Resolver.sol";

import "../core/DAO.sol";
import "../plugin/PluginRepo.sol";
import "../utils/UncheckedIncrement.sol";
import "./aragonPlugin/PluginUUPSProxy.sol";
import "./IPluginFactory.sol";
import "../plugin/aragonPlugin/AragonApp.sol";

/// @title PluginInstaller to install plugins on a DAO.
/// @author Aragon Association - 2022
/// @notice This contract is used to create/deploy new plugins and instaling them on a DAO.
contract PluginInstaller {
    address public daoFactory;
    ENS public ens;

    struct PluginConfig {
        DAO.DAOsPlugin daoPlugin;
        uint256[] pluginDepCount;
        bytes initCallData;
    }

    error NoRootRole();
    error CallerNotAllowed();

    modifier onlyAllowedCaller(DAO dao) {
        if (msg.sender != address(dao) || msg.sender != daoFactory) {
            revert CallerNotAllowed();
        }
        _;
    }

    constructor(address _daoFactory) {
        daoFactory = _daoFactory;
    }

    function installPlugins(DAO dao, PluginConfig[] calldata pluginConfigs)
        external
        onlyAllowedCaller(dao)
    {
        for (uint256 i; i < pluginConfigs.length; i = _uncheckedIncrement(i)) {
            _installPlugin(dao, pluginConfigs[i]);
        }
    }

    function _installPlugin(DAO dao, PluginConfig calldata pluginConfig)
        internal
        returns (address pluginAddress)
    {
        // prepare repo
        bytes32 node = pluginConfig.daoPlugin.node;
        Resolver resolver = Resolver(ens.resolver(node));
        PluginRepo repo = PluginRepo(resolver.addr(node));

        // get permissions and implementationAddress
        (, PluginRepo.Permission[] permissions, , address implementationAddress, , ) = repo
            .getBySemanticVersion(pluginConfig.daoPlugin.semanticVersion);

        // deploy plugin
        address pluginAddress = payable(
            address(
                new PluginUUPSProxy(address(dao), implementationAddress, pluginConfig.initCallData)
            )
        );

        // handle permissions
        ACLData.BulkItem[] memory permissionItems = new ACLData.BulkItem[](permissions.length);

        for (uint256 i = 0; i < permissions.length; i++) {
            // re-construct permissions
            PluginRepo.Dependency memory fromDep = permissions[i].from;
            PluginRepo.Dependency memory toDep = permissions[i].to;
            bytes role = keccak256(permissions[i].role);

            // get address of deps from dao
            address fromAddress = convertDepToAddress(
                address(dao),
                fromDep.id,
                fromDep.version,
                pluginConfig.pluginCount[i]
            );

            address toAddress = convertDepToAddress(
                address(dao),
                toDep.id,
                toDep.version,
                pluginConfig.pluginCount[i]
            );

            // prepare permissions
            permissionItems[i] = ACLData.BulkItem(
                ACLData.BulkOp.Grant,
                fromAddress,
                toAddress,
                role
            );
        }

        // call to set permission
        dao.bulk(permissionItems);

        // register plugin as installed on the DAO
        dao.setPlugin(pluginConfig.daoPlugin, pluginAddress);
    }

    function convertDepToAddress(
        address _dao,
        string _id,
        uint16[3] _version,
        uint256 _count
    ) internal returns (address addr) {
        uint16[3] memory zeroZersion;
        version[0] = 0;
        version[1] = 0;
        version[2] = 0;

        if (_id == "" && _version == zeroZersion) {
            addr = _dao;
            return;
        }
        addr = dao.getPluginAddress(
            keccak256(abi.encodePacked(keccak256(fromDep.id), fromDep.version)),
            pluginConfig.pluginCount
        );
    }
}
