import React from 'react';
import { observable, computed, action } from 'mobx';
import { observer } from 'mobx-react';

export enum Step {
  Welcome,
  EnableBluetooth,
  FindSensor,
  Wifi,
  Location,
  Compass,
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

interface PageProps {
  nav: NavigationState;
  back?: boolean | null;
  next?: boolean | null; // null means don't show the button, false means disabled, true/undefined means enabled
  title?: string;
  loading?: boolean;
  hideHeader?: boolean;
}

@observer
export class Page extends React.Component<PageProps, {}> {

  onBack() {
    this.props.nav.markPreviousStepIncomplete();
  }

  onNext() {
    this.props.nav.markComplete();
  }

  render() {
    const nav = this.props.nav;
    const canGoBack = nav.currentStep > 0 && this.props.back !== null;
    const canGoNext = nav.currentStep < Step.length - 1 && this.props.next !== null;

    return <div className="Page">
      <div className="page-header" style={{ display: this.props.hideHeader ? 'none' : '' }}>
        <a className={'back-button' + (canGoBack ? '' : ' invisible')} onClick={() => this.onBack()} disabled={this.props.back === false}>Back</a>
        <h1>{this.props.title || ''}</h1>
        <a className={'next-button' + (canGoNext ? '' : ' invisible')} onClick={() => this.onNext()} disabled={this.props.next === false}>Next</a>
      </div>
      <div className="page-content">
        {this.props.loading ? <div className="PageSpinner"><img src={require<string>('../assets/spinner.svg')}/></div> : null}
        {this.props.children}
      </div>
    </div>;
  }
}


export let TutorialImage = (props: {src: string}) => {
  return <img className="TutorialImage" src={props.src} />
};
