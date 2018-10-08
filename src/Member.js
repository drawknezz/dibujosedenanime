import React, {Component} from 'react';
import _ from './mixins';
import { socketEmit } from "./api";
import {connect} from 'react-redux';

class Member extends Component {
    constructor() {
        super();

        this.state = {status: "loaded"};

        _.bindAll(this, "deleteMember", "deleting", "resetState", "assigning", "assignRandom", "unassigning", "unassign");
    }

    render() {
        let name = this.props.name;
        let char = this.props.char;
        let isAdmin = _.includes(_.get(this, "props.userData.permissions"), "any");
        let closeBtn = isAdmin? <img src="https://cdn.glitch.com/e9b1b061-2e35-470e-9030-066922389a46%2Fdelete.svg?1536087131015"
                            alt="eliminar"
                            onClick={this.deleteMember}/> : null;

        return _.ruleMatch({s: _.get(this, "state.status"), admin: isAdmin}, [
            {
                s: "borrando",
                returns: (
                    <div className={"member " + (char ? "asignado" : "")}>
                        <p className="memberName"><span><strong>borrando...<i>{name}</i></strong>, clave: </span></p>
                        <p><input type="password" ref="inputClave"/></p>
                        <p><a onClick={this.deleteMember}>eliminar</a> / <a onClick={this.resetState}>cancelar</a></p>
                    </div>
                )
            },

            {
                s: "asignando",
                returns: (
                    <div className={"member " + (char ? "asignado" : "")}>
                        {_.assertSelf(this.props.dis, null, closeBtn)}
                        <p className="memberName"><span><strong>{name}</strong></span></p>
                        <p className="charname"><span>personaje: <i>asignando</i>{char} clave:
                            <input type="password" ref="claveInput"/>
                            <a onClick={this.assignRandom}>asignar</a> / <a onClick={this.resetState}>cancelar</a>
                        </span></p>
                    </div>
                )
            },

            {
                s: "desasignando",
                returns: (
                    <div className={"member " + (char ? "asignado" : "")}>
                        {_.assertSelf(this.props.dis, null, closeBtn)}
                        <p className="memberName"><span><strong>{name}</strong></span></p>
                        <p className="charname">
                            <span>personaje: <i>asignando</i>{char} clave:
                                <input type="password" ref="claveInput"/>
                                <a onClick={this.unassign}>desasignar</a> / <a onClick={this.resetState}>cancelar</a>
                            </span>
                        </p>
                    </div>
                )
            },

            {
                admin: true,
                returns: (
                    <div className={"member " + (char ? "asignado" : "")}>
                        {_.assertSelf(this.props.dis, null, closeBtn)}
                        <p className="memberName"><span><strong>{name}</strong></span></p>
                        <p className="charname"><span>personaje: {char ?
                            <span>{char} <a onClick={this.unassign}>desasignar</a></span> :
                            <a onClick={this.assignRandom}>asignar al azar</a>}</span></p>
                    </div>
                )
            },

            {
                returns: (
                    <div className={"member " + (char ? "asignado" : "")}>
                        {_.assertSelf(this.props.dis, null, closeBtn)}
                        <p className="memberName"><span><strong>{name}</strong></span></p>
                        <p className="charname"><span>personaje: {char}</span></p>
                    </div>
                )
            }
        ]);
    }

    deleting() {
        this.setState({status: "borrando"})
    }

    deleteMember() {
        let id = _.get(this, "props.id");
        const userid = _.get(this, "props.userData.id");

        socketEmit("deletemember", {id, userid} );

        this.resetState();
    }

    assigning() {
        this.setState({status: "asignando"})
    }

    assignRandom() {
        let id = _.get(this, "props.id");
        const userid = _.get(this, "props.userData.id");

        socketEmit("assignchartomember", {id, userid} );

        this.resetState();
    }

    unassigning() {
        this.setState({status: "desasignando"})
    }

    unassign() {
        let id = this.props.id;
        const userid = _.get(this, "props.userData.id");

        socketEmit("unassignmember", { id, userid} );

        this.resetState();
    }

    resetState() {
        this.setState({status: "loaded"})
    }
}

export default connect(state => state)(Member);