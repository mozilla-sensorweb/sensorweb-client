import React from 'react';
import { Page, PageHeader, PageContent } from '../ui';
import { NavigationState } from '../state';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

let STATIC_MAPS_API_KEY = 'AIzaSyAzdnYcY71seAeev_Damc1I-FUClkE5_-Q';

let STATIC_MAP_BASE_URL = 'https://maps.googleapis.com/maps/api/staticmap?';

let FakeCompass = {
  watchHeading(cb: any, errback: any, params: any): number {
    return setInterval(() => {
      cb({ magneticHeading: Date.now() / 50 % 360 });
    }, 100);
  },
  clearWatch(id: number): void {
    clearInterval(id);
  }
};

function toCardinalDirection(degrees: number) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.floor((degrees / (360 / directions.length)) + 0.5) % directions.length];
}

function getStaticMapUrl(location: google.maps.LatLng): string {
  let params: any = {
    center: location.toUrlValue(),
    zoom: 19,
    // window's innerHeight might be race-condition-y if the keyboard was
    // previously displayed, so give it some extra height here:
    size: window.innerWidth + 'x' + (window.innerWidth * 2),
    scale: 2, // higher-resolution
    key: STATIC_MAPS_API_KEY,
    //signature: '' // XXX : should get a signature for APIs
    style: [
      'element:labels|visibility:off'
    ]
  };

  return STATIC_MAP_BASE_URL + Object.keys(params).map((key) => {
    let values: any = params[key];
    if (!Array.isArray(params[key])) {
      values = [values];
    }
    return values.map((value: any) => key + '=' + encodeURIComponent(value)).join('&');
  }).join('&');
}

interface CompassPageProps {
  nav: NavigationState;
  location: google.maps.LatLng;
  heading?: number;
  saveCompassDirection(direction: number): void;
}

@observer
export default class CompassPage extends React.Component<CompassPageProps, {}> {
  @observable watchId: any;
  @observable currentHeading: number|undefined;
  @observable showManualPopup: boolean = false;

  compass: any = (navigator as any).compass || FakeCompass;
  mapUrl: string;

  componentWillMount() {
    this.currentHeading = this.props.heading; // Might be undefined. That's ok.
    this.mapUrl = getStaticMapUrl(this.props.location || new google.maps.LatLng(37, 140));
  }

  componentDidMount() {
    this.watchId = this.compass.watchHeading((heading: any) => {
      this.currentHeading = heading.magneticHeading;
    }, (err: any) => {
      console.error('Failed to watch compass:', JSON.stringify(err));
      this.showManual();
    }, {
        frequency: 50
      });
  }

  showManual() {
    if (this.watchId !== undefined) {
      this.compass.clearWatch(this.watchId);
      this.watchId = undefined;
    }
    this.showManualPopup = true;
  }

  componentWillUnmount() {
    this.compass.clearWatch(this.watchId);
  }

  confirmAutomaticDirection() {
    this.props.saveCompassDirection(this.currentHeading as number);
    this.props.nav.markComplete();
  }

  confirmManualDirection(degrees: number) {
    this.showManualPopup = false;
    this.props.saveCompassDirection(degrees);
    this.props.nav.markComplete();
  }

  onManualListItemClick(e: MouseEvent) {
    let target = e.target as HTMLElement;
    if (target && target.dataset['heading'] != null) {
      let heading = target.dataset['heading'];
    }
  }

  isValid() {
    return this.currentHeading !== undefined;
  }

  renderManual() {

    let headingElement = (degrees: number, title: string) => {
      return <li
        onClick={(e) => this.currentHeading = degrees}
        className={degrees === this.currentHeading ? 'checked' : ''}>{title}</li>;
    };

    return <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <section className="instruction">
        <p>Which side of the building does your balcony or patio face?</p>
      </section>
      <section style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <ul className="list" onClick={this.onManualListItemClick.bind(this)}>
          {headingElement(0, 'North')}
          {headingElement(90, 'East')}
          {headingElement(180, 'South')}
          {headingElement(270, 'West')}
        </ul>
      </section>
    </div>;
  }

  renderAutomatic() {
    return <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <section className="instruction">
        <p>Hold your phone so that it points <em>away</em> from your house, toward the outdoors.</p>
        <p className="detail">Or <a href="#" onClick={() => this.showManual()}>manually enter your direction</a>.</p>
      </section>
      <div style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flex: '1 1 0px',
        overflow: 'hidden',
        borderTop: '1px solid #999'
      }}>
        <img style={{ width: '100%', height: 'auto', display: 'block' }} src={this.mapUrl} />
        <img className='compass-pointer'
          style={{ transform: `rotate(${this.currentHeading}deg)` }}
          src={require<string>('../assets/compass-pointer.svg')} />
      </div>
    </div>;
  }

  render() {
    return <Page>
      <PageHeader nav={this.props.nav} title='Which side of the building?'
        next={this.isValid() && this.confirmAutomaticDirection.bind(this)} />
      <PageContent>
        {this.showManualPopup ? this.renderManual() : this.renderAutomatic()}
      </PageContent>
    </Page>;
  }
}