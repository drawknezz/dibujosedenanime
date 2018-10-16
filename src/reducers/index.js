import {
    LOGIN_STATUS_UPDATED,
    PROMOTE_USER,
    USER_PERMISSIONS_LOADED,
    ALL_DATA
} from "../actions";
import _ from '../mixins';


const initialState = {
    loginData: {
        status: "loading"
    }
};

export function storiesReducer(state = initialState, action) {
    switch (action.type) {
        case LOGIN_STATUS_UPDATED:
            return {
                ...state,
                loginData: {
                    status: _.get(action, "payload.response.status"),
                    ..._.get(action, "payload.response.authResponse"),
                },
                userData: _.get(action, "payload.userInfo.data")
            };

        case PROMOTE_USER:
            return {
                ...state,
                userData: {
                    ...state.userData,
                    status: "promoting"
                }
            };

        case USER_PERMISSIONS_LOADED:
            return {
                ...state,
                userData: {
                    ...state.userData,
                    permissions: _.get(action, "payload")
                }
            };
        case ALL_DATA:
            console.log("ALL DATA action received");
            return {
                ...state,
                data: _.get(action, "payload")
            };

        default: return state;
    }
}

export default storiesReducer;