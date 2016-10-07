import React from 'react';
import { observable } from 'mobx';

export enum Step {
  Welcome,
  EnableBluetooth,
  FindSensor,
  Wifi,
  Location,
  Compass,
};

export class NavigationState {
  @observable currentStep: Step = Step.Welcome;
  wentBackwards: boolean;

  private stepsComplete: {[step: string]: boolean} = {};

  markComplete(step?: Step) {
    step = step || this.currentStep;
    this.stepsComplete[step] = true;
    if (step === this.currentStep) {
      this.currentStep++;
      this.wentBackwards = false;
    }
  }

  mark(step: Step, complete: boolean) {
    if (complete) {
      this.markComplete(step);
    } else {
      this.markIncomplete(step);
    }
  }

  markIncomplete(step: Step) {
    this.stepsComplete[step] = false;
    if (step < this.currentStep) {
      this.currentStep = step;
      this.wentBackwards = true;
    }
  }
}

export function Page(props: { nav: NavigationState, children?: any }) {
  return (
    <div data-foo={props.nav.currentStep} key={props.nav.currentStep} className="Page">
      {props.children}
    </div>
  );
}



export function PageSpinner(props: any) {
  return (
    <div className="PageSpinner">
    </div>
  )
}