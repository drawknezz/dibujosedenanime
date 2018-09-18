import React, {Component} from 'react';
import Member from './Member';
import _ from './mixins';
import {socketEmit} from './api';

class Members extends Component {
    constructor() {
        super();

        this.state = {
            status: "loaded",
            filtro: /./
        };

        _.bindAll(this, "createMember", "resetStatus", "sendNewMember", "filterMembers", "unassignedFilterChange", "checkInput")
    }

    render() {
        let self = this;
        let members = this.props.members;
        let hasMembers = !_.isEmpty(members);

        return _.ruleMatch({
            s: this.state.status
        }, [
            {
                s: "loading",
                returns: (
                    <div className="bloque">
                        <div className="charsList">
                            <span>...</span>
                        </div>
                    </div>
                )
            },
            {
                s: "agregando",
                returns: (
                    <div className="bloque">
                        <div className="controles">
                            <label>nombre: <input ref="memberNameTxt" onChange={this.checkInput} defaultValue={_.get(this, "props.loginData.username")}/></label>
                            <button onClick={this.sendNewMember} disabled={_.get(this, "state.invalidInput")}>agregar</button>
                            <button onClick={this.resetStatus}>cancelar</button>
                        </div>

                        <div className={"membersList " + (hasMembers ? "" : "empty")}>{
                            (hasMembers ?
                                _.chain(members)
                                    .filter(member => self.state.filtro.test(member.name))
                                    .filter(member => {
                                        return _.get(self, "state.filterunassigned") ? (member.assignedTo ? false : member) : member;
                                    })
                                    .sortBy(m => m.name.toLowerCase())
                                    .map((member) => {
                                        return (<Member key={member._id} name={member.name} id={member._id}
                                                        char={member.assignedTo} disabled={true}/>)
                                    }).value()
                                : <p><span>No hay miembros asociados al reto actual...</span></p>)
                        }
                        </div>
                    </div>
                )
            },
            {
                s: "loaded",
                returns: (
                    <div className="bloque">
                        <div className="controles">
                            <button onClick={this.createMember}>agregar miembro</button>
                            <p>
                                <span><input type="checkbox" checked={this.state.checked} ref="unassignedonlycheck"
                                             onChange={this.unassignedFilterChange}/> solo no asignados</span>
                            </p>
                        </div>

                        <label>filtrar: <input type="text" ref="membersFilterTxt"
                                               value={_.get(this, "state.filterTxt", "")}
                                               onChange={this.filterMembers}/></label>

                        <div className={"membersList " + (hasMembers ? "" : "empty")}>{
                            (hasMembers ?
                                _.chain(members)
                                    .filter(member => self.state.filtro.test(member.name))
                                    .filter(member => {
                                        return _.get(self, "state.filterunassigned") ? (member.assignedTo ? false : member) : member;
                                    })
                                    .sortBy(m => m.name.toLowerCase())
                                    .map((member) => {
                                        return (<Member key={member._id} name={member.name} id={member._id}
                                                        char={member.assignedTo}/>)
                                    }).value()
                                : <p><span>No hay miembros asociados al reto actual...</span></p>)
                        }
                        </div>
                    </div>
                )
            }
        ]);
    }

    checkInput() {
        let name = _.get(this, "refs.memberNameTxt.value");
        this.setState({invalidInput: /[-?()^+]/.test(name)})
    }

    createMember() {
        this.setState({status: "agregando"})
    }

    resetStatus() {
        this.setState({status: "loaded", invalidInput: false})
    }

    sendNewMember() {
        let name = _.get(this, "refs.memberNameTxt.value");

        socketEmit("createmember", {name: name});

        this.resetStatus();
    }

    filterMembers() {
        let input = _.get(this, "refs.membersFilterTxt.value");

        this.setState({filterTxt: input, filtro: new RegExp(input, "i")})
    }

    unassignedFilterChange() {
        this.setState({filterunassigned: !_.get(this, "state.filterunassigned", false)})
    }
}

export default Members;