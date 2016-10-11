import React from 'react';
import { Page, PageHeader, PageContent, TutorialImage, NavigationState } from '../ui';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

interface AltitudePageProps {
  nav: NavigationState;
  floor?: number;
  saveAltitude(floor: number): void;
}

@observer
export class AltitudePage extends React.Component<AltitudePageProps, {}> {
  @observable floor?: number;
  input: HTMLInputElement;

  componentWillMount() {
    this.floor = this.props.floor;
  }

  componentDidMount() {
    setTimeout(() => {
      this.input.focus();
    }, 1000); // XXX: we really just want this to happen after the transition
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
    if (event.keyCode === 13) {
      this.submit();
    }
  }

  render() {
    console.log('render', this.floor)
    return <Page>
      <PageHeader nav={this.props.nav} title='Altitude'
        next={this.isValid() && this.submit.bind(this)} />
      <PageContent>
        <section className="centered">
          <p className="detail">Knowing your altitude improves the accuracy of your sensor.</p>
        </section>
        <section style={{flexGrow: 1}}>
          <p>Which floor is your sensor on?</p>
          <input type="number"
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
        <section>
          <a className="button" disabled={!this.isValid()} onClick={(e) => this.submit()}>Confirm Floor</a>
        </section>
      </PageContent>
    </Page>;
  }
}