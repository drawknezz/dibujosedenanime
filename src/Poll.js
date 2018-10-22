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

        _.bindAll(this, "createEntry", "creatingEntry", "deletePoll", "closePoll", "activatePoll", "voteEntry", "deleteEntry", "checkInput", "resetState")
    }

    render() {
        const entries = _.chain(this).get("props.poll.entries").sortBy(a => -_.get(a, "votes.length", 0)).value();
        const higherVotes = _.chain(entries).map("votes.length").sortBy(a => a).last().dflt(1).value();
        const totalVotes = _.chain(entries).map("votes.length").reduce((a, b) => a + b).dflt(0).value();
        const isAdmin = _.includes(_.get(this, "props.userData.permissions"), "any");

        const pollActive = _.get(this, "props.poll.status") !== "closed";
        const entriesdom = _.chain(entries)
            .assert(pollActive, _.identity, _.first)
            .ensureArray()
            .map(entry =>
                <div className="entry" key={_.get(entry, "_id")}>
                    <div className="meter" onClick={pollActive ? this.voteEntry(_.get(entry, "_id"), _.get(this, "props.poll._id")) : null}>
                        <span className="entryname"><strong>{_.get(entry, "name")}</strong></span>
                        <span className="pollentrybar" style={{width: `${_.get(entry, "votes.length", 1) * 100 / higherVotes}%`}}/>
                    </div>
                    {pollActive ?
                        <div className="entrybtns">
                            {pollActive && isAdmin && <a onClick={this.deleteEntry(_.get(entry, "_id"), _.get(this, "props.poll._id"))}>⛔</a>}
                        </div>
                    :null}
                </div>)
            .value();

        const userNames = _.chain(this).get("props.poll.entries").map("votes").flatten().map("username").flatten()
            .map(name => {
                let fullname = _.get(name, "name");
                return _.chain(fullname).words().first().assert(txt => txt.length > 3, _.identity, fullname).dflt("anon").value();
            })
            .join(", ")
            .value();

        const usernamesdom = _.gt(userNames.length, 0) ? <p className={"pollUserNames"}><span><strong>usuarios: </strong> {userNames}</span></p> : null;

        return _.ruleMatch({st: _.get(this, "state.status")}, [
            {
                st: "addingentry",
                returns: (
                    <div className="poll">
                        <p><span>{_.get(this, "props.poll.name", "unnamed")}
                            {` (${totalVotes} ${_.gt(totalVotes, 1) || _.eq(totalVotes, 0) ? "votos" : "voto"})`}
                            {pollActive ? "" : " (cerrada)"}</span></p>
                        {usernamesdom}
                        <div className="entries">{entriesdom}</div>
                        <p>
                        <span>
                            <input type="text" ref="nametxt" onChange={this.checkInput}/>
                            <button onClick={this.createEntry}
                                    disabled={_.get(this, "state.invalidInput", true)}>aceptar</button>
                            <button onClick={this.resetState}>cancelar</button>
                        </span>
                        </p>
                    </div>
                )
            },
            {
                returns: (
                    <div className={"poll " + (pollActive ? "open" : "closed")}>
                        <p><span>{_.get(this, "props.poll.name", "unnamed")}
                            {` (${totalVotes} ${_.gt(totalVotes, 1) || _.eq(totalVotes, 0) ? "votos" : "voto"})`}
                            {pollActive ? "" : " (cerrada)"}</span></p>
                        {usernamesdom}
                        <div className="entries">{
                            [entriesdom, pollActive ? null : <div key="entriesrest">
                                <p className="hiddenEntries">
                                    <i>{_.chain(entries).tail().map(e => {
                                        return `${e.name} (${_.get(e, "votes.length")})`
                                    }).join(", ").value()}</i>
                                </p>
                            </div>]
                        }</div>
                        <p>
                        <span>
                            {pollActive && <button onClick={this.creatingEntry}>agregar opcion</button>}
                            {isAdmin && (pollActive ?
                                    <button onClick={this.closePoll}>cerrar votacion</button>
                                    : <button onClick={this.activatePoll}>activar votacion</button>
                            )}
                            {isAdmin && <button onClick={this.deletePoll}>eliminar votacion</button>}
                        </span>
                        </p>
                    </div>
                )
            }
        ])
    }

    creatingEntry() {
        this.setState({status: "addingentry"});
    }

    checkInput() {
        let name = _.get(this, "refs.nametxt.value");
        this.setState({invalidInput: _.isEmpty(name)})
    }

    createEntry() {
        const userid = _.get(this, "props.userData.id");
        const pollid = _.get(this, "props.poll._id");
        const name = _.get(this, "refs.nametxt.value");

        console.log("createpollentry::socketemit");
        socketEmit("createpollentry", {name: name, pollid: pollid, userid: userid});

        this.resetState();
    }

    voteEntry(entryid, pollid) {
        return function () {
            const userid = _.get(this, "props.userData.id");

            if (!userid) _.attemptBound(this, "props.login");

            socketEmit("voteentry", {entryid: entryid, pollid: pollid, userid: userid});
        }.bind(this);
    }

    deleteEntry(entryid, pollid) {
        return function () {
            const userid = _.get(this, "props.userData.id");

            if (!userid) _.attemptBound(this, "props.login");

            socketEmit("deleteentry", {entryid: entryid, pollid: pollid, userid: userid});
        }.bind(this);
    }

    deletePoll() {
        const userid = _.get(this, "props.userData.id");
        const pollid = _.get(this, "props.poll._id");
        socketEmit("deletepoll", {pollid: pollid, userid: userid});
    }

    closePoll() {
        const userid = _.get(this, "props.userData.id");
        const pollid = _.get(this, "props.poll._id");
        socketEmit("closepoll", {pollid: pollid, userid: userid});
    }

    activatePoll() {
        const userid = _.get(this, "props.userData.id");
        const pollid = _.get(this, "props.poll._id");
        socketEmit("activatepoll", {pollid: pollid, userid: userid});
    }

    resetState() {
        this.setState({status: "loaded"})
    }
}

export default connect(state => state, dispatch => ({login: () => dispatch(login())}))(Poll);