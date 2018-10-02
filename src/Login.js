import React, {Component} from 'react';
import _ from './mixins';
import {socketEmit} from "./api";
import {connect} from 'react-redux';
import {checkLoginStatus, login, logout, promoteUser} from "./actions";

class Login extends Component {
    constructor() {
        super();

        this.state = {status: "loaded"};

        _.bindAll(this, "promoting", "promote", "resetState");
    }

    componentDidMount() {
        _.attemptBound(this, "props.checkLoginStatus");
    }

    render() {
        let loginData = _.get(this, "props.loginData", {});
        return _.ruleMatch(_.extend({}, loginData, {
            ud: _.get(this, "props.userData")
        }), [
            {
                status: Boolean,
                $inner: [
                    {
                        status: "connected",
                        $inner: [
                            {
                                "ud.status": "promoting",
                                returns: (<div className={"loginBlock"}>
                                    <p><span>
                                        <img src="/facebook.svg" alt=""/>&nbsp;
                                        estas logueado como <strong>{_.get(this, "props.userData.name")}</strong>&nbsp;&nbsp;&nbsp;&nbsp;
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
                                        estas logueado como <strong>{_.get(this, "props.userData.name")}</strong>&nbsp;
                                        💎 <strong>eres admin</strong>&nbsp;&nbsp;&nbsp;
                                        (<a onClick={_.get(this, "props.logout")}>salir</a>)

                                    </span></p>
                                </div>)
                            },
                            {
                                ud: Boolean,
                                returns: (<div className={"loginBlock"}>
                                    <p><span>
                                        <img src="/facebook.svg" alt=""/>&nbsp;
                                        estas logueado como <strong>{_.get(this, "props.userData.name")}</strong>&nbsp;&nbsp;&nbsp;&nbsp;
                                        <a onClick={this.promoting}>💎 promover</a>&nbsp;&nbsp;&nbsp;
                                        (<a onClick={_.get(this, "props.logout")}>salir</a>)
                                    </span></p>
                                </div>)
                            },
                            {
                                returns: (<div className={"loginBlock"}>
                                    <p><span>
                                        <img src="/facebook.svg" alt=""/>&nbsp;
                                        estas logueado como <strong>{_.get(this, "props.userData.name")}</strong>&nbsp;&nbsp;&nbsp;&nbsp;
                                        (<a onClick={_.get(this, "props.logout")}>salir</a>)
                                    </span></p>
                                </div>)
                            }
                        ]
                    },

                    {
                        returns: (<div className={"loginBlock"}>
                            <p><img src="/facebook.svg" alt=""/> <a onClick={_.get(this, "props.login")}>logueate</a></p>
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

    promoting() {
        this.setState({status: "promoting"});
        this.props.promote()
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

const mapState = function(state) {
    return state;
};

const mapDispatch = function(dispatch) {
    return {
        checkLoginStatus: () => dispatch(checkLoginStatus()),
        login: () => dispatch(login()),
        logout: () => dispatch(logout()),
        promote: () => dispatch(promoteUser())
    }
};

export default connect(mapState, mapDispatch)(Login);