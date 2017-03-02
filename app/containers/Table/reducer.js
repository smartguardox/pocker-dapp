/**
 * Created by helge on 20.09.16.
 */
import _ from 'lodash';
import { Map } from 'immutable';
import EWT from 'ethereum-web-token';
import EthUtil from 'ethereumjs-util';
import { PokerHelper, ReceiptCache } from 'poker-helper';
import * as TableActions from './actions';


const rc = new ReceiptCache();
const pokerHelper = new PokerHelper(rc);

// The initial application state
export const initialState = Map({
  hand: {
    cards: [],
    dealer: null,
    distribution: '',
    handId: 0,
    lineup: [],
    state: '',
  },
  modalStack: [],
  complete: false,
});


function getMyAddress(privKey) {
  const privKeyBuffer = new Buffer(privKey.replace('0x', ''), 'hex');
  return `0x${EthUtil.privateToAddress(privKeyBuffer).toString('hex')}`;
}


export default function tableReducer(state = initialState, action) {
  const update = {};
  let myPos;
  switch (action.type) {
    case TableActions.LINEUP_RECEIVED: {
      let newLineup = [];
      const currentLineup = state.getIn(['hand', 'lineup']);
      for (let i = 0; i < action.lineup[1].length; i += 1) {
        const temp = {
          address: action.lineup[1][i],
          amount: action.lineup[2][i].toNumber(),
        };
        newLineup.push(temp);
      }

      if (currentLineup) {
        newLineup = _.merge(currentLineup, newLineup);
      }

      const newHand = state.get('hand');
      newHand.lineup = newLineup;
      return state
        .set('lastHandNettedOnClient', action.lineup[0].toNumber())
        .set('tableAddr', action.tableAddr)
        .set('hand', newHand);
    }

    case TableActions.SMALL_BLIND_RECEIVED: {
      return state
        .set('smallBlind', action.sb);
    }

    case TableActions.TABLE_JOINED: {
      return state;
    }

    case TableActions.SET_CARDS: {
      const newHand = _.clone(state.get('hand'));

      if (action.cards) {
        newHand.lineup[action.pos].cards = action.cards;
      }
      return state
        .set('hand', newHand);
    }

    case TableActions.UPDATE_AMOUNT: {
      return state.set('amount', action.amount);
    }

    case TableActions.COMPLETE_HAND_QUERY: {
      const newHand = _.clone(state.get('hand'));
      action.hand.lineup.forEach((player) => {
        const lastReceipt = rc.get(player.last);
        for (let i = 0; i < newHand.lineup.length; i += 1) {
          if (newHand.lineup[i].address === lastReceipt.signer) {
            newHand.lineup[i].amount -= lastReceipt.values[1];
          }
        }
      });
      const dists = rc.get(action.hand.distribution);
      for (let j = 0; j < dists.values[2].length; j += 1) {
        const dist = EWT.separate(dists.values[2][j]);
        for (let i = 0; i < newHand.lineup.length; i += 1) {
          if (newHand.lineup[i].address === dist.address) {
            newHand.lineup[i].amount += dist.amount;
          }
        }
      }
      return state
        .set('lastHandNettedOnClient', action.hand.handId)
        .set('hand', newHand);
    }


    case TableActions.COMPLETE_BET: {
      if (!action.holeCards.cards) return state;

      myPos = pokerHelper.getMyPos(state.get('hand').lineup, getMyAddress(action.privKey));
      const newHand = _.clone(state.get('hand'));
      newHand.lineup[myPos].cards = action.holeCards.cards;

      return state
        .set('hand', newHand);
    }

    case TableActions.COMPLETE_FOLD: {
      return state;
    }

    case TableActions.COMPLETE_SHOW: {
      update.showed = true;
      return state
        .set('showed', true);
    }

    case TableActions.STARTED_REQUEST: {
      return state
        .set('requestInProgress', true);
    }

    case TableActions.ADD_TO_MODAL: {
      const newStack = state.get('modalStack').slice();
      newStack.push(action.node);
      return state
        .set('modalStack', newStack);
    }

    case TableActions.DISMISS_FROM_MODAL: {
      const newStack = state.get('modalStack').slice();
      newStack.pop();
      return state
        .set('modalStack', newStack);
    }


    case TableActions.PERFORM_DEALING_ACTION: {
      return state
        .set('performedDealing', true);
    }

    // Error Handling
    case TableActions.FAILED_REQUEST: {
      return state
        .set('error', action.error)
        .set('requestInProgress', false);
    }

    case TableActions.UPDATE_RECEIVED: {
      // figure out when to rerender
      // if (!action.tableState.lineup) {
      //   return state;
      // }
      // handComplete stays true till SB posted to server
      const handComplete = (action.tableState.lineup) ? pokerHelper.checkForNextHand(action.tableState) : true;
      const newHand = _.clone(state.get('hand'));

      let newLastRoundMaxBet = 0;

      if (handComplete && state.get('hand').handId === action.tableState.handId) {
        newHand.lineup.forEach((player) => {
          delete player.last; // eslint-disable-line
        });
        newHand.handId = action.tableState.handId + 1;
      } else if (action.tableState.lineup && (!state.get('hand') || !state.get('hand').handId || state.get('hand').handId <= action.tableState.handId)) {
        _.merge(newHand.lineup, action.tableState.lineup);
        newLastRoundMaxBet = (state.get('lastRoundMaxBet')) ? state.get('lastRoundMaxBet') : 0;
        if (state.get('hand') && state.get('hand').state && action.tableState.state !== state.get('hand').state && action.tableState.state !== 'dealing') {
          const maxBet = pokerHelper.findMaxBet(action.tableState.lineup, action.tableState.dealer).amount;
          newLastRoundMaxBet = maxBet;
        }
        newHand.handId = action.tableState.handId;
        newHand.dealer = action.tableState.dealer;
        newHand.state = action.tableState.state;
        if (action.tableState.cards) {
          newHand.cards = action.tableState.cards;
        }
        if (action.tableState.distribution) {
          newHand.distribution = action.tableState.distribution;
        }
      }
      return state
        .set('complete', handComplete)
        .set('lastRoundMaxBet', newLastRoundMaxBet)
        .set('hand', newHand);
    }

    case TableActions.NEXT_HAND: {
      const currentDealer = state.get('hand').dealer;
      const currentLineup = state.get('hand').lineup;
      const newHand = _.clone(state.get('hand'));
      const newLineup = currentLineup.map((player) => {
        delete player.cards; // eslint-disable-line
        return player;
      });
      newHand.lineup = newLineup;
      newHand.state = 'dealing';
      newHand.cards = [];
      newHand.dealer = currentDealer + 1;
      return state
        .set('lastRoundMaxBet', 0)
        .set('complete', false)
        .set('performedDealing', false)
        .set('hand', newHand);
    }

    default:
      return state;
  }
}
