import React from 'react';
import _ from './mixins';
import {socketEmit} from './api';

class Sorteo extends React.Component {
    constructor() {
        super();

        this.state = {
            status: "loaded"
        };

        _.bindAll(this, "Sortear", "sendSortear")
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
                returns: <p><span><i>para sortear ingresa tu pass: </i>
          <input type="password" ref="sorteoPassInput"/>
          <button onClick={this.sendSortear}>sortear</button>
          </span></p>
            },
            {
                s: "loaded",
                values: _.negate(_.isEmpty),
                returns: <p><span>Sorteo: sorteo realizado <button
                    onClick={this.Sortear}>volver a sortear</button></span></p>,
            },
            {
                returns: <p><span>Sorteo: todavia no se sortea <button onClick={this.Sortear}>sortear</button></span>
                </p>
            }
        ]);
    }

    Sortear() {
        this.setState({status: "sorteando"})
    }

    sendSortear() {
        let pass = _.get(this, "refs.sorteoPassInput.value");

        socketEmit("sortear", {pass: pass} );

        this.resetState()
    }

    resetState() {
        this.setState({status: "loaded"});
    }
}

export default Sorteo;