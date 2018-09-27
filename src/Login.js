import React, {Component} from 'react';
import _ from './mixins';
import axios from 'axios';
import {socketEmit} from "./api";

/* globals FB */

class Login extends Component {
    constructor() {
        super();

        this.state = {status: "loaded"};

        _.bindAll(this, "checkLoginStatus", "login", "logout", "promoting", "promote", "resetState");
    }

    componentDidMount() {
        this.checkLoginStatus();

        FB.Event.subscribe('auth.login', this.checkLoginStatus);
        FB.Event.subscribe('auth.logout', this.checkLoginStatus);
    }

    render() {
        let loginData = _.get(this, "props.loginData", {});
        return _.ruleMatch(_.extend({}, loginData, {
            st: _.get(this, "state.status"),
            ud: _.get(this, "props.userData")
        }), [
            {
                status: Boolean,
                $inner: [
                    {
                        status: "connected",
                        $inner: [
                            {
                                st: "promoting",
                                returns: (<div className={"loginBlock"}>
                                    <p><span>
                                        <img src="/facebook.svg" alt=""/>&nbsp;
                                        estas logueado como <strong>{_.get(this, "props.loginData.username")}</strong>&nbsp;&nbsp;&nbsp;&nbsp;
                                        <input type="password" ref="passtxt"/>&nbsp;
                                        <a onClick={this.promote}>💎 ok</a>&nbsp;
                                        <a onClick={this.resetState}>cancelar</a>
                                    </span></p>
                                </div>)
                            },
                            {
                                "ud.permissions": _.partial(_.includes, _, "any"),
                                returns: (<div className={"loginBlock"}>
                                    <p><span>
                                        <img src="/facebook.svg" alt=""/>&nbsp;
                                        estas logueado como <strong>{_.get(this, "props.loginData.username")}</strong>&nbsp;
                                        💎 <strong>eres admin</strong>
                                    </span></p>
                                </div>)
                            },
                            {
                                ud: Boolean,
                                returns: (<div className={"loginBlock"}>
                                    <p><span>
                                        <img src="/facebook.svg" alt=""/>&nbsp;
                                        estas logueado como <strong>{_.get(this, "props.loginData.username")}</strong>&nbsp;&nbsp;&nbsp;&nbsp;
                                        <a onClick={this.promoting}>💎 promover</a>
                                    </span></p>
                                </div>)
                            },
                            {
                                returns: (<div className={"loginBlock"}>
                                    <p><span>
                                        <img src="/facebook.svg" alt=""/>&nbsp;
                                        estas logueado como <strong>{_.get(this, "props.loginData.username")}</strong>&nbsp;&nbsp;&nbsp;&nbsp;
                                    </span></p>
                                </div>)
                            }
                        ]
                    },

                    {
                        returns: (<div className={"loginBlock"}>
                            <p><img src="/facebook.svg" alt=""/> <a onClick={this.login}>logueate</a></p>
                        </div>)
                    }
                ]
            },
            {
                returns: (<div className={"loginBlock"}>
                    <p><span><img src="/facebook.svg" alt=""/></span></p>
                </div>)
            }
        ]);
    }

    checkLoginStatus() {
        let FB = _.get(window, "FB");
        _.attemptBound(FB, "getLoginStatus", (response) => {
            let onStatusChange = _.get(this, "props.onStatusChange");
            let status = _.get(response, "status");
            let userId = _.get(response, "authResponse.userID");
            let accToken = _.get(response, "authResponse.accessToken");

            if (status === "connected") {
                axios(`https://graph.facebook.com/${userId}?fields=name&access_token=${accToken}`)
                    .then((resp) => {
                        onStatusChange(_.extend({}, response, {username: _.get(resp, "data.name")}));
                    })
            } else {
                onStatusChange(response);
            }
        });
    }

    login() {
        FB.login();
    }

    logout() {
        FB.logout();
    }

    promoting() {
        this.setState({status: "promoting"})
    }

    promote() {
        const userid = _.get(this, "props.loginData.authResponse.userID");
        const pass = _.get(this, "refs.passtxt.value");

        socketEmit("promotemember", {id: userid, pass: pass});

        this.resetState();
    }

    resetState() {
        this.setState({status: "loaded", tempText: ""})
    }
}

export default Login;