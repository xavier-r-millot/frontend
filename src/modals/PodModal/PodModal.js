import React from 'react'
import FlexibleModal from "../../hocs/FlexibleModal";
import {Types} from "../../types/CommonTypes";
import LeftHeader from "../../widgets/LeftHeader/LeftHeader";
import MiscUtils from "../../utils/MiscUtils";
import Tabs from "../../widgets/Tabs/Tabs";

export default class PodModal extends React.Component {

  render(){
    return(
      <FlexibleModal mode='modal'>
        { this.renderHeader() }
        { this.renderTabs() }
      </FlexibleModal>
    )
  }

  renderHeader(){
    const { pod, deployment, matching } = this.props;
    return(
      <LeftHeader
        graphicName={MiscUtils.msImage(deployment, matching)}
        title={`${deployment.namespace} / ${pod.name}`}
        subtitle={`One of ${deployment.name}'s pods.`}
      />
    )
  }

  renderTabs(){
    return(
      <Tabs tabs={['Status', 'Logs']} selectedInd={0}>
        <p>stat</p>
        <p>log</p>
      </Tabs>
    )
  }

  static propTypes = {
    pod: Types.LightPod,
    deployment: Types.Deployment,
    matching: Types.Matching
  }
}