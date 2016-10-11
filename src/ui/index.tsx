import React from 'react';
import { observable, computed, action } from 'mobx';
import { observer } from 'mobx-react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

export enum Step {
  Welcome,
  AllowLocation,
  SelectLocation,
  Compass,
  Altitude,
  Wifi,
  EnableBluetooth,
  FindSensor,
  length
};

export class NavigationState {
  @observable _currentStep: Step = Step.Welcome;
  wentBackwards: boolean;

  private stepsComplete: {[step: string]: boolean} = {};

  @computed
  get currentStep() {
    return this._currentStep;
  }

  @action
  markComplete(step?: Step) {
    step = step || this.currentStep;
    this.stepsComplete[step] = true;
    if (step === this.currentStep) {
      this._currentStep++;
      this.wentBackwards = false;
      if (this.stepsComplete[this._currentStep]) {
        this.markComplete(this._currentStep);
      }
    }
  }

  mark(step: Step, complete: boolean) {
    if (complete) {
      this.markComplete(step);
    } else {
      this.markIncomplete(step);
    }
  }

  @action
  markIncomplete(step: Step) {
    this.stepsComplete[step] = false;
    if (step < this.currentStep) {
      this._currentStep = step;
      this.wentBackwards = true;
    }
  }

  @action
  markPreviousStepIncomplete() {
    console.log('mark prev incomplete + '+ this.currentStep);
    let step = this.currentStep;
    if (step > 0) {
      // XXX: This step always automatically finishes, since bluetooth is enabled at this point.
      if (step - 1 === Step.EnableBluetooth) {
        step--;
      }
      this.markIncomplete(step - 1);
    }
  }
}

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

    return <div className={['page-header', this.props.translucent ? 'translucent' : 'opaque'].join(' ')}>
      <a className={'back-button' + (backAvailable ? '' : ' invisible')}
        onClick={() => this.onBack()} disabled={!backEnabled}>Back</a>
      <h1>{this.props.title || ''}</h1>
      <a className={'next-button' + (nextAvailable ? '' : ' invisible')}
        onClick={() => this.onNext()} disabled={!nextEnabled}>Next</a>
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
  render() {
    let classNames = ['Page'];
    this.props.loading && classNames.push('loading');
    this.props.modal && classNames.push('modal-page');

    let page = <div className={classNames.join(' ')}>
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
    return <div className="page-content">
      <div className='PageSpinner'>
        <div>
          <img src={require<string>('../assets/spinner.svg')}/>
        </div>
      </div>
      {this.props.children}
    </div>;
  }
}


export let TutorialImage = (props: {src: string}) => {
  return <section className="TutorialImage"><img src={props.src} /></section>;
};
