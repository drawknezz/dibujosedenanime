import {createStore} from "redux";

const initialState = {
    articles: []
};
const rootReducer = (state = initialState, action) => state;

const store = createStore(rootReducer);

export default store;