import React from 'react';
import _ from './mixins';
import {socketEmit} from './api';
import ReactCSSReplace from 'react-css-transition-replace';

class Votaciones extends React.Component {
    constructor() {
        super();

        this.state = {
            status: "loaded"
        };

        _.bindAll(this, "createEntry", "creatingEntry", "vote", "createPoll", "creatingPoll")
    }

    render() {
        let status = this.state.status;

        return _.ruleMatch({s: status, polls: _.get(this, "props.polls")}, [
            {
                s: "loaded",
                polls: _.negate(_.isEmpty),
                returns: <div className="pollscontents">
                    <div key="pollscontroles">
                        <p><span><button onClick={this.creatingPoll}>crear nueva votacion</button></span></p>
                        <div className="pollslist">{
                            _.chain(this).get("props.polls").map(poll => {
                                return <div className="poll" key={_.get(poll, "_id")}>
                                    <span>{_.get(poll, "name", "votacion sin nombre")}</span>
                                </div>
                            }).value()
                        }</div>
                    </div>
                </div>,
            },
            {
                returns: <div className="pollscontents">...</div>,
            },
        ]);
    }

    creatingPoll() {
        this.setState({status: "creandopoll"});
    }

    createPoll(){
        console.log("creating poll")
    }

    creatingEntry() {
        this.setState({status: "creandoentry"})
    }

    createEntry() {
        let pass = _.get(this, "refs.sorteoPassInput.value");

        socketEmit("sortear", {pass: pass});

        this.resetState()
    }

    vote() {
        this.setState({status: "loaded"});
    }
}

export default Votaciones;