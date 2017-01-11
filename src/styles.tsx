const { injectGlobal } = require<any>('styled-components');

// Our CSS includes a few global resets for ease of use:
// - "box-sizing: border-box" is default.
// - All margin and padding is removed from all elements.
// - All font size and weights are reset.
injectGlobal`

html {
  box-sizing: border-box;
}
*, *:before, *:after {
  box-sizing: inherit;
  margin: 0;
  padding: 0;
  font-size: inherit;
  font-weight: inherit;
}

html {
  font-family: Rubik, Arial, Helvetica, sans-serif;
  font-size: 16px;
  line-height: 1.4;
}

* {
  -webkit-tap-highlight-color: rgba(0,0,0,0);
}


/* Hide the placeholder text when an input is focused. */
input:focus::-webkit-input-placeholder { color:transparent; }
input:focus::-moz-placeholder { color:transparent; } /* FF 19+ */
input:focus:-ms-input-placeholder { color:transparent; } /* IE 10+ */


body {
  background: #fff;
  position: fixed;
  width: 100%;
  height: 100%;
  -webkit-touch-callout: none;
  -webkit-text-size-adjust: none;
  user-select: none;
  overflow: hidden;
}









input[type="text"], input[type="number"], input[type="password"] {
  font-family: inherit;
  box-sizing: border-box;
  padding: 0.5rem 0.8rem;
  border: 1px solid #999;
  display: block;
  box-sizing: border-box;
  width: 100%;
  -webkit-appearance: none; /* no inset shadow */
  border-radius: 0px;
}





.gps-pin {
  position: absolute;
  top: calc(50% - 0.5rem);
  left: calc(50% - 0.5rem);
  width: 0.5rem;
  height: 0.5rem;
  background: rgba(0, 150, 255, 1);
  border-radius: 50%;
  z-index: 11;
}

@keyframes pulsate {
    0% { transform: scale(1); opacity: 0.0; }
    50% { opacity: 0.2; }
    100% { transform: scale(5); opacity: 0.0; }
}

.gps-pin::after {
  content: '';
  border-radius: 50%;
  background: rgba(0, 150, 255, 1);
  height: 100%;
  width: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 10;

  animation: pulsate 3s ease-out;
  animation-iteration-count: infinite;
  opacity: 0.0
}

.gps-control {
  background-color: #fff;
  box-shadow: 0px 1px 4px -1px rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  cursor: pointer;
  text-align: center;
  margin-top: 10px;
  margin-right: 10px;
  & img {
    width: 14px;
    height: 14px;
    padding: 7px 8px 2px 6px;
    opacity: 0.55;
  }
}

.gps-control.following {
  background-color: #cef;
  & img {
    opacity: 1;
  }
}

.compass-pointer {
  position: absolute;
  left: 50%;
  top: 50%;
  margin-left: -2rem;
  margin-top: -2rem;
  width: 4rem;
  height: 4rem;
  transform-origin: center center;
}








`;