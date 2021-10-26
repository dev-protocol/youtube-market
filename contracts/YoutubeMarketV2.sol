// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.8.4;

import "./YoutubeMarketParent.sol";

contract YoutubeMarketV2 is YoutubeMarketParent {
	/*
    _githubRepository: ex)
                        personal repository: Akira-Taniguchi/cloud_lib
                        organization repository: dev-protocol/protocol
    _publicSignature: signature string(created by Khaos)
    */
	function authenticate(
		address _prop,
		string[] memory _args,
		address account
	) external override whenNotPaused returns (bool) {
		require(msg.sender == associatedMarket, "invalid sender");
		require(_args.length == 2, "args error");
		string memory githubRepository = _args[0];
		string memory publicSignature = _args[1];
		bytes32 key = createKey(githubRepository);
		emit Query(githubRepository, publicSignature, account);
		properties[key] = _prop;
		pendingAuthentication[key] = true;
		return true;
	}
}