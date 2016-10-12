import React from 'react';
import { observable, computed, action } from 'mobx';
import { observer } from 'mobx-react';

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