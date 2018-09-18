import React, {Component} from 'react';
import _ from './mixins';
import axios from 'axios';

/* globals FB */

class Login extends Component {
    constructor() {
        super();

        this.state = {status: "loaded"};

        _.bindAll(this, "checkLoginStatus", "login", "logout", "resetState");
    }

    componentDidMount() {
        this.checkLoginStatus();

        FB.Event.subscribe('auth.login', this.checkLoginStatus);
        FB.Event.subscribe('auth.logout', this.checkLoginStatus);
    }

    render() {
        let loginData = _.get(this, "props.loginData", {});
        return _.ruleMatch(loginData, [
            {
                status: Boolean,
                $inner: [
                    {
                        status: "connected",
                        returns: (<div className={"loginBlock"}>
                            <p><span>
                                <img src="/facebook.svg" alt=""/> estas logueado como <strong>{_.get(this, "props.loginData.username")}</strong>
                            </span></p>
                        </div>)
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

    resetState() {
        this.setState({status: "loaded", tempText: ""})
    }
}

export default Login;