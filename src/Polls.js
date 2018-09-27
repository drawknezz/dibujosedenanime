import React from 'react';
import _ from './mixins';
import {socketEmit} from './api';
import ReactCSSReplace from 'react-css-transition-replace';
import Poll from "./Poll";

class Polls extends React.Component {
    constructor() {
        super();

        this.state = {
            status: "loaded"
        };

        _.bindAll(this, "resetState", "createPoll", "creatingPoll")
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
                                return <Poll key={_.get(poll, "_id")} poll={poll} loginData={_.get(this, "props.loginData")}/>
                            }).value()
                        }</div>
                    </div>
                </div>,
            },
            {
                s: "creandopoll",
                polls: _.negate(_.isEmpty),
                returns: <div className="pollscontents">
                    <div key="pollscontroles">
                        <p><span>
                            <input type="text" ref="pollnametxt"/>
                            <button onClick={this.createPoll}>crear nueva votacion</button>
                        </span></p>
                        <div className="pollslist">{
                            _.chain(this).get("props.polls").map(poll => {
                                return <Poll key={_.get(poll, "_id")} poll={poll}/>
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
        const pollname = _.get(this, "refs.pollnametxt.value");
        const userid = _.get(this, "props.loginData.authResponse.userID");

        socketEmit("createpoll", {name: pollname, userid: userid});

        this.resetState();
    }

    resetState() {
        this.setState({status: "loaded"});
    }
}

export default Polls;