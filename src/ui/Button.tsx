import * as React from 'react';
const { default: styled } = require<any>('styled-components');

interface ButtonProps {
  onClick(): void;
  small?: boolean;
  primary?: boolean;
}
export default class Button extends React.Component<ButtonProps, any> {
  render() {
    return <ButtonDiv {...this.props} onClick={() => this.props.onClick()}>
      {this.props.children}
    </ButtonDiv>;
  }
}

const ButtonDiv = styled.a`
  display: block;
  border: 1px solid black;
  padding: 1rem;
  background-color: ${(props: any) => props.primary ? 'black' : 'none'}
  color: ${(props: any) => props.primary ? 'white' : 'black'}

  ${(props: any) => props.small && `
    font-size: smaller;
  `}
`;