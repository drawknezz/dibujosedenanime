import React from 'react';
import _ from './mixins';
import {socketEmit} from './api';
import ReactCSSReplace from 'react-css-transition-replace';
import Poll from "./Poll";
import {connect} from 'react-redux';

class Polls extends React.Component {
    constructor() {
        super();

        this.state = {
            status: "loaded"
        };

        _.bindAll(this, "resetState", "createPoll", "creatingPoll", "checkInput")
    }

    render() {
        let status = this.state.status;
        let isAdmin = _.includes(_.get(this, "props.userData.permissions"), "any");

        return _.ruleMatch({
            s: status,
            ud: _.get(this, "props.userData"),
            admin: isAdmin,
            polls: _.get(this, "props.polls")
        }, [
            {
                polls: _.isEmpty,
                admin: _.negate(Boolean),
                returns: <div className="pollscontents">
                    <p><span>
                        nadie ha creado votaciones todavia...
                    </span></p>
                </div>
            },

            {
                s: "loaded",
                returns: <div className="pollscontents">
                    <h4>votaciones (beta)</h4>
                    <div key="pollscontroles">
                        {isAdmin && <p><span><button onClick={this.creatingPoll}>crear nueva votacion</button></span>
                        </p>}
                        <div className="pollslist">{
                            _.chain(this).get("props.polls").map(poll => {
                                return <Poll key={_.get(poll, "_id")} poll={poll}
                                             loginData={_.get(this, "props.loginData")}/>
                            }).value()
                        }</div>
                    </div>
                </div>,
            },
            {
                s: "creandopoll",
                returns: <div className="pollscontents">
                    <div key="pollscontroles">
                        <p><span>
                            <input type="text" ref="pollnametxt" onChange={this.checkInput}/>
                            <button onClick={this.createPoll} disabled={_.get(this, "state.invalidInput", true)}>crear nueva votacion</button>
                        </span></p>
                        <div className="pollslist">{
                            _.chain(this).get("props.polls").map(poll => {
                                return <Poll key={_.get(poll, "_id")} poll={poll}
                                             loginData={_.get(this, "props.loginData")}/>
                            }).value()
                        }</div>
                    </div>
                </div>,
            },
            {
                returns: <div className="pollscontents">...</div>,
            }
        ]);
    }

    creatingPoll() {
        this.setState({status: "creandopoll"});
    }

    checkInput() {
        let name = _.get(this, "refs.pollnametxt.value");
        this.setState({invalidInput: _.isEmpty(name)})
    }

    createPoll() {
        const pollname = _.get(this, "refs.pollnametxt.value");
        const userid = _.get(this, "props.userData.id");

        socketEmit("createpoll", {name: pollname, userid: userid});

        this.resetState();
    }

    resetState() {
        this.setState({status: "loaded"});
    }
}

export default connect((state) => state)(Polls);