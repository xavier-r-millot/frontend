import React, {Fragment} from 'react'
import LeftHeader from "../../widgets/LeftHeader/LeftHeader";
import MiscUtils from "../../utils/MiscUtils";
import defaults from "./defaults";
import {Types} from "../../types/Deployment";
import DecisionTree from "./DecisionTree";
import Helper from './Helper'

export default class OverviewSide extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      treeStruct: null
    };
  }

  componentDidMount(){
    Helper.fetchTreeStruct(this);
  }

  render(){
    return(
      <Fragment>
        { this.renderHeader() }
        { this.renderTree() }
      </Fragment>
    )
  }

  renderTree(){
    const {treeStruct} = this.state;
    if(!treeStruct) return null;
    return <DecisionTree treeStruct={treeStruct}/>
  }

  renderHeader(){
    const { deployment, matching } = this.props;
    return(
      <LeftHeader
        graphicName={MiscUtils.msImage(deployment, matching)}
        title={this.config().header.title(deployment.name)}
        subtitle={this.config().header.subtitle}
      />
    )
  }

  config(){ return defaults.debuggers[this.type()]; }
  type() { return this.props.type; }

  static propTypes = {
    deployment: Types.Deployment,
    matching: Types.Matching,
  }
}