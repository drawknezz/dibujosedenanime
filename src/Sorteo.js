import React from 'react';
import _ from './mixins';
import {socketEmit} from './api';
import ReactCSSReplace from 'react-css-transition-replace';
import {connect} from 'react-redux';

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
        let isAdmin = _.includes(_.get(this, "props.userData.permissions"), "any");

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
                                <span><i>seguro?</i>
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
                        <p>
                            <span>Sorteo: sorteo realizado&nbsp;
                                {isAdmin ? <button onClick={this.Sortear}>volver a sortear</button> : null}
                            </span>
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
                        <p>
                            <span>este reto aun no se sortea...&nbsp;
                            {isAdmin ? <button onClick={this.Sortear}>sortear</button> : null}
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
        const userid = _.get(this, "props.userData.id");

        socketEmit("sortear", {userid});

        this.resetState()
    }

    resetState() {
        this.setState({status: "loaded"});
    }
}

export default connect(state => state)(Sorteo);