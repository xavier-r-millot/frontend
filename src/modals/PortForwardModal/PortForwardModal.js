import React from 'react'
import Layout from './../../assets/layouts'
import LeftHeader from "../../widgets/LeftHeader/LeftHeader";
import MiscUtils from "../../utils/MiscUtils";
import defaults from "./defaults";
import TextOverLineSubtitle from "../../widgets/TextOverLineSubtitle/TextOverLineSubtitle";
import PortForwardForm from "./PortForwardForm";
import Helper from "./Helper";
import CopyWizard from "./CopyWizard";
import {Types} from "../../types/Deployment";

export default class PortForwardModal extends React.Component{

  constructor(props){
    super(props);
    this.state = {
      choices: {
        resType: defaults.sectionOne.resTypes[0],
        resName: props.deployment.name,
        fromPort: '80',
        toPort: ''
      }
    };
    this.formCallback = this.formCallback.bind(this);
  }

  componentDidMount(){
    const defaultType = defaults.sectionOne.resTypes[0];
    Helper.applyChoice(this, "resType",  defaultType);
  }

  render(){
    return(
      <Layout.ModalLayout>
        { this.renderHeader() }
        <TextOverLineSubtitle text={defaults.sectionOne.title}/>
        { this.renderForm() }
        <TextOverLineSubtitle text={defaults.sectionTwo.title}/>
        { this.renderPasta() }
      </Layout.ModalLayout>
    )
  }

  renderHeader(){
    const { deployment, matching } = this.props;
    return(
      <LeftHeader
        graphicName={MiscUtils.msImage(deployment, matching)}
        title={defaults.header.title(deployment.name)}
        subtitle={defaults.header.subtitle}
      />
    )
  }

  renderForm(){
    const choices = this.state.choices;
    return(
      <PortForwardForm
        resType={choices.resType}
        resName={choices.resName}
        fromPort={choices.fromPort}
        resTypeOptions={defaults.sectionOne.resTypes}
        resNameOptions={Helper.resNames(this, choices.resType)}
        notifyFormValueChanged={this.formCallback}
      />
    )
  }

  renderPasta(){
    const choices = this.state.choices;
    return(
      <CopyWizard
        command={Helper.pastaCommand(this)}
        fromPort={choices.fromPort}
        toPort={choices.toPort}
      />
    )
  }

  formCallback(key, value){
    Helper.applyChoice(this, key, value);
  }

  static propTypes = {
    deployment: Types.Deployment,
    matching: Types.Matching
  }
}