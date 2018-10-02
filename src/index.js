import _ from './mixins';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import {createStore, applyMiddleware, compose} from "redux";
import {Provider} from "react-redux";
import storiesReducer from "./reducers/index";

import {createEpicMiddleware} from "redux-observable";
import {rootEpic} from "./epics";

const composeEnhancers = _.get(window, "__REDUX_DEVTOOLS_EXTENSION_COMPOSE__", compose);

const epicMiddleware = createEpicMiddleware();
const store = createStore(storiesReducer, composeEnhancers(applyMiddleware(epicMiddleware)));
epicMiddleware.run(rootEpic);

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>, document.getElementById('root'));
registerServiceWorker();
