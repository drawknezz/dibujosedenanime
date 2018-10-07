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
            .map(entry => <div className="entry" key={_.get(entry, "_id")}>
                <span className="entryname"><strong>{_.get(entry, "name")}</strong></span>
                <div className="meter">
                    <span style={{width: `${_.get(entry, "votes.length", 1) * 100 / higherVotes}%`}}/>
                </div>
                <div className="entrybtns">
                    {pollActive &&
                    <a onClick={this.voteEntry(_.get(entry, "_id"), _.get(this, "props.poll._id"))}>👍</a>}&nbsp;
                    {pollActive && isAdmin && <a onClick={this.deleteEntry(_.get(entry, "_id"), _.get(this, "props.poll._id"))}>⛔</a>}
                </div>

            </div>)
            .value();

        const userNames = _.chain(this).get("props.poll.entries").map("votes").flatten().map("username").flatten()
            .map(name => {
                let fullname = _.get(name, "name");
                let showname = _.chain(fullname).words().first().assert(txt => txt.length > 3, _.identity, fullname).dflt("anon").value();
                return <span key={_.get(name, "_id")}>{showname}</span>
            })
            .value();

        const usernamesdom = _.gt(userNames.length, 0) ? <p className={"pollUserNames"}><span><strong>usuarios: </strong></span>{userNames}</p> : null;

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
                    <div className="poll">
                        <p><span>{_.get(this, "props.poll.name", "unnamed")}
                            {` (${totalVotes} ${_.gt(totalVotes, 1) || _.eq(totalVotes, 0) ? "votos" : "voto"})`}
                            {pollActive ? "" : " (cerrada)"}</span></p>
                        {usernamesdom}
                        <div className="entries">{entriesdom}</div>
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
        console.log("creating entry :0");
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