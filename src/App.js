import React, {Component} from 'react';
import './App.css';
import _ from './mixins';
import Sorteo from './Sorteo';
import Reto from './Reto';
import Chars from './Chars';
import Members from './Members'
import InfoText from './InfoText'
import {onSocket, socketEmit} from "./api";

class App extends Component {
    constructor() {
        super();

        this.state = {
            status: "loading"
        };

        _.bindAll(this, "showMessage");
    }

    render() {
        let usercount = _.get(this, "state.usercount");

        return _.ruleMatch({s: _.get(this, "state.status")}, [
            {
                s: "loading",
                returns: (
                    <div>
                        <div className="loadingBox">
                            <img src="/pikachu.gif"/>
                            <p><span>cargando...</span></p>
                            <p><span className="smallText">(este host aguanta mas carga pero es mas lento ...)</span></p>
                        </div>
                    </div>
                )
            },
            {
                returns: (
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
                                <InfoText infoTxt={_.get(this, "state.infoTxt.txt")}/>
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
                    <span>{
                        _.ruleMatch({c: usercount}, [
                            {
                                c: 1,
                                returns: "eres el unico conectado uwu"
                            },
                            {
                                c: _.partial(_.gt, _, 1),
                                returns: `${usercount} personas conectadas uwu`
                            },
                            {
                                returns: "uwu"
                            }
                        ])
                    }</span>
                        </footer>
                    </div>
                )
            }
        ])
    }

    updateAll(data) {
        console.log("allData response: ", data);
        this.setState({
            infoTxt: _.get(data, "infoTxt"),
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
        onSocket("usercount", a => {
            this.setState({usercount: a})
        });

        onSocket("allData", data => {
            this.setState({status: "loaded"});

            this.updateAll(data);
        });

        onSocket("msg", this.showMessage);
        onSocket("err", this.showMessage);

        socketEmit("allData");

        window.setInterval(() => {
            if(_.isEmpty(_.get(this, "state.messages"))) return;

            let newMessages = _.chain(this).get("state.messages").reject(m => _.get(m, "cls") === "dissapearing").map(m => {
                if (new Date().getTime() - m.time > 5000) {
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
