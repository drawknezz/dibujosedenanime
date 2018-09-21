import React from 'react';
import _ from './mixins';
import {socketEmit} from './api';
import ReactCSSReplace from 'react-css-transition-replace';

class Sorteo extends React.Component {
    constructor() {
        super();

        this.state = {
            status: "loaded"
        };

        _.bindAll(this, "Sortear", "sendSortear", "resetState")
    }

    render() {
        let status = this.state.status;

        return _.ruleMatch({s: status, values: _.get(this, "props.sorteo.values")}, [
            {
                s: "loading",
                returns: <p><span>Sorteo: ...</span></p>
            },
            {
                s: "sorteando",
                returns: (
                    <ReactCSSReplace
                        component="div"
                        className="sorteocontents"
                        transitionName="sorteo"
                        transitionEnterTimeout={300}
                        transitionLeaveTimeout={300}
                    >
                        <div key="sortingcontroles">
                            <p>
                                <span><i>para sortear ingresa tu pass: </i>
                                    <input type="password" ref="sorteoPassInput"/>
                                    <button onClick={this.sendSortear}>sortear</button>
                                    <button onClick={this.resetState}>cancelar</button>
                                </span>
                            </p>
                        </div>
                    </ReactCSSReplace>)
            },
            {
                s: "loaded",
                values: _.negate(_.isEmpty),
                returns: <ReactCSSReplace
                    component="div"
                    className="sorteocontents"
                    transitionName="sorteo"
                    transitionEnterTimeout={300}
                    transitionLeaveTimeout={300}
                >
                    <div key="loadedcontroles">
                        <p><span>Sorteo: sorteo realizado <button
                            onClick={this.Sortear}>volver a sortear</button></span>
                        </p>
                    </div>
                </ReactCSSReplace>,
            },
            {
                returns: <ReactCSSReplace
                    component="div"
                    className="sorteocontents"
                    transitionName="sorteo"
                    transitionEnterTimeout={300}
                    transitionLeaveTimeout={300}
                >
                    <div key="defaultcontroles">
                        <p><span>este reto aun no se sortea...
                            <button onClick={this.Sortear}>sortear</button>
                        </span></p>
                    </div>
                </ReactCSSReplace>
            }
        ]);
    }

    Sortear() {
        this.setState({status: "sorteando"})
    }

    sendSortear() {
        let pass = _.get(this, "refs.sorteoPassInput.value");

        socketEmit("sortear", {pass: pass});

        this.resetState()
    }

    resetState() {
        this.setState({status: "loaded"});
    }
}

export default Sorteo;