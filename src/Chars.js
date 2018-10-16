import React, {Component} from 'react';
import Char from './Char';
import _ from './mixins';
import {socketEmit} from './api';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import {connect} from 'react-redux'

class Chars extends Component {
    constructor() {
        super();

        this.state = {
            status: "loaded"
        };

        _.bindAll(this, "createChar", "sendNewChar", "resetStatus", "createMany", "updateManyCharsInfo", "sendManyChars");
    }

    render() {
        let chars = _.get(this, "props.chars", []);
        let isAdmin = _.includes(_.get(this, "props.userData.permissions"), "any");

        return _.ruleMatch({
            s: this.state.status,
            admin: isAdmin
        }, [
            {
                s: "loading",
                returns: (
                    <div className="personajes">
                        <div className="charsList">
                            <span>...</span>
                        </div>
                    </div>
                )
            },
            {
                s: "agregando",
                returns: (
                    <div className="bloque pad">
                        <div className="controles">
                            <label>nombre: <input ref="charNameTxt"/></label>
                            <label>serie: <input ref="charSerieTxt"/></label>
                            <button onClick={this.sendNewChar}>agregar</button>
                            <button onClick={this.resetStatus}>cancelar</button>
                        </div>

                        <ReactCSSTransitionGroup
                            component="div"
                            className={"charsList " + (_.isEmpty(chars) ? "empty" : "")}
                            transitionName="membertransition"
                            transitionEnterTimeout={300}
                            transitionLeaveTimeout={200}
                        >{
                            _.chain(chars)
                                .sortBy(m => _.toLower(_.get(m, "name", "")))
                                .map(char => {
                                    return (<Char key={char._id} name={char.name} serie={char.serie} id={char._id}
                                                  dis={true} member={char.assignedTo}/>)
                                }).value()
                        }</ReactCSSTransitionGroup>
                    </div>
                )
            },

            {
                s: "agregandomany",
                returns: (
                    <div className="bloque pad">
                        <div className="controles">
                            <p><span>Agrega cada personaje separado por coma, con este formato: "nombre:serie"</span>
                            </p>

                            <p>nombres:</p>
                            <p><textarea ref="manyNamesTxt" onChange={this.updateManyCharsInfo}/></p>
                            <ReactCSSTransitionGroup
                                component="div"
                                className={"manychars " + (_.isEmpty(chars) ? "empty" : "")}
                                transitionName="membertransition"
                                transitionEnterTimeout={300}
                                transitionLeaveTimeout={200}
                            >{
                                _.chain(this).get("state.manychars").map((c, i) =>
                                    <div className="manyCharsEl" key={i}>
                                        <p><span className="manyCharsName"><strong>{c.name}</strong></span></p>
                                        <p><span className="manyCharsSerie">{c.serie}</span></p>
                                    </div>).value()
                            }</ReactCSSTransitionGroup>
                            <p>
                                <button onClick={this.sendManyChars}>agregar ({_.get(this, "state.manychars.length")})
                                </button>
                                <button onClick={this.resetStatus}>cancelar</button>
                            </p>

                        </div>

                        <ReactCSSTransitionGroup
                            component="div"
                            className={"charsList " + (_.isEmpty(chars) ? "empty" : "")}
                            transitionName="membertransition"
                            transitionEnterTimeout={300}
                            transitionLeaveTimeout={200}
                        >{
                            _.chain(chars)
                                .sortBy(m => _.toLower(_.get(m, "name", "")))
                                .map(char => {
                                    return (<Char key={char._id} name={char.name} serie={char.serie} id={char._id}
                                                  dis={true} member={char.assignedTo}/>)
                                }).value()
                        }</ReactCSSTransitionGroup>
                    </div>
                )
            },

            {
                s: "loaded",
                returns: (
                    <div className="bloque pad">
                        {isAdmin ? <div className="controles">
                            <button onClick={this.createChar}>agregar personaje</button>
                            <button onClick={this.createMany}>agregar varios</button>
                        </div> : null}

                        <ReactCSSTransitionGroup
                            component="div"
                            className={"charsList " + (_.isEmpty(chars) ? "empty" : "")}
                            transitionName="membertransition"
                            transitionEnterTimeout={300}
                            transitionLeaveTimeout={200}
                        >{
                            (
                                _.isEmpty(chars) ?
                                    <p><span>No hay personajes asociados al reto actual...</span></p> :
                                    _.chain(chars)
                                        .sortBy(m => _.toLower(_.get(m, "name", "")))
                                        .map(char => {
                                            return (
                                                <Char key={char._id} name={char.name} serie={char.serie} id={char._id}
                                                      member={char.assignedTo}/>)
                                        }).value()
                            )

                        }</ReactCSSTransitionGroup>
                    </div>
                )
            }

        ]);
    }

    createChar() {
        this.setState({status: "agregando"})
    }

    updateManyCharsInfo() {
        let input = _.get(this, "refs.manyNamesTxt.value", "");
        let charsInput = input.match(/([^,:]+:[^,:]+),?/ig);
        let manychars = _.map(charsInput, c => {
            return _.regGroups(c, "(?<name>[^,:]+):(?<serie>[^,:]+)", "i")
        });

        this.setState({manychars: manychars});
    }

    createMany() {
        this.setState({status: "agregandomany"})
    }

    sendNewChar() {
        let name = _.get(this, "refs.charNameTxt.value");
        let serie = _.get(this, "refs.charSerieTxt.value");
        const userid = _.get(this, "props.userData.id");


        socketEmit("createchar", {name: name, serie: serie, userid});
        this.resetStatus();
    }

    sendManyChars() {
        let chars = _.get(this, "state.manychars");
        const userid = _.get(this, "props.userData.id");

        socketEmit("createmanychars", {chars: chars, userid});

        this.resetStatus();
    }

    resetStatus() {
        this.setState({status: "loaded", manychars: []});
    }
}

export default connect(state => state)(Chars);