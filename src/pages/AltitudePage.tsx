import React from 'react';
import { Page, PageHeader, PageContent, TutorialImage } from '../ui';
import { NavigationState } from '../state';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

interface AltitudePageProps {
  nav: NavigationState;
  altitude?: number;
  saveAltitude(altitude: number): void;
}

@observer
export default class AltitudePage extends React.Component<AltitudePageProps, {}> {
  @observable isFloorFourOrHigher?: boolean;
  input: HTMLInputElement;

  componentWillMount() {
    this.isFloorFourOrHigher = this.props.altitude !== undefined ? this.props.altitude >= 4 : undefined;
  }

  isValid() {
    return this.isFloorFourOrHigher === true || this.isFloorFourOrHigher === false;
  }

  submit() {
    if (this.isValid()) {
      this.props.saveAltitude(this.isFloorFourOrHigher ? 4 : 0);
      this.props.nav.markComplete();
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.isValid() && (event.keyCode === 13 || event.keyCode === 9)) {
      this.submit();
    }
  }

  render() {
    return <Page>
      <PageHeader nav={this.props.nav} title='How high is your sensor?'
        next={this.isValid() && this.submit.bind(this)} />
      <PageContent>
        <section className="detail">
          <p>To enhance the accuracy of your sensor data, we need to have a rough idea
          of which floor your sensor is on.</p>
        </section>
        <section style={{ flexGrow: 1 }}>
          <p>Is your sensor above the third floor of your building?</p>
          <p><label><input type="radio" value="yes" checked={this.isFloorFourOrHigher === true}
            onChange={(e) => this.isFloorFourOrHigher = true} />
            &nbsp;Yes, my sensor is on the 4th floor or higher.</label></p>
          <p><label><input type="radio" value="no" checked={this.isFloorFourOrHigher === false}
            onChange={(e) => this.isFloorFourOrHigher = false} />
            &nbsp;No, my sensor is on the 3rd floor or lower.</label></p>
        </section>
        {/*<TutorialImage src={require<string>('../assets/building.svg')} />*/}
        {/*<section>
          <a className="button" disabled={!this.isValid()} onClick={(e) => this.submit()}>Confirm Floor</a>

      </section>*/}
      </PageContent>
    </Page>;
  }
}