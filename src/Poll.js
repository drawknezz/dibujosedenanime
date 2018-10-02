import React from 'react';
import _ from './mixins';
import {socketEmit} from './api';
import ReactCSSReplace from 'react-css-transition-replace';
import {connect} from 'react-redux';
import {login} from "./actions/index";

class Poll extends React.Component {
    constructor() {
        super();

        this.state = {
            status: "loaded"
        };

        _.bindAll(this, "createEntry", "creatingEntry", "deletePoll", "voteEntry", "resetState")
    }

    render() {
        const entries = _.chain(this).get("props.poll.entries").sortBy(a => -_.get(a, "votes.length", 0)).value();
        const higherVotes = _.chain(entries).map("votes.length").sortBy(a => a).last().dflt(1).value();
        const isAdmin = _.includes(_.get(this, "props.userData.permissions"), "any");

        return _.ruleMatch({st: _.get(this, "state.status")}, [
            {
                st: "addingentry",
                returns: (
                    <div className="poll">
                        <p><span>{_.get(this, "props.poll.name", "unnamed")}</span></p>
                        <div className="entries">
                            {
                                _.chain(entries)
                                    .map(entry => <div className="entry" key={_.get(entry, "_id")}>{
                                        <span>
                                            <strong>{_.get(entry, "name")}</strong>&nbsp;&nbsp;&nbsp;
                                            {_.get(entry, "votes.length")} votos&nbsp;
                                            <a onClick={this.voteEntry(_.get(entry, "_id"), _.get(this, "props.poll._id"))}>votar</a>
                                        </span>
                                    }</div>)
                                    .value()
                            }
                        </div>
                        <p>
                        <span>
                            <input type="text" ref="nametxt"/>
                            <button onClick={this.createEntry}>aceptar</button>
                            <button onClick={this.resetState}>cancelar</button>
                        </span>
                        </p>
                    </div>
                )
            },
            {
                returns: (
                    <div className="poll">
                        <p><span>{_.get(this, "props.poll.name", "unnamed")}</span></p>
                        <div className="entries">
                            {
                                _.chain(entries)
                                    .map(entry => <div className="entry" key={_.get(entry, "_id")}>
                                        <span className="entryname"><strong>{_.get(entry, "name")}</strong></span>
                                        <div className="meter">
                                            <span style={{width: `${_.get(entry, "votes.length", 1) * 100 / higherVotes}%`}}/>
                                        </div>
                                        <a className="entrybtns" onClick={this.voteEntry(_.get(entry, "_id"), _.get(this, "props.poll._id"))}>votar</a>
                                    </div>)
                                    .value()
                            }
                        </div>
                        <p>
                        <span>
                            <button onClick={this.creatingEntry}>agregar opcion</button>
                            {isAdmin && <button onClick={this.deletePoll}>eliminar votacion</button>}
                        </span>
                        </p>
                    </div>
                )
            }
        ])
    }

    creatingEntry() {
        console.log("creating entry :0");
        this.setState({status: "addingentry"});
    }

    createEntry() {
        const userid = _.get(this, "props.userData.id");
        const pollid = _.get(this, "props.poll._id");
        const name = _.get(this, "refs.nametxt.value");

        socketEmit("createpollentry", {name: name, pollid: pollid, userid: userid});

        this.resetState();
    }

    voteEntry(entryid, pollid) {
        return function() {
            const userid = _.get(this, "props.userData.id");

            if(!userid) _.attemptBound(this, "props.login");

            socketEmit("voteentry", {entryid: entryid, pollid: pollid, userid: userid});
        }.bind(this);
    }

    deletePoll() {
        const userid = _.get(this, "props.userData.id");
        const pollid = _.get(this, "props.poll._id");
        socketEmit("deletepoll", {pollid: pollid, userid: userid});
    }

    resetState() {
        this.setState({status: "loaded"})
    }
}

export default connect(state => state, dispatch => ({login: () => dispatch(login())}))(Poll);