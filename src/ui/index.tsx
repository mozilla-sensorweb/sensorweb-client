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
  modal?: boolean;
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
          onClick={() => this.onBack()} disabled={!backEnabled}>
          {this.props.modal ? 'Close' : 'Back'}</a>
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

@observer
export class Page extends React.Component<PageProps, {}> {
  @observable activelyLoading = false;
  @observable justFinishedLoading = false;

  componentDidMount() {
//    console.log('MOUNT');
    if (this.props.loading) {
      setTimeout(() => {
        this.activelyLoading = true;
      });
    }
  }

  componentWillReceiveProps(nextProps: PageProps) {
    this.activelyLoading = !!nextProps.loading;
    if (this.props.loading && !this.activelyLoading) {
      this.justFinishedLoading = true;
      setTimeout(() => {
        this.justFinishedLoading = false;
      }, 700);
    }
  }

  render() {
    let classNames = ['Page'];
    if (this.activelyLoading) {
      classNames.push('loading');
    } else if (this.justFinishedLoading) {
      classNames.push('loaded');
    }
    this.props.modal && classNames.push('modal-page');
    console.log('PAGE', classNames);

    let page = <div key="page" className={classNames.join(' ')}>
      <div className="PageLoader" />
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
