import * as React from 'react';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
const { default: styled } = require<any>('styled-components');
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

interface PageProps {
  loading?: boolean;
  modal?: boolean;
  visible?: boolean;
}

@observer
export default class Page extends React.Component<PageProps, {}> {
  @observable activelyLoading = false;
  @observable justFinishedLoading = false;

  componentDidMount() {
    if (this.props.loading) {
      setTimeout(() => {
        this.activelyLoading = true;
      });
    }
  }

  componentWillReceiveProps(nextProps: PageProps) {
    this.activelyLoading = !!nextProps.loading;
    if (this.props.loading && !this.activelyLoading) {
      this.justFinishedLoading = true;
      setTimeout(() => {
        this.justFinishedLoading = false;
      }, 700);
    }
  }

  render() {
    let page = <PageDiv key="page" modal={this.props.modal}>
      <div className="PageLoader" />
      {this.props.children}
    </PageDiv>;

    if (this.props.modal) {
      return <ReactCSSTransitionGroup
        transitionName={ {
          enter: 'modal-enter',
          leave: 'modal-leave',
          appear: 'modal-enter'
        } }
        transitionEnterTimeout={300}
        transitionAppear={true}
        transitionAppearTimeout={300}
        transitionLeaveTimeout={300}>
        {this.props.visible && page}
      </ReactCSSTransitionGroup>
    } else {
      return page;
    }
  }
}

const PageDiv = styled.div`
  /* Why position fixed? Because on Android, when the software keyboard
     is displayed, it overrides the body's "overflow: hidden" property
     and tries to scroll the page. We don't want that. */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;

  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont,
    "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell",
    "Fira Sans", "Droid Sans", "Helvetica Neue",
    sans-serif;

  z-index: ${(props: any) => props.modal ? 100 : 0};
  background: #f5f5f5;

  .next-page-enter > &, .previous-page-enter > &,
  .next-page-leave > &, .previous-page-leave > & {
    transition: all 500ms ease;
    transition-property: opacity, transform;
  }

  .next-page-enter > &, .previous-page-leave.previous-page-leave-active > & {
    transform: translate3d(100vw, 0, 0);
    opacity: 0;
  }
  .next-page-enter.next-page-enter-active > &, .previous-page-leave > &,
  .next-page-leave > &, .previous-page-enter.previous-page-enter-active > & {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
  .next-page-leave.next-page-leave-active > &, .previous-page-enter > & {
    transform: translate3d(-100vw, 0, 0);
    opacity: 0;
    overflow-y: hidden;
  }

  .modal-enter, .modal-leave {
    transition: transform 300ms ease-out;
    box-shadow: 0 -10px 20px rgba(0, 0, 0, 0.1);
  }
  .modal-enter, .modal-leave.modal-leave-active {
    transform: translateY(100%);
  }
  .modal-enter.modal-enter-active, .modal-leave {
    transform: translateY(0);
  }
`;