import React from 'react';
import { observable, computed, action } from 'mobx';
import { observer } from 'mobx-react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { NavigationState, Step } from '../state';

interface PageHeaderProps {
  nav: NavigationState;
  back?: (() => any) | false | null;
  next?: (() => any) | false | null;
  title?: string;
  translucent?: boolean;
}

@observer
export class PageHeader extends React.Component<PageHeaderProps, {}> {
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
    const nextAvailable = nav.currentStep < Step.length - 1 && this.props.next != null;
    const backEnabled = backAvailable;
    const nextEnabled = typeof this.props.next === 'function';

    let progressDots: any[] = [];
    for (let i = 0; i < Step.length; i++) {
      let complete = nav.currentStep >= i;
      progressDots.push(<div key={i} className={'progress-dot ' + (complete ? 'complete' : '')} />);
    }

    return <div className={['PageHeader', this.props.translucent ? 'translucent' : 'opaque'].join(' ')}>
      {/*<div className='PageSpinner'>
        <div>
          <img src={require<string>('../assets/spinner.svg')}/>
        </div>
      </div>*/}
      <div className="header-buttons">
        <a className={'back-button' + (backAvailable ? '' : ' invisible')}
          onClick={() => this.onBack()} disabled={!backEnabled}>Back</a>
        <div className="progress">
          {progressDots}
        </div>
        <a className={'next-button' + (nextAvailable ? '' : ' invisible')}
          onClick={() => this.onNext()} disabled={!nextEnabled}>Next</a>
      </div>
      {this.props.title && <h1>{this.props.title || ''}</h1>}
    </div>;
  }
}

interface PageProps {
  loading?: boolean;
  modal?: boolean;
  visible?: boolean;
}

let pagesLoading = new Set();
let wasLoading = false;
function updateLoader() {
  let loader = document.getElementById('PageLoader');
  if (loader) {
    let isLoading = pagesLoading.size > 0;
    if (wasLoading !== isLoading) {
      console.log(Date.now(), 'updateLoader', wasLoading, isLoading);
      loader.classList.toggle('loaded', wasLoading && !isLoading)
      loader.classList.toggle('loading', isLoading);
      if (wasLoading && !isLoading) {
        setTimeout(() => {
          loader && loader.classList.remove('loaded');
        }, 500);
      }
      wasLoading = isLoading;
    }
  }
}

@observer
export class Page extends React.Component<PageProps, {}> {

  componentDidMount() {

    if (this.props.loading) {
      pagesLoading.add(this);
    } else {
      pagesLoading.delete(this);
    }
    updateLoader();
  }
  componentDidUpdate() {
    if (this.props.loading) {
      pagesLoading.add(this);
    } else {
      pagesLoading.delete(this);
    }
    updateLoader();
  }

  componentWillUnmount() {
    pagesLoading.delete(this);
    updateLoader();
  }

  render() {
    let classNames = ['Page'];
    this.props.loading && classNames.push('loading');
    this.props.modal && classNames.push('modal-page');

    let page = <div key="page" className={classNames.join(' ')}>
      {this.props.children}
    </div>;

    if (this.props.modal) {
      return <ReactCSSTransitionGroup
        transitionName="modal"
        transitionEnterTimeout={1000}
        transitionLeaveTimeout={1000}>
        {this.props.visible && page}
      </ReactCSSTransitionGroup>
    } else {
      return page;
    }
  }
}

@observer
export class PageContent extends React.Component<{}, {}> {
  render() {
    return <div className="PageContent">
      {this.props.children}
    </div>;
  }
}


export let TutorialImage = (props: {src: string}) => {
  return <section className="TutorialImage"><img src={props.src} /></section>;
};
