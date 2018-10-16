import React from "react";
import _ from './mixins';
import {socketEmit} from './api';
import Members from "./Members";
import {connect} from 'react-redux';

class Reto extends React.Component {
    constructor() {
        super();

        this.state = {
            status: "loaded"
        };

        _.bindAll(this, "Asignar", "setReto", "Delete", "deleteReto", "resetState")
    }

    render() {
        let status = this.state.status;
        let reto = _.get(this, "props.reto", <span>no asignado <button onClick={this.Asignar}>asignar</button></span>);
        let isAdmin = _.includes(_.get(this, "props.userData.permissions"), "any");

        return _.ruleMatch({s: status}, [
            {
                s: "loading",
                returns: <p><span>...</span></p>
            },
            {
                s: "loaded",
                returns: <div>
                    <div className={"bloquereto"}>
                        <h2>{_.get(reto, "name", "no asignado")}</h2>
                        <p><span>reto actual</span></p>
                        {isAdmin ? <span>
                            <button onClick={this.Asignar}>reasignar</button>
                            <button onClick={this.Delete}>eliminar</button>
                        </span> : null}
                    </div>
                    <div className={"retoscontent"}>
                        <Members members={this.props.members} loginData={_.get(this, "props.loginData")}/>
                    </div>
                </div>
            },
            {
                s: "asignando",
                returns: <p><span>
                    nombre: <input type="text" ref="retoNameInput"/>,&nbsp;
                    a eleccion: <input type="checkbox" ref="tossedCheck"/>&nbsp;
                    <button onClick={this.setReto}>asignar</button>
                  </span></p>
            },
            {
                s: "eliminando",
                returns: (
                    <div>
                        <p><span>Al eliminar el reto actual tambien se perderan todos los personajes y miembros asociados.</span>
                        </p>
                        <p><span>Al eliminarse el reto actual se mostrará la información del reto anterior, aunque no es necesario eliminar para crear un nuevo reto.</span>
                        </p>
                        <p><span>
                            <button onClick={this.deleteReto}>confirmar</button>
                            <button onClick={this.resetState}>cancelar</button>
                        </span></p>
                    </div>
                )
            },
            {
                returns: <span>error</span>
            }
        ]);
    }

    Asignar() {
        this.setState({status: "asignando"})
    }

    setReto() {
        let reto = _.get(this, "refs.retoNameInput.value");
        let tossed = !_.get(this, "refs.tossedCheck.value", true);
        const userid = _.get(this, "props.userData.id");

        socketEmit("createreto", {name: reto, userid, tossed});

        this.resetState();
    }

    Delete() {
        this.setState({status: "eliminando"})
    }

    deleteReto() {
        const userid = _.get(this, "props.userData.id");

        socketEmit("deletelastreto", {userid});

        this.resetState();
    }

    resetState() {
        this.setState({status: "loaded"});
    }
}

export default connect(state => state)(Reto);