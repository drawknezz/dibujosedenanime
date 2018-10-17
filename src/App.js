import React, {Component} from 'react';
import './App.css';
import _ from './mixins';
import Sorteo from './Sorteo';
import Reto from './Reto';
import Chars from './Chars';
import InfoText from './InfoText'
import Login from './Login';
import {onSocket, socketEmit} from "./api";
import Polls from "./Polls";
import {connect} from "react-redux";
import {allData} from "./actions/index"

class App extends Component {
    constructor() {
        super();

        this.state = {
            status: "loading"
        };

        _.bindAll(this, "showMessage", "onLoginStatusChange");
    }

    render() {
        let usercount = _.get(this, "state.usercount", []);
        console.log("usercount", usercount);
        return _.ruleMatch({s: _.get(this, "state.status")}, [
            {
                s: "loading",
                returns: (
                    <div>
                        <div className="loadingBox">
                            <img src="/pikachu.gif" alt="loading"/>
                            <p><span>cargando...</span></p>
                            <p><span className="smallText">(este host aguanta mas carga pero es mas lento ...)</span></p>
                        </div>
                    </div>
                )
            },
            {
                returns: (
                    <div>
                        <Login onStatusChange={this.onLoginStatusChange} loginData={_.get(this, "state.loginData")} userData={_.get(this, "state.userData")}/>

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
                            <div className="bloque pad">
                                <InfoText infoTxt={_.get(this, "state.infoTxt.txt")}/>
                            </div>

                            <div className="bloque pad">
                                <Polls polls={_.get(this, "state.polls")} loginData={_.get(this, "state.loginData")}/>
                            </div>

                            <div className="bloque">
                                <Reto reto={this.state.reto}
                                      members={this.state.members}
                                      loginData={_.get(this, "state.loginData")}
                                />
                            </div>

                            <div className="bloque pad sorteo">
                                <Sorteo sorteo={this.state.sorteo}/>
                            </div>

                            <Chars chars={this.state.chars}/>
                        </main>

                        <footer>
                    <span>{
                        _.ruleMatch({c: usercount}, [
                            {
                                "c.length": 1,
                                returns: `eres el unico usuario conectado ${_.get(usercount, "0.name")} uwu`
                            },
                            {
                                "c.length": _.partial(_.gt, _, 1),
                                returns: `${usercount.length} usuarios conectados uwu`
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
            chars: _.get(data, "chars"),
            polls: _.get(data, "polls")
        })
    }

    showMessage(msg) {
        this.setState({
            messages: _.union(_.get(this, "state.messages", []), [{txt: msg, time: new Date().getTime()}])
        });
    }

    onLoginStatusChange(loginData) {
        this.setState({loginData: loginData});

        if (_.get(loginData, "username")) {
            socketEmit("userlogged", {
                name: _.get(loginData, "username"),
                facebookId: _.get(loginData, "authResponse.userID")
            });
        }
    }

    componentDidMount() {
        let self = this;

        onSocket("usercount", a => {
            this.setState({usercount: a})
        });

        onSocket("allData", data => {
            this.setState({status: "loaded"});

            _.attemptBound(self, "props.allData", data);
            this.updateAll(data);
        });

        onSocket("userdata", userData => {
            this.setState({userData: userData});
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

export default connect(state => state, dispatch => ({
    allData: data => dispatch(allData(data))
}))(App);
