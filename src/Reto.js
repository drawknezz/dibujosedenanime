import React from "react";
import _ from './mixins';
import {socketEmit} from './api';

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

        return _.ruleMatch({s: status}, [
            {
                s: "loading",
                returns: <p><span>reto actual: "..."</span></p>
            },
            {
                s: "loaded",
                returns: <div className={"bloquereto"}>
                    <h2>{_.get(reto, "name", "no asignado")}</h2>
                    <p><span>reto actual</span></p>
                    <span>
                        <button onClick={this.Asignar}>reasignar</button>
                        <button onClick={this.Delete}>eliminar</button>
                    </span>
                </div>
            },
            {
                s: "asignando",
                returns: <p><span>reto actual: <i>asignando...</i>, nombre:
                  <input type="text" ref="retoNameInput"/>,
                  clave: <input type="password" ref="retoPassInput"/>
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
                            clave: <input type="password" ref="retoPassInput"/>
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
        let pass = _.get(this, "refs.retoPassInput.value");

        socketEmit("createreto", {name: reto, pass: pass});

        this.resetState();
    }

    Delete() {
        this.setState({status: "eliminando"})
    }

    deleteReto() {
        let pass = _.get(this, "refs.retoPassInput.value");

        socketEmit("deletelastreto", {pass: pass});

        this.resetState();
    }

    resetState() {
        this.setState({status: "loaded"});
    }
}

export default Reto;