import _ from "../mixins";
import axios from "axios";

export function login() {
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