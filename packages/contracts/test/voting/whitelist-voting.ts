import {expect} from 'chai';
import {ethers} from 'hardhat';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';

import {WhitelistVoting, DAOMock} from '../../typechain';
import {VoterState, VOTING_EVENTS, pct16} from '../test-utils/voting';
import {customError, ERRORS} from '../test-utils/custom-error-helper';

describe('WhitelistVoting', function () {
  let signers: SignerWithAddress[];
  let voting: WhitelistVoting;
  let daoMock: DAOMock;
  let ownerAddress: string;
  let user1: string;
  let dummyActions: any;

  before(async () => {
    signers = await ethers.getSigners();
    ownerAddress = await signers[0].getAddress();
    user1 = await signers[1].getAddress();

    dummyActions = [
      {
        to: ownerAddress,
        data: '0x00000000',
        value: 0,
      },
    ];

    const DAOMock = await ethers.getContractFactory('DAOMock');
    daoMock = await DAOMock.deploy(ownerAddress);
  });

  beforeEach(async () => {
    const WhitelistVoting = await ethers.getContractFactory('WhitelistVoting');
    voting = await WhitelistVoting.deploy();
  });

  function initializeVoting(
    participationRequired: any,
    supportRequired: any,
    minDuration: any,
    whitelisted: Array<string>
  ) {
    return voting.initialize(
      daoMock.address,
      ethers.constants.AddressZero,
      participationRequired,
      supportRequired,
      minDuration,
      whitelisted
    );
  }

  describe('initialize: ', async () => {
    it('reverts if trying to re-initialize', async () => {
      await initializeVoting(1, 2, 3, []);

      await expect(initializeVoting(1, 2, 3, [])).to.be.revertedWith(
        ERRORS.ALREADY_INITIALIZED
      );
    });
  });

  describe('WhitelistingUsers: ', async () => {
    beforeEach(async () => {
      await initializeVoting(1, 2, 3, []);
    });
    it('should return fasle, if user is not whitelisted', async () => {
      const block1 = await ethers.provider.getBlock('latest');
      await ethers.provider.send('evm_mine', []);
      expect(
        await voting.isUserWhitelisted(ownerAddress, block1.number)
      ).to.equal(false);
    });

    it('should add new users in the whitelist', async () => {
      await voting.addWhitelistedUsers([ownerAddress, user1]);

      const block = await ethers.provider.getBlock('latest');

      await ethers.provider.send('evm_mine', []);

      expect(
        await voting.isUserWhitelisted(ownerAddress, block.number)
      ).to.equal(true);
      expect(await voting.isUserWhitelisted(ownerAddress, 0)).to.equal(true);
      expect(await voting.isUserWhitelisted(user1, 0)).to.equal(true);
    });

    it('should remove users from the whitelist', async () => {
      await voting.addWhitelistedUsers([ownerAddress]);

      const block1 = await ethers.provider.getBlock('latest');
      await ethers.provider.send('evm_mine', []);
      expect(
        await voting.isUserWhitelisted(ownerAddress, block1.number)
      ).to.equal(true);
      expect(await voting.isUserWhitelisted(ownerAddress, 0)).to.equal(true);

      await voting.removeWhitelistedUsers([ownerAddress]);

      const block2 = await ethers.provider.getBlock('latest');
      await ethers.provider.send('evm_mine', []);
      expect(
        await voting.isUserWhitelisted(ownerAddress, block2.number)
      ).to.equal(false);
      expect(await voting.isUserWhitelisted(ownerAddress, 0)).to.equal(false);
    });
  });

  describe('StartVote', async () => {
    let minDuration = 3;

    beforeEach(async () => {
      await initializeVoting(1, 2, 3, [ownerAddress]);
    });

    it('reverts if user is not whitelisted to create a vote', async () => {
      await expect(
        voting
          .connect(signers[1])
          .newVote('0x00', [], 0, 0, false, VoterState.None)
      ).to.be.revertedWith(
        customError('VoteCreationForbidden', signers[1].address)
      );
    });

    it('reverts if vote duration is less than minDuration', async () => {
      const block = await ethers.provider.getBlock('latest');
      const current = block.timestamp;
      const startDate = block.timestamp;
      const endDate = startDate + (minDuration - 1);
      await expect(
        voting.newVote('0x00', [], startDate, endDate, false, VoterState.None)
      ).to.be.revertedWith(
        customError(
          'VoteTimesForbidden',
          current + 1, // TODO hacky
          startDate,
          endDate,
          minDuration
        )
      );
    });

    it('should create a vote successfully, but not vote', async () => {
      const id = 0; // voteId

      expect(
        await voting.newVote('0x00', dummyActions, 0, 0, false, VoterState.None)
      )
        .to.emit(voting, VOTING_EVENTS.VOTE_STARTED)
        .withArgs(0, ownerAddress, '0x00');

      const block = await ethers.provider.getBlock('latest');

      const vote = await voting.getVote(id);
      expect(vote.open).to.equal(true);
      expect(vote.executed).to.equal(false);
      expect(vote.supportRequired).to.equal(2);
      expect(vote.snapshotBlock).to.equal(block.number - 1);
      expect(vote.participationRequired).to.equal(1);
      expect(vote.yea).to.equal(0);
      expect(vote.nay).to.equal(0);

      expect(vote.startDate.add(minDuration)).to.equal(vote.endDate);

      expect(await voting.canVote(id, ownerAddress)).to.equal(true);
      expect(await voting.canVote(id, user1)).to.equal(false);
      expect(await voting.canVote(1, ownerAddress)).to.equal(false);

      expect(vote.actions.length).to.equal(1);
      expect(vote.actions[0].to).to.equal(dummyActions[0].to);
      expect(vote.actions[0].value).to.equal(dummyActions[0].value);
      expect(vote.actions[0].data).to.equal(dummyActions[0].data);
    });

    it('should create a vote and cast a vote immediately', async () => {
      const id = 0; // voteId

      expect(
        await voting.newVote('0x00', dummyActions, 0, 0, false, VoterState.Yea)
      )
        .to.emit(voting, VOTING_EVENTS.VOTE_STARTED)
        .withArgs(id, ownerAddress, '0x00')
        .to.emit(voting, VOTING_EVENTS.VOTE_CAST)
        .withArgs(id, ownerAddress, VoterState.Yea, 1);

      const block = await ethers.provider.getBlock('latest');
      const vote = await voting.getVote(id);
      expect(vote.open).to.equal(true);
      expect(vote.executed).to.equal(false);
      expect(vote.supportRequired).to.equal(2);
      expect(vote.snapshotBlock).to.equal(block.number - 1);
      expect(vote.participationRequired).to.equal(1);

      expect(vote.yea).to.equal(1);
      expect(vote.nay).to.equal(0);
    });
  });

  describe('Vote + Execute:', async () => {
    let minDuration = 500;
    let supportRequired = pct16(29);
    let minimumQuorom = pct16(19);
    const id = 0; // voteId

    beforeEach(async () => {
      const addresses = [];

      for (let i = 0; i < 10; i++) {
        const addr = await signers[i].getAddress();
        addresses.push(addr);
      }

      // voting will be initialized with 10 whitelisted addresses
      // Which means votingPower = 10 at this point.
      await initializeVoting(
        minimumQuorom,
        supportRequired,
        minDuration,
        addresses
      );

      await voting.newVote('0x00', dummyActions, 0, 0, false, VoterState.None);
    });

    // VoterState.Yea
    it('increases the yea or nay count and emit correct events', async () => {
      expect(await voting.vote(id, VoterState.Yea, false))
        .to.emit(voting, VOTING_EVENTS.VOTE_CAST)
        .withArgs(id, ownerAddress, VoterState.Yea, 1);

      let vote = await voting.getVote(id);
      expect(vote.yea).to.equal(1);

      expect(await voting.vote(id, VoterState.Nay, false))
        .to.emit(voting, VOTING_EVENTS.VOTE_CAST)
        .withArgs(id, ownerAddress, VoterState.Nay, 1);

      vote = await voting.getVote(id);
      expect(vote.nay).to.equal(1);

      expect(await voting.vote(id, VoterState.Abstain, false))
        .to.emit(voting, VOTING_EVENTS.VOTE_CAST)
        .withArgs(id, ownerAddress, VoterState.Abstain, 1);

      vote = await voting.getVote(id);
      expect(vote.abstain).to.equal(1);
    });

    it('voting multiple times should not increase yea or nay multiple times', async () => {
      // yea still ends up to be 1 here even after voting
      // 2 times from the same wallet.
      await voting.vote(id, VoterState.Yea, false);
      await voting.vote(id, VoterState.Yea, false);
      expect((await voting.getVote(0)).yea).to.equal(1);

      // yea gets removed, nay ends up as 1.
      await voting.vote(id, VoterState.Nay, false);
      await voting.vote(id, VoterState.Nay, false);
      expect((await voting.getVote(0)).nay).to.equal(1);

      await voting.vote(id, VoterState.Abstain, false);
      await voting.vote(id, VoterState.Abstain, false);
      expect((await voting.getVote(0)).abstain).to.equal(1);
    });

    it('makes executable if enough yea is given from on voting power', async () => {
      // Since voting power is set to 29%, and
      // whitelised is 10 addresses, voting yea
      // from 3 addresses should be enough to
      // make vote executable
      await voting.vote(id, VoterState.Yea, false);
      await voting.connect(signers[1]).vote(id, VoterState.Yea, false);

      // // only 2 voted, not enough for 30%
      expect(await voting.canExecute(id)).to.equal(false);
      // // 3rd votes, enough.
      await voting.connect(signers[2]).vote(id, VoterState.Yea, false);

      expect(await voting.canExecute(id)).to.equal(true);
    });

    it('makes executable if enough yea is given depending on yea + nay total', async () => {
      // 2 supports
      await voting.connect(signers[0]).vote(id, VoterState.Yea, false);
      await voting.connect(signers[1]).vote(id, VoterState.Yea, false);

      // 2 not supports
      await voting.connect(signers[2]).vote(id, VoterState.Nay, false);
      await voting.connect(signers[3]).vote(id, VoterState.Nay, false);

      // 2 abstain
      await voting.connect(signers[4]).vote(id, VoterState.Abstain, false);
      await voting.connect(signers[5]).vote(id, VoterState.Abstain, false);

      expect(await voting.canExecute(id)).to.equal(false);

      // makes the voting closed.
      await ethers.provider.send('evm_increaseTime', [minDuration + 10]);
      await ethers.provider.send('evm_mine', []);

      // 2 voted yea, 2 voted yea. 2 voted abstain.
      // Enough to surpass supportedRequired percentage
      expect(await voting.canExecute(id)).to.equal(true);
    });

    it('executes the vote immediately while final yea is given', async () => {
      // 2 votes in favor of yea
      await voting.connect(signers[0]).vote(id, VoterState.Yea, false);
      await voting.connect(signers[1]).vote(id, VoterState.Yea, false);

      // 3th supports(which is enough) and should execute right away.
      let tx = await voting.connect(signers[3]).vote(id, VoterState.Yea, true);
      let rc = await tx.wait();

      // check for the `Executed` event in the DAO
      {
        let {actor, callId, actions, execResults} = daoMock.interface.parseLog(
          rc.logs[1]
        ).args;

        expect(actor).to.equal(voting.address);
        expect(callId).to.equal(id);
        expect(actions.length).to.equal(1);
        expect(actions[0].to).to.equal(dummyActions[0].to);
        expect(actions[0].value).to.equal(dummyActions[0].value);
        expect(actions[0].data).to.equal(dummyActions[0].data);
        expect(execResults).to.deep.equal([]);

        const vote = await voting.getVote(id);

        expect(vote.executed).to.equal(true);
      }

      // check for the `VoteExecuted` event in the voting contract
      {
        const {voteId, execResults} = voting.interface.parseLog(
          rc.logs[2]
        ).args;
        expect(voteId).to.equal(id);
        expect(execResults).to.deep.equal([]);
      }

      // calling execute again should fail
      await expect(voting.execute(id)).to.be.revertedWith(
        customError('VoteExecutionForbidden', id)
      );
    });

    it('reverts if vote is executed while enough yea is not given ', async () => {
      await expect(voting.execute(id)).to.be.revertedWith(
        customError('VoteExecutionForbidden', id)
      );
    });
  });
});
