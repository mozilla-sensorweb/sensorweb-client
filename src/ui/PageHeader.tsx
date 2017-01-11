import React from 'react';
const { default: styled } = require<any>('styled-components');
import { NavigationState, Step } from '../state';

interface PageHeaderProps {
  nav: NavigationState;
  back?: (() => any) | false | null;
  next?: (() => any) | false | null;
  title?: string;
  translucent?: boolean;
  modal?: boolean;
  noProgress?: boolean;
}

export default class PageHeader extends React.Component<PageHeaderProps, {}> {
  onBack() {
    if (typeof this.props.back === 'function') {
      this.props.back();
    } else {
      this.props.nav.markPreviousStepIncomplete();
    }
  }

  onNext() {
    if (typeof this.props.next === 'function') {
      this.props.next();
    }
  }

  render() {
    const nav = this.props.nav;
    const backAvailable = nav.currentStep > 0 && this.props.back !== false;
    const nextAvailable = nav.currentStep < Step.Dashboard - 1 && this.props.next != null;
    const backEnabled = backAvailable;
    const nextEnabled = typeof this.props.next === 'function';

    let progressDots: any[] = [];
    for (let i = Step.AllowLocation; i < Step.Dashboard; i++) {
      let complete = nav.currentStep >= i;
      progressDots.push(<div key={i} className={'progress-dot ' + (complete ? 'complete' : '')} />);
    }

    return <PageHeaderDiv>
      {/*<div className='PageSpinner'>
        <div>
          <img src={require<string>('../assets/spinner.svg')}/>
        </div>
      </div>*/}
      <div className="header-buttons">
        <a className={'back-button' + (backAvailable ? '' : ' invisible')}
          onClick={() => this.onBack()} disabled={!backEnabled}>
          {this.props.modal ? 'Close' : 'Back'}</a>
        {!this.props.noProgress && <div className="progress">
          {progressDots}
        </div>}
        <a className={'next-button' + (nextAvailable ? '' : ' invisible')}
          onClick={() => this.onNext()} disabled={!nextEnabled}>Next</a>
      </div>
      {this.props.title && <h1>{this.props.title || ''}</h1>}
    </PageHeaderDiv>;
  }
}

const PageHeaderDiv = styled.div`
  & .header-buttons {
    display: flex;

    & .back-button, & .next-button {
      cursor: pointer;
      width: 4rem;
      text-align: center;
      padding: 1em 0;
      font-size: smaller;
      color: #06c;
      &:active {
        color: #0af;
      }

      &.invisible {
        visibility: hidden;
      }

      &[disabled] {
        pointer-events: none;
        opacity: 0.2;
        color: black;
      }
    }

    & .next-button {
      margin-left: auto;
    }
  }

  & h1 {
    font-weight: bold;
    font-size: larger;
    text-align: center;
  }
`;