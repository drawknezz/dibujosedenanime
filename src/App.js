import React, {Component} from 'react';
import './App.css';
import _ from './mixins';
import Sorteo from './Sorteo';
import Reto from './Reto';
import Chars from './Chars';
import Members from './Members'
import {onSocket, socketEmit} from "./api";

class App extends Component {
    constructor() {
        super();

        this.state = {
            weekNum: 35
        };

        _.bindAll(this, "showMessage");
    }

    render() {
        let usercount = _.get(this, "state.usercount");

        return (
            <div>
                <header>
                    <h1 data-testid="pagetitle">
                        Dibujos eden anime <span role="img" aria-label="hearts">💕</span>
                    </h1>
                </header>

                {_.get(this, "state.messages") ? <div className="messages">
                    {
                        _.chain(this).get("state.messages").map(m =>
                            <div className={"message " + _.get(m, "cls", "")} key={_.get(m, "time")}>
                                <span>{_.get(m, "txt")}</span>
                            </div>
                        ).value()
                    }
                </div> : ""}

                <main>
                    <div className="bloque">
                        <p><span>Cabrxs agreguen su nombre presionando el boton <strong>Agregar miembro</strong>, tiene que ser el mismo con el que votan para que no haya malentendidos, y ojala el nombre no muy largo xd.</span>
                        </p>
                    </div>

                    <div className="bloque">
                        <Reto reto={this.state.reto}/>
                    </div>

                    <div className="bloque">
                        <Sorteo sorteo={this.state.sorteo}/>
                    </div>

                    <Members members={this.state.members}/>

                    <Chars chars={this.state.chars}/>
                </main>

                <footer>
                    <span>{usercount ? usercount + " personas conectadas" : ""} uwu</span>
                </footer>
            </div>
        )
    }

    updateAll(data) {
        console.log("allData response: ", data);
        this.setState({
            reto: _.get(data, "reto"),
            sorteo: _.get(data, "sorteo"),
            weekNum: _.get(data, "weekNum"),
            members: _.get(data, "members"),
            chars: _.get(data, "chars")
        })
    }

    showMessage(msg) {
        this.setState({
            messages: _.union(_.get(this, "state.messages", []), [{txt: msg, time: new Date().getTime()}])
        });
    }

    componentDidMount() {
        onSocket("update", () => this.updateAll());

        onSocket("usercount", a => {
            this.setState({usercount: a})
        });

        onSocket("allData", data => {
            console.log("received all data response :0");
            this.updateAll(data);
        });

        onSocket("msg", this.showMessage);
        onSocket("err", this.showMessage);

        socketEmit("allData");

        window.setInterval(() => {
            let newMessages = _.chain(this).get("state.messages").reject(m => _.get(m, "cls") === "dissapearing").map(m => {
                if (new Date().getTime() - m.time > 5000 ) {
                    return _.extend({}, m, {cls: "dissapearing"})
                }
                return m;
            }).value();

            this.setState({
                messages: newMessages
            });
        }, 1000);
    }
}

export default App;
