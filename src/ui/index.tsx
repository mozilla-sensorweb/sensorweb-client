import React from 'react';
import { observable, computed, action } from 'mobx';
import { observer } from 'mobx-react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { NavigationState, Step } from '../state';

const { default: styled } = require<any>('styled-components');


export { default as Page } from './Page';
export { default as PageHeader } from './PageHeader';
export { default as Button } from './Button';


export const PageContent = styled.div`
  flex-grow: 1;

  display: flex;
  flex-direction: column;
`;


export const Section = styled.div`
  padding: 1rem;
  & p {
    margin: 1rem 0;
  }
  & p:first-child {
    margin-top: 0;
  }
  & p:last-child {
    margin-bottom: 0;
  }

  flex-grow: ${(props: any) => props.grow ? 1 : 0};
  display: ${(props: any) => (props.flexVertical || props.flexHorizontal) ? 'flex' : 'block'};
  ${(props: any) => props.flexVertical && 'flex-direction: column;'}
`;
