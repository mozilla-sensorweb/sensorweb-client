import React from 'react';
import { Page, PageHeader, PageContent, TutorialImage } from '../ui';
import { NavigationState } from '../state';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

interface AltitudePageProps {
  nav: NavigationState;
  floor?: number;
  saveAltitude(floor: number): void;
}

@observer
export default class AltitudePage extends React.Component<AltitudePageProps, {}> {
  @observable floor?: number;
  input: HTMLInputElement;

  componentWillMount() {
    this.floor = this.props.floor;
  }

  componentDidMount() {
    // A timeout here because we need the incoming page transition to complete.
    // Otherwise, calling .focus() interrupts the transition.
    setTimeout(() => {
      this.input.focus();
    }, 800);
  }

  isValid() {
    return this.floor != null && Number.isInteger(this.floor);
  }

  submit() {
    if (this.isValid()) {
      this.props.saveAltitude(this.floor as number);
      this.props.nav.markComplete();
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.isValid() && (event.keyCode === 13 || event.keyCode === 9)) {
      this.submit();
    }
  }

  render() {
    console.log('render', this.floor)
    return <Page>
      <PageHeader nav={this.props.nav} title='How high is your sensor?'
        next={this.isValid() && this.submit.bind(this)} />
      <PageContent>
        <section className="instruction">
          <p>Knowing your sensor’s altitude improves its accuracy.</p>
        </section>
        <section style={{flexGrow: 1}}>
          <p>On which floor of the building is your sensor located?</p>
          <input type="number"
            pattern="\d*"
            ref={(el) => this.input = el}
            value={this.floor || ''}
            style={{fontSize: 'larger'}}
            onKeyDown={this.onKeyDown.bind(this)}
            onChange={(e) => {
            if (isNaN(e.currentTarget.valueAsNumber)) {
              e.currentTarget.value = '';
              this.floor = undefined;
            } else {
              this.floor = e.currentTarget.valueAsNumber;
            }
          }}/>
        </section>
        {/*<TutorialImage src={require<string>('../assets/building.svg')} />*/}
        {/*<section>
          <a className="button" disabled={!this.isValid()} onClick={(e) => this.submit()}>Confirm Floor</a>

      </section>*/}
      </PageContent>
    </Page>;
  }
}