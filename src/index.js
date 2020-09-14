import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from "react-redux";

import AppComponent from 'App';
import * as serviceWorker from 'serviceWorker';
import store from 'store';

import 'index.css';

ReactDOM.render(
  <Provider store={store}>
    <AppComponent />
  </Provider>,
  document.getElementById('root')
);

serviceWorker.unregister();
