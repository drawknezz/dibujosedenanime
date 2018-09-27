import React from 'react';
import _ from './mixins';
import {socketEmit} from './api';
import ReactCSSReplace from 'react-css-transition-replace';

class Poll extends React.Component {
    constructor() {
        super();

        this.state = {
            status: "loaded"
        };

        _.bindAll(this, "createEntry", "creatingEntry", "deletePoll", "voteEntry", "resetState")
    }

    render() {
        return _.ruleMatch({st: _.get(this, "state.status")}, [
            {
                st: "addingentry",
                returns: (
                    <div className="poll">
                        <p><span>{_.get(this, "props.poll.name", "unnamed")}</span></p>
                        <div className="entries">
                            {
                                _.chain(this).get("props.poll.entries")
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
                                _.chain(this).get("props.poll.entries")
                                    .map(entry => <div className="entry" key={_.get(entry, "_id")}>
                                        <span className="entryname"><strong>{_.get(entry, "name")}</strong></span>
                                        <span className="entryvotes">{_.get(entry, "votes.length")} votos&nbsp;</span>
                                        <a className="entrybtns" onClick={this.voteEntry(_.get(entry, "_id"), _.get(this, "props.poll._id"))}>votar</a>
                                    </div>)
                                    .value()
                            }
                        </div>
                        <p>
                        <span>
                            <button onClick={this.creatingEntry}>agregar opcion</button>
                            <button onClick={this.deletePoll}>eliminar votacion</button>
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
        const userid = _.get(this, "props.loginData.authResponse.userID");
        const pollid = _.get(this, "props.poll._id");
        const name = _.get(this, "refs.nametxt.value");

        socketEmit("createpollentry", {name: name, pollid: pollid, userid: userid});

        this.resetState();
    }

    voteEntry(entryid, pollid) {
        return () => {
            const userid = _.get(this, "props.loginData.authResponse.userID");
            socketEmit("voteentry", {entryid: entryid, pollid: pollid, userid: userid});
        }
    }

    deletePoll() {
        console.log("deleting")
    }

    resetState() {
        this.setState({status: "loaded"})
    }
}

export default Poll;