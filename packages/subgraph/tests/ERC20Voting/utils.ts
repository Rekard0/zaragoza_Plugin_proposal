import {Address, BigInt, Bytes, ethereum} from '@graphprotocol/graph-ts';
import {createMockedFunction, newMockEvent} from 'matchstick-as';

import {
  VoteStarted,
  VoteCast,
  VoteExecuted,
  ConfigUpdated,
  TrustedForwarderSet
} from '../../generated/templates/ERC20Voting/ERC20Voting';

// events

export function createNewTrustedForwarderSetEvent(
  forwarderAddress: string,
  contractAddress: string
): TrustedForwarderSet {
  let newTrustedForwarderSetEvent = changetype<TrustedForwarderSet>(
    newMockEvent()
  );

  newTrustedForwarderSetEvent.address = Address.fromString(contractAddress);
  newTrustedForwarderSetEvent.parameters = [];

  let forwarderAddressParam = new ethereum.EventParam(
    'forwarder',
    ethereum.Value.fromAddress(Address.fromString(forwarderAddress))
  );

  newTrustedForwarderSetEvent.parameters.push(forwarderAddressParam);

  return newTrustedForwarderSetEvent;
}

export function createNewVoteStartedEvent(
  voteId: string,
  creator: string,
  description: string,
  contractAddress: string
): VoteStarted {
  let newVoteStartedEvent = changetype<VoteStarted>(newMockEvent());

  newVoteStartedEvent.address = Address.fromString(contractAddress);
  newVoteStartedEvent.parameters = [];

  let voteIdParam = new ethereum.EventParam(
    'voteId',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(voteId))
  );
  let creatorParam = new ethereum.EventParam(
    'creator',
    ethereum.Value.fromAddress(Address.fromString(creator))
  );
  let descriptionParam = new ethereum.EventParam(
    'description',
    ethereum.Value.fromBytes(Bytes.fromUTF8(description))
  );

  newVoteStartedEvent.parameters.push(voteIdParam);
  newVoteStartedEvent.parameters.push(creatorParam);
  newVoteStartedEvent.parameters.push(descriptionParam);

  return newVoteStartedEvent;
}

export function createNewVoteCastEvent(
  voteId: string,
  voter: string,
  voterState: string,
  voterWeight: string,
  contractAddress: string
): VoteCast {
  let newVoteCastEvent = changetype<VoteCast>(newMockEvent());

  newVoteCastEvent.address = Address.fromString(contractAddress);
  newVoteCastEvent.parameters = [];

  let voteIdParam = new ethereum.EventParam(
    'voteId',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(voteId))
  );
  let voterParam = new ethereum.EventParam(
    'voter',
    ethereum.Value.fromAddress(Address.fromString(voter))
  );
  let voterStateParam = new ethereum.EventParam(
    'voterState',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(voterState))
  );
  let stakeParam = new ethereum.EventParam(
    'voterWeight',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(voterWeight))
  );

  newVoteCastEvent.parameters.push(voteIdParam);
  newVoteCastEvent.parameters.push(voterParam);
  newVoteCastEvent.parameters.push(voterStateParam);
  newVoteCastEvent.parameters.push(stakeParam);

  return newVoteCastEvent;
}

export function createNewVoteExecutedEvent(
  voteId: string,
  contractAddress: string
): VoteExecuted {
  let newVoteExecutedEvent = changetype<VoteExecuted>(newMockEvent());

  newVoteExecutedEvent.address = Address.fromString(contractAddress);
  newVoteExecutedEvent.parameters = [];

  let voteIdParam = new ethereum.EventParam(
    'voteId',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(voteId))
  );
  let execResultsParam = new ethereum.EventParam(
    'execResults',
    ethereum.Value.fromBytesArray([Bytes.fromUTF8('')])
  );

  newVoteExecutedEvent.parameters.push(voteIdParam);
  newVoteExecutedEvent.parameters.push(execResultsParam);

  return newVoteExecutedEvent;
}

export function createNewConfigUpdatedEvent(
  supportRequiredPct: string,
  participationRequiredPct: string,
  minDuration: string,
  contractAddress: string
): ConfigUpdated {
  let newConfigUpdatedEvent = changetype<ConfigUpdated>(newMockEvent());

  newConfigUpdatedEvent.address = Address.fromString(contractAddress);
  newConfigUpdatedEvent.parameters = [];

  let participationRequiredPctParam = new ethereum.EventParam(
    'participationRequiredPct',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(participationRequiredPct))
  );
  let supportRequiredPctParam = new ethereum.EventParam(
    'supportRequiredPct',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(supportRequiredPct))
  );
  let minDurationParam = new ethereum.EventParam(
    'minDuration',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(minDuration))
  );

  newConfigUpdatedEvent.parameters.push(participationRequiredPctParam);
  newConfigUpdatedEvent.parameters.push(supportRequiredPctParam);
  newConfigUpdatedEvent.parameters.push(minDurationParam);

  return newConfigUpdatedEvent;
}

// calls

export function getVotesLengthCall(
  contractAddress: string,
  returns: string
): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'votesLength',
    'votesLength():(uint256)'
  )
    .withArgs([])
    .returns([ethereum.Value.fromSignedBigInt(BigInt.fromString(returns))]);
}
