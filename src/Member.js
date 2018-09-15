import React, {Component} from 'react';
import _ from './mixins';
import { socketEmit } from "./api";

class Member extends Component {
    constructor() {
        super();

        this.state = {status: "loaded"};

        _.bindAll(this, "deleteMember", "deleting", "resetState", "assigning", "assignRandom", "unassigning", "unassign");
    }

    render() {
        let name = this.props.name;
        let char = this.props.char;
        let closeBtn = <img src="https://cdn.glitch.com/e9b1b061-2e35-470e-9030-066922389a46%2Fdelete.svg?1536087131015"
                            alt="eliminar"
                            onClick={this.deleting}/>;

        return _.ruleMatch({s: _.get(this, "state.status")}, [
            {
                s: "borrando",
                returns: (
                    <div className="member">
                        <p className="memberName"><span><strong>borrando...<i>{name}</i></strong>, clave: </span></p>
                        <p><input type="password" ref="inputClave"/></p>
                        <p><a onClick={this.deleteMember}>eliminar</a> / <a onClick={this.resetState}>cancelar</a></p>
                    </div>
                )
            },

            {
                s: "asignando",
                returns: (
                    <div className="member">
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
                    <div className="member">
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
                returns: (
                    <div className="member">
                        {_.assertSelf(this.props.dis, null, closeBtn)}
                        <p className="memberName"><span><strong>{name}</strong></span></p>
                        <p className="charname"><span>personaje: {char ?
                            <span>{char} <a onClick={this.unassigning}>desasignar</a></span> :
                            <a onClick={this.assigning}>asignar al azar</a>}</span></p>
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
        let pass = _.get(this, "refs.inputClave.value");

        socketEmit("deletemember", {id: id, pass: pass} );

        this.resetState();
    }

    assigning() {
        this.setState({status: "asignando"})
    }

    assignRandom() {
        let id = _.get(this, "props.id");
        let clave = _.get(this, "refs.claveInput.value");

        socketEmit("assignchartomember", {id: id, pass: clave} );

        this.resetState();
    }

    unassigning() {
        this.setState({status: "desasignando"})
    }

    unassign() {
        let id = this.props.id;
        let clave = _.get(this, "refs.claveInput.value");

        socketEmit("unassignmember", { id: id, pass: clave} );

        this.resetState();
    }

    resetState() {
        this.setState({status: "loaded"})
    }
}

export default Member;