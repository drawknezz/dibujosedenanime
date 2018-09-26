import React from 'react';
import _ from './mixins';
import {socketEmit} from './api';
import ReactCSSReplace from 'react-css-transition-replace';

class Poll extends React.Component {
    constructor() {
        super();
    }

    render() {
        return <div className="poll">
            <p><span>{_.get(this, "props.name", "unnamed")}</span></p>
            <span>
                <button onClick={this.addingEntry}>add entry</button>
                <button onClick={this.deletePoll}>delete</button>
            </span>
        </div>
    }

    addingEntry() {
        console.log("adding entry")
    }

    deletePoll(){
        console.log("deleting")
    }
}

export default Poll;