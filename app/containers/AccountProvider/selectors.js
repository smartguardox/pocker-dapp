import EthUtil from 'ethereumjs-util';
import md5 from 'blueimp-md5';
import { createSelector } from 'reselect';

import { ABI_TOKEN_CONTRACT, tokenContractAddress } from '../../app.config';

/**
 * Direct selector to the accountProvider state domain
 */
const selectAccount = (state) => state.get('account');

const selectPrivKey = (state, props) => props.location.query.privKey;

/**
 * Other specific selectors
 */
const makeSelectAccountData = () => createSelector(
  selectAccount,
  (account) => account.toJS()
);

const makeAddressSelector = () => createSelector(
  selectPrivKey,
  (privKey) => {
    if (privKey) {
      const privKeyBuffer = new Buffer(privKey.replace('0x', ''), 'hex');
      return `0x${EthUtil.privateToAddress(privKeyBuffer).toString('hex')}`;
    }
    return null;
  }
);

const makeSelectEmail = () => createSelector(
  selectAccount,
  (account) => account.get('email')
);

const makeSelectGravatar = (size) => createSelector(
  selectAccount,
  (account) => {
    if (!account.get('email')) {
      return null;
    }
    const picSize = size || 80;
    const hash = md5(account.get('email'));
    return `http://www.gravatar.com/avatar/${hash}.jpg?s=${picSize}`;
  }
);

const makeSelectContract = () => createSelector(
  selectAccount,
  () => {
    if (typeof window.web3 !== 'undefined') {
      const contract = window.web3.eth.contract(ABI_TOKEN_CONTRACT).at(tokenContractAddress);
      return contract;
    }
    return null;
  }
);

const makeSelectPrivKey = () => createSelector(
  selectAccount,
  (account) => account.get('privKey')
);


/**
 * Default selector used by AccountProvider
 */
export default makeSelectAccountData;
export {
  selectAccount,
  makeAddressSelector,
  makeSelectContract,
  makeSelectPrivKey,
  makeSelectEmail,
  makeSelectGravatar,
};
