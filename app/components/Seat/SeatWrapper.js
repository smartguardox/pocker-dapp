/**
 * Created by helge on 15.02.17.
 */

import styled from 'styled-components';

import {
  baseColor,
  background,
  gray,
  green,
} from 'variables';

export const SeatWrapper = styled.div`
  position: absolute;
  left: ${(props) => props.coords[0]}%;
  top: ${(props) => props.coords[1]}%;
  width: 10%;
  height: 25%;
`;

export const ImageContainer = styled.div`
  border-radius: 50%;
  position: absolute;
  transform: translate(-50%,-50%);
  border: 3px solid ${(props) => {
    if (props.whosTurn === props.pos && props.hand.get('state') !== 'showdown') {
      return green;
    }
    if (props.sitout && props.sitout !== 'allin') {
      return gray;
    }
    if (props.open) {
      return '#fff';
    }
    return baseColor;
  }};
  background-size:cover;
  background-image: url(${(props) => {
    if (!props.open) {
      return props.blocky;
    }
    return '';
  }});
  width: 100%;
  height: 100%;
  text-align: center;
  ${(props) => (props.open) ? 'cursor: pointer' : ''};
  z-index: 10;
`;

export const SeatLabel = styled.div`
  position: absolute;
  font-size: 0.5em
  top: 50%;
  left: 50%;  
  transform: translate(-50%,-50%);
`;

export const DealerButton = styled.div`
  border-radius: 50%;
  ${(props) => (!(props.hand.get('dealer') === props.pos)) ? 'display: none;' : ''}
  border: 4px solid ${baseColor}
  width: 1.5em;
  height: 1.5em;
  background: ${background};
  text-align: center;
  color: white;
  position: absolute;
  z-index: 10;
`;

export const ChipGreen = styled.p`
  border-radius: 50%;
  width: 1em;
  height: 1em;
  float: left;
  background: ${green}
`;

export const Amount = styled.p`
  display: inline-block;
  margin-left: 0.5em;
  font: inherit;
  line-height: 1em;
  position: absolute;
`;

export const CardContainer = styled.div`
  position: absolute;
  left: -50%;
  ${(props) => (props.folded) ? 'display: none' : ''}
`;
