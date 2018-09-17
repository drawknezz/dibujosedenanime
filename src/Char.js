import React, {Component} from 'react';
import _ from './mixins';
import {socketEmit} from './api';

class Char extends Component {
    constructor() {
        super();

        this.state = {status: "loaded"};

        _.bindAll(this, "deleteChar", "assigning", "assignRandom", "unassign", "resetState", "unassigning", "deleting");
    }

    render() {
        let name = this.props.name;
        let serie = this.props.serie;
        let member = this.props.member;
        let closeBtn = <img src="/close.svg" alt="eliminar" onClick={this.deleting}/>;

        return _.ruleMatch({
            s: _.get(this, "state.status")
        }, [
            {
                s: "asignando",
                returns: (
                    <div className="char">
                        <p className="charName"><span><strong>{name}</strong></span></p>
                        <p className="serieName"><span>{serie}</span></p>
                        <p className="assignedMember"><span><i><strong>asignando...</strong></i>, clave:
              <input type="password" ref="claveInput"/> <a onClick={this.assignRandom}>asignar</a> / <a
                                onClick={this.resetState}>cancelar</a>
            </span></p>
                    </div>
                )
            },

            {
                s: "desasignando",
                returns: (
                    <div className="char">
                        <p className="charName"><span><strong>{name}</strong></span></p>
                        <p className="serieName"><span>{serie}</span></p>
                        <p className="assignedMember"><span><i><strong>desasignando...</strong></i>, clave:
              <input type="password" ref="claveInput"/> <a onClick={this.unassign}>desasignar</a> / <a
                                onClick={this.resetState}>cancelar</a>
            </span></p>
                    </div>
                )
            },

            {
                s: "borrando",
                returns: (
                    <div className="char">
                        <p className="charName"><span><strong>{name}</strong></span></p>
                        <p className="serieName"><span>{serie}</span></p>
                        <p className="assignedMember"><span><i><strong>borrando...</strong></i>, clave:
              <input type="password" ref="claveInput"/> <a onClick={this.deleteChar}>borrar</a> / <a
                                onClick={this.resetState}>cancelar</a>
            </span></p>
                    </div>
                )
            },

            {
                returns: (
                    <div className={"char " + (member ? "asignado" : "")}>
                        {_.assertSelf(this.props.dis, null, closeBtn)}
                        <p className="charName"><span><strong>{name}</strong></span></p>
                        <p className="serieName"><span>{serie}</span></p>
                        <p className="assignedMember"><span>asignado a: {member ?
                            <span>{member} <a onClick={this.unassigning}>desasignar</a></span> :
                            <a onClick={this.assigning}>asignar al azar</a>}</span></p>
                    </div>
                )
            }
        ]);
    }

    deleting() {
        this.setState({status: "borrando"})
    }

    deleteChar() {
        let id = this.props.id;
        let pass = _.get(this, "refs.claveInput.value");

        socketEmit("deletechar", {id: id, pass: pass});

        this.resetState();
    }

    assigning() {
        this.setState({status: "asignando"})
    }

    assignRandom() {
        let id = _.get(this, "props.id");
        let clave = _.get(this, "refs.claveInput.value");

        socketEmit("assignmembertochar", {id: id, pass: clave});

        this.resetState();
    }

    unassigning() {
        this.setState({status: "desasignando"})
    }

    unassign() {
        let id = this.props.id;
        let clave = _.get(this, "refs.claveInput.value");

        socketEmit("unassignchar", {id: id, pass: clave});

        this.resetState();
    }

    resetState() {
        this.setState({status: "loaded"})
    }
}

export default Char;