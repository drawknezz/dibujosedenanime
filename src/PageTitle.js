import React, { Component } from 'react';
import _ from './mixins';
import { socketEmit } from './api';
import { connect } from "react-redux";

class PageTitle extends Component {
    constructor(props) {
        super(props);

        this.state = { status: "loaded", };

        _.bindAll(this, "editPageTitle", "confirmEdition", "updateTempText", "resetState");
    }

    updateBrowserTitle(txt) {
        window.document.title = txt
    }

    render() {
        const txt = _.defaultTo(_.get(this, "state.txt"), _.get(this, "props.txt", ""));

        this.updateBrowserTitle(txt)

        return _.ruleMatch({
            s: _.get(this, "state.status"),
            ud: _.get(this, "props.userData")
        }, [
            {
                s: "editando",
                returns: (
                    <h1 data-testid="pagetitle">
                        <input ref="txtInput" type="text" defaultValue={txt} className="pagetitleInput"/>
                        <p className="no-margin">
                            <span>
                                <button onClick={this.confirmEdition}>aceptar</button>
                                <button onClick={this.resetState}>cancelar</button>
                            </span>
                        </p>
                    </h1>
                )
            },
            {
                "ud.permissions": _.partial(_.includes, _, "any"),
                returns: (
                    <h1 data-testid="pagetitle">
                      <span className="relpos">
                          {txt}
                          <img className={"editbtn outer"} src="/edit.svg" onClick={this.editPageTitle}
                               alt={"cambiar titulo"}/>
                      </span>
                    </h1>
                )
            },

            {
                returns: (
                    <h1 data-testid="pagetitle">{txt}</h1>
                )
            }
        ]);
    }

    editPageTitle() {
        this.setState({ status: "editando" })
    }

    updateTempText() {
        let input = _.get(this, "refs.txtInput.value");

        this.setState({
            tempText: input
        })
    }

    confirmEdition() {
        let input = _.get(this, "refs.txtInput.value");
        const userid = _.get(this, "props.userData.id");

        socketEmit("editpagetitle", { txt: input, userid });

        this.setState({ status: "loaded", txt: input })
    }

    resetState() {
        this.setState({ status: "loaded", tempText: "" })
    }
}

function mapState(state) {
    return state;
}

export default connect(mapState)(PageTitle);