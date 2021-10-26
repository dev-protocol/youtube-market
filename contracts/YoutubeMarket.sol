// SPDX-License-Identifier: MPL-2.0
pragma solidity 0.8.4;

import "./YoutubeMarketParent.sol";

abstract contract YoutubeMarket is YoutubeMarketParent {

	function authenticate(
		address _prop,
		string memory _githubRepository,
		string memory _publicSignature,
		string memory,
		string memory,
		string memory,
		address _dest,
		address account
	) external whenNotPaused returns (bool) {
		require(
			msg.sender == address(0) || msg.sender == associatedMarket,
			"Invalid sender"
		);

		if (priorApproval) {
			require(
				publicSignatures[_publicSignature],
				"it has not been approved"
			);
		}
		bytes32 key = createKey(_githubRepository);
		emit Query(_githubRepository, _publicSignature, account);
		properties[key] = _prop;
		markets[key] = _dest;
		pendingAuthentication[key] = true;
		return true;
	}

}