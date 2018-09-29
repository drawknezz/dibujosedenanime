export const LOAD_STORIES = 'LOAD_STORIES';
export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGOUT';
export const CHECK_LOGIN_STATUS = 'CHECK_LOGIN_STATUS';
export const LOGIN_STATUS_UPDATED = 'LOGIN_STATUS_UPDATED';
export const PROMOTE_USER = 'PROMOTE_USER';
export const LOAD_USER_PERMISSIONS = 'LOAD_USER_PERMISSIONS';
export const USER_PERMISSIONS_LOADED = 'USER_PERMISSIONS_LOADED';

export function login() {
    return {
        type: LOGIN
    }
}

export function logout() {
    return {
        type: LOGOUT
    }
}

export function checkLoginStatus() {
    return {
        type: CHECK_LOGIN_STATUS
    }
}

export function loginStatusUpdated(payload) {
    return {
        type: LOGIN_STATUS_UPDATED,
        payload: payload
    }
}

export function loadUserPermissions(payload) {
    return {
        type: LOAD_USER_PERMISSIONS,
        payload: payload
    }
}

export function userPermissionsLoaded(payload) {
    return {
        type: USER_PERMISSIONS_LOADED,
        payload: payload
    }
}

export function promoteUser() {
    return {
        type: PROMOTE_USER
    }
}

export function loadStories() {
    return {}
}
export function clearStories() {
    return {}
}