import React from 'react';
import { Page, PageHeader, PageContent, NavigationState } from '../ui';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

interface CompassPageProps {
  nav: NavigationState;
  location: Location;
}

@observer
class CompassPage extends React.Component<CompassPageProps, {}> {
  @observable watchId: any;
  @observable currentHeading: number | undefined;

  componentDidMount() {
    // this.watchId = (navigator as any).compass.watchHeading((heading: any) => {
    //   this.currentHeading = heading.magneticHeading;
    //   (this.refs['hello'] as any).leafletElement.setRotationAngle((this.currentHeading + 180) % 360);
    //   (this.refs['hello'] as any).leafletElement._icon.style.transition = 'transform 50ms linear';
    // }, (err: any) => {
    //   console.error('ERROR COMPASS ' + err);
    // }, {
    //   frequency: 50
    // });
  }

  componentWillUnmount() {
    // if (this.watchId) {
    //   (navigator as any).compass.clearWatch(this.watchId);
    // }
  }

  confirmDirection() {

  }

  render() {
    return <Page>
      <PageHeader nav={this.props.nav} />

    </Page>;
    // const position = [this.props.location.latitude, this.props.location.longitude];
    // return <Page nav={this.props.nav}>
    //   <Map center={position} zoom={18} style={{height: '100vh', position: 'absolute', top: '0', left: '0', width: '100%', zIndex: '-1' }}>
    //     <TileLayer
    //       url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
    //       attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    //     />
    //     <Marker ref="hello" position={position} rotationAngle={180} rotationOrigin='50% 20%'>
    //       <Popup>
    //         <span>A pretty CSS3 popup.<br/>Easily customizable.</span>
    //       </Popup>
    //     </Marker>
    //   </Map>
    //   <h1>Compass</h1>
    //   <button onClick={(e) => this.confirmDirection()} style={{position: 'absolute', bottom: '1rem', left: '1rem', width: 'calc(100% - 2rem)'}}>Confirm Direction</button>
    // </Page>;
  }
}