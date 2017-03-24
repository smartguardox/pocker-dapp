/**
 * Created by helge on 02.02.17.
 */

import { PokerHelper, ReceiptCache } from 'poker-helper';
import { createSelector } from 'reselect';
import { makeHandSelector } from '../Table/selectors';

const rc = new ReceiptCache();
const pokerHelper = new PokerHelper(rc);

const posSelector = (state, props) => (state && props) ? props.pos : null;

const makeLastReceiptSelector = () => createSelector(
    [makeHandSelector(), posSelector],
    (hand, pos) => (hand && pos && hand.getIn && hand.getIn(['lineup', pos])) ? rc.get(hand.getIn(['lineup', pos, 'last'])) : undefined
);

const makeLastAmountSelector = () => createSelector(
    makeLastReceiptSelector(),
    (lastReceipt) => (lastReceipt && lastReceipt.values) ? lastReceipt.values[1] : 0
);

const makeWhosTurnSelector = () => createSelector(
  makeHandSelector(),
  (hand) => (hand && hand.toJS) ? pokerHelper.whosTurn(hand.toJS()) : null
);

const makeLastActionSelector = () => createSelector(
  [posSelector, makeHandSelector()],
  (pos, hand) => {
    if (hand && hand.getIn && hand.getIn(['lineup', pos, 'last'])) {
      return rc.get(hand.getIn(['lineup', pos, 'last'])).abi[0].name;
    }
    return null;
  }
);

const makeCardsSelector = () => createSelector(
  [posSelector, makeHandSelector()],
  (pos, hand) => {
    if (!pos || !hand) {
      return [-1, -1];
    }
    return hand.get('lineup').toJS()[pos].cards;
  }
);

const makeMyCardsSelector = () => createSelector(
    [makeHandSelector()],
    (hand) => (hand && hand.get('holeCards')) ? hand.get('holeCards').toJS() : [-1, -1]
);

const makeFoldedSelector = () => createSelector(
    makeLastReceiptSelector(),
    (lastReceipt) => (lastReceipt && lastReceipt.abi) ? lastReceipt.abi[0].name === 'fold' : false
);

export {
    posSelector,
    makeLastReceiptSelector,
    makeLastAmountSelector,
    makeCardsSelector,
    makeMyCardsSelector,
    makeFoldedSelector,
    makeWhosTurnSelector,
    makeLastActionSelector,
};
