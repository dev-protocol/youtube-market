// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.8.4;

import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {IAddressRegistry} from "@devprotocol/protocol-l2/contracts/interface/IAddressRegistry.sol";
import {IMarketBehavior} from "@devprotocol/protocol-l2/contracts/interface/IMarketBehavior.sol";
import {IMarket} from "@devprotocol/protocol-l2/contracts/interface/IMarket.sol";

abstract contract YoutubeMarketParent is
	IMarketBehavior,
	PausableUpgradeable,
	AccessControlUpgradeable
{
	address public registry;
	address public override associatedMarket;
	bool public priorApproval = true;
	mapping(address => string) internal repositories;
	mapping(bytes32 => address) internal metrics;
	mapping(bytes32 => address) internal properties;
	mapping(bytes32 => address) internal markets;
	mapping(bytes32 => bool) internal pendingAuthentication;
	mapping(string => bool) internal publicSignatures;

	// ROLE
	bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
	bytes32 public constant KHAOS_ROLE = keccak256("KHAOS_ROLE");

	// event
	event Registered(address _metrics, string _repository);
	event Authenticated(string _repository, uint256 _status, string message);
	event Query(
		string githubRepository,
		string publicSignature,
		address account
	);

	function initialize(address _registry) external initializer {
		__AccessControl_init();
		__Pausable_init();
		registry = _registry;
		_setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
		_setRoleAdmin(OPERATOR_ROLE, DEFAULT_ADMIN_ROLE);
		_setupRole(OPERATOR_ROLE, _msgSender());
		_setRoleAdmin(KHAOS_ROLE, DEFAULT_ADMIN_ROLE);
		_setupRole(KHAOS_ROLE, _msgSender());
	}

	function khaosCallback(
		string memory _githubRepository,
		uint256 _status,
		string memory _message
	) external whenNotPaused {
		require(
			hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
				hasRole(KHAOS_ROLE, msg.sender),
			"illegal access"
		);
		require(_status == 0, _message);
		bytes32 key = createKey(_githubRepository);
		require(pendingAuthentication[key], "not while pending");
		emit Authenticated(_githubRepository, _status, _message);
		register(key, _githubRepository, properties[key]);
	}

	function register(
		bytes32 _key,
		string memory _repository,
		address _property
	) internal {
		address _metrics = IMarket(associatedMarket).authenticatedCallback(
			_property,
			_key
		);
		repositories[_metrics] = _repository;
		metrics[_key] = _metrics;
		emit Registered(_metrics, _repository);
	}

	function createKey(string memory _repository)
		internal
		pure
		returns (bytes32)
	{
		return keccak256(abi.encodePacked(_repository));
	}

	function getId(address _metrics)
		external
		view
		override
		returns (string memory)
	{
		return repositories[_metrics];
	}

	function getMetrics(string memory _repository)
		external
		view
		override
		returns (address)
	{
		return metrics[createKey(_repository)];
	}

	function addOperatorRole(address _operator)
		external
		onlyRole(DEFAULT_ADMIN_ROLE)
	{
		_setupRole(OPERATOR_ROLE, _operator);
	}

	function deleteOperatorRole(address _operator)
		external
		onlyRole(DEFAULT_ADMIN_ROLE)
	{
		revokeRole(OPERATOR_ROLE, _operator);
	}

	function addKhaosRole(address _khaos)
		external
		onlyRole(DEFAULT_ADMIN_ROLE)
	{
		_setupRole(KHAOS_ROLE, _khaos);
	}

	function deleteKhaosRole(address _khaos)
		external
		onlyRole(DEFAULT_ADMIN_ROLE)
	{
		revokeRole(KHAOS_ROLE, _khaos);
	}

	function setAssociatedMarket(address _associatedMarket) external override {
		address marketFactory = IAddressRegistry(registry).registries(
			"MarketFactory"
		);
		require(marketFactory == msg.sender, "illegal sender");
		associatedMarket = _associatedMarket;
	}

	function name() external pure override returns (string memory) {
		return "GitHub";
	}

	function schema() external pure override returns (string memory) {
		return
			// solhint-disable-next-line quotes
			'["GitHub Repository (e.g, your/awesome-repos)", "Khaos Public Signature"]';
	}

	function pause() external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused {
		_pause();
	}

	function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) whenPaused {
		_unpause();
	}
}
