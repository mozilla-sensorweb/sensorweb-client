import React from 'react';
import ReactDOM from 'react-dom';
import { observable } from 'mobx';
import { observer } from 'mobx-react';



import './index.css';

class UiState {
  @observable language = 'en_US';
  @observable deviceReady = false;
}

interface RootProps {
  uiState: UiState
}

@observer
class Root extends React.Component<RootProps, {}> {
  constructor(props: RootProps) {
    super(props);
  }

  render() {
    return <h1>Hello; {this.props.uiState.deviceReady ? 'ready' : 'not ready?'}</h1>;
  }
}

let uiState = new UiState();

ReactDOM.render(
  <Root uiState={uiState} />,
  document.getElementById('root')
);


document.addEventListener('deviceready', () => {
  uiState.deviceReady = true;
});

setTimeout(() => {
  console.log('hey')
  uiState.deviceReady = true;
}, 1000);
