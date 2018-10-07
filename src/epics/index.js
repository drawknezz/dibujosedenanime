import {Observable} from "rxjs";
import {combineEpics, ofType} from "redux-observable";
import {switchMap, map} from "rxjs/operators";
import Promise from "bluebird";
import "rxjs/add/observable/from";

import _ from "../mixins";
import {
    CHECK_LOGIN_STATUS,
    checkLoginStatus,
    LOGIN, LOGIN_STATUS_UPDATED,
    loginStatusUpdated,
    LOGOUT, userPermissionsLoaded
} from "../actions";
import * as axios from "axios";
import {socketEmit} from "../api";

function loginEpic(actions$) {
    return actions$.pipe(
        ofType(LOGIN),
        switchMap(() => {
            return Observable.from(new Promise(res => {
                _.attemptBound(window, "FB.login", () => res())
            }))
        }),
        map(() => checkLoginStatus())
    )
}

function logoutEpic(actions$) {
    return actions$.pipe(
        ofType(LOGOUT),
        switchMap(() => {
            return Observable.from(new Promise(res => {
                _.attemptBound(window, "FB.logout", () => res())
            }))
        }),
        map(() => checkLoginStatus())
    )
}

function checkLoginStatusEpic(actions$) {
    return actions$.pipe(
        ofType(CHECK_LOGIN_STATUS),
        switchMap(() => {
            return Observable.from(new Promise((res, rej) => {
                _.attemptBound(window, "FB.getLoginStatus", response => res(response))
            }));
        }),
        switchMap((response) => {
            let status = _.get(response, "status");
            let userId = _.get(response, "authResponse.userID");
            let accToken = _.get(response, "authResponse.accessToken");

            if (status === "connected") {
                return Observable.from(Promise.props({
                    response, userInfo: axios(`https://graph.facebook.com/${userId}?fields=name&access_token=${accToken}`)
                }))
            } else {
                return Observable.from([{response: response}]);
            }
        }),
        map(action => {
            if (_.get(action, "userInfo.data.name")) {
                socketEmit("userlogged", {
                    name: _.get(action, "userInfo.data.name"),
                    facebookId: _.get(action, "response.authResponse.userID")
                });
            }

            return loginStatusUpdated(action)
        })
    );
}

function checkUserPermissionsEpic(actions$) {
    return actions$.pipe(
        ofType(LOGIN_STATUS_UPDATED),
        switchMap(action => {
            const url = `${/localhost/.test(window.location.href) ? "http://localhost:3000" : ""}/getUserPermission?userid=${_.get(action, "payload.userInfo.data.id")}`;
            return Observable.from(axios(url))
        }),
        map(action => userPermissionsLoaded(_.get(action, "data")))
    )
}

export const rootEpic = combineEpics(loginEpic, logoutEpic, checkLoginStatusEpic, checkUserPermissionsEpic);