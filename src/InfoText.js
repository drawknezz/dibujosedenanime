import React, {Component} from 'react';
import _ from './mixins';
import {socketEmit} from './api';
import {connect} from "react-redux";

class InfoText extends Component {
    constructor() {
        super();

        this.state = {status: "loaded"};

        _.bindAll(this, "editInfoText", "confirmEdition", "updateTempText", "resetState");
    }

    render() {
        const infotext = _.chain(this)
            .get("props.infoTxt", "")
            .thru(txt => txt.match(/([^*]+|\*[^*]+\*)|\*/g))
            .map((phrase, i) => {
                return _.ruleMatch({t: phrase}, [
                    {
                        t: /\*[^*]+\*/,
                        returns: <span key={i}><strong>{
                            _.get(_.regGroups(phrase, "\\*(?<phrase>[^\*]+)\\*"), "phrase")
                        }</strong></span>},

                    {returns: <span key={i}>{phrase}</span>}
                ])
            })
            .value();

        return _.ruleMatch({
            s: _.get(this, "state.status"),
            ud: _.get(this, "props.userData")
        }, [
            {
                s: "editando",
                returns: (
                    <div className={"infotext"}>
                        <p><textarea defaultValue={_.get(this, "props.infoTxt")} ref="txtInput" onChange={this.updateTempText} rows="5"/></p>
                        <p><span>
                            <input type="password" ref="claveInput"/>
                            <button onClick={this.confirmEdition}>aceptar</button>
                            <button onClick={this.resetState}>cancelar</button>
                        </span></p>
                    </div>
                )
            },
            {
                "ud.permissions": _.partial(_.includes, _, "any"),
                returns: (
                    <div>
                        <img className={"editbtn"} src="/edit.svg" onClick={this.editInfoText} alt={"edit"}/>
                        <p><span>{infotext}</span></p>
                    </div>
                )
            },

            {
                returns: (
                    <div>
                        <p><span>{infotext}</span></p>
                    </div>
                )
            }
        ]);
    }

    editInfoText() {
        this.setState({status: "editando"})
    }

    updateTempText() {
        let input = _.get(this, "refs.txtInput.value");

        this.setState({
            tempText: input
        })
    }

    confirmEdition() {
        let input = _.get(this, "refs.txtInput.value");
        let pass = _.get(this, "refs.claveInput.value");

        socketEmit("editinfotext", {txt: input, pass: pass});

        this.resetState();
    }

    resetState() {
        this.setState({status: "loaded", tempText: ""})
    }
}

function mapState(state) {
    return state;
}

export default connect(mapState)(InfoText);