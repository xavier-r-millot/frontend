//@flow
import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {Types} from "../../types/CommonTypes";
import DestinationForm from "./DestinationForm";
import SourcePane from "./SourcePane";
import Kapi from "../../utils/Kapi";
import CodeEditor from "./CodeEditor";
import {defaultBody, defaultHeaders} from "./defaults";
import Utils from "../../utils/Utils";
import {BodyResponseView, HeadersResponseView, RawResponseView} from "./Response";
import HistoryList from "./HistoryList";
import Backend from "../../utils/Backend";
import FlexibleModal from "../../hocs/FlexibleModal";
import { Tabs, Layout, LeftHeader, Text, TextOverLineSubtitle, ModalButton } from "nectar-cs-js-common";
import Helper from './Helper'
import Checklist from "../ImageOpsModal/View/Checklist";

const REQUEST_TAB_NAMES = ['Destination', 'Source', 'Headers', 'Body'];

export default class HttpActionsModal extends React.Component {

  constructor(props){
    super(props);

    this.state = {
      destination: {
        host: HttpActionsModal.defaultHost(props),
        path: '/',
        verb: 'GET'
      },
      source: {
        type: 'test-pod',
        namespace: props.deployment.namespace,
      },
      headerText: '',
      bodyText: '',
      namespaces: [],
      phase: 'editing',
      httpResp: '',
      showHistory: true
    };

    this._isMounted = true;
    this.submit = this.submit.bind(this);
    this.onSubmitted = this.onSubmitted.bind(this);
    this.onSubmitFailed = this.onSubmitFailed.bind(this);
    this.enterEditState = this.enterEditState.bind(this);
    this.onHistoryItemSelected = this.onHistoryItemSelected.bind(this);
    this.historyCallback = null;
  }

  static defaultHost(props){
    if(props.targetHost){
      return Helper.makeSvcHost(props.targetHost, props.port);
    } else {
      if(props.deployment.services[0]){
        const {name, shortDns, fromPort} = props.deployment.services[0];
        return Helper.makeSvcHost(name, shortDns, fromPort).value;
      } if(props.deployment.pods[0]) {
        const {name, ip} = props.deployment.pods[0];
        return Helper.makePodHost(name, ip).value;
      }
    }
  }

  async componentDidMount(): void {
    Utils.mp("HTTP Operations Start", {});
    const namespaces = await Kapi.bFetch('/api/cluster/namespaces');
    this.setState(s => ({...s, namespaces}))
  }

  render(){
    return(
      <FlexibleModal mode={this.props.mode}>
        { this.renderHeader() }
        { this.renderEditPhase() }
        { this.renderSubmittingPhase() }
        { this.renderResponsePhase() }
      </FlexibleModal>
    )
  }

  renderHeader(){
    const { deployment } = this.props;
    return(
      <LeftHeader
        graphicName={Utils.modalImage(this, "http")}
        graphicType={Utils.modalGraphicType(this)}
        title={`${deployment.name} / http ops`}
        subtitle='Send HTTP requests to this deployment'
      />
    );
  }

  renderEditPhase(){
    if(this.state.phase !== 'editing') return null;
    return(
      <Fragment>
        { this.renderRequestTabs() }
        { this.renderGamePlan() }
        { this.renderHistory() }
        { this.renderRunButton() }
      </Fragment>
    )
  }

  renderSubmittingPhase(){
    if(this.state.phase !== 'submitting') return null;
    const items = [
      { name: "cURL Pod created/found", detail: "", status: "working" },
      { name: "cURL Pod running", detail: "", status: "working" },
      { name: "cURL Command returned", detail: "", status: "working" },
    ];
    return(
      <Fragment>
        { this.renderGamePlan() }
        <Checklist items={items}/>
      </Fragment>
    )
  }

  renderResponsePhase(){
    if(this.state.phase !== 'response') return null;
    return(
      <Fragment>
        { this.renderResponseTabs() }
        { this.renderGamePlan() }
        { this.renderRunButton() }
      </Fragment>
    )
  }

  renderGamePlan(){
    const Lines = () => Helper.previewCommands(this).map(cmd => (
      <Text.Code key={cmd} chill>{cmd}</Text.Code>
    ));

    return(
      <Fragment>
        <TextOverLineSubtitle text='Game Plan'/>
        <Layout.BigCodeViewer>
          <Lines/>
        </Layout.BigCodeViewer>
      </Fragment>
    )
  }

  renderHistory(){
    if(this.state.showHistory){
      const historyCallbackSetter = (cb) => { this.historyCallback = cb; };
      return(
        <HistoryList
          name={this.props.deployment.name}
          namespace={this.props.deployment.namespace}
          onItemSelectedCallback={this.onHistoryItemSelected}
          historyCallbackSetter={historyCallbackSetter}
        />
      )
    } else return null;
  }

  renderResponseTabs(){
    return (
      <Tabs
        tabs={['Body', 'Headers', 'Raw']}
        selectedInd={0}>
        <BodyResponseView body={this.state.httpResp.body}/>
        <HeadersResponseView headers={this.state.httpResp.headers}/>
        <RawResponseView raw={this.state.httpResp.raw}/>
      </Tabs>
    )
  }

  renderRequestTabs(){
    return(
      <Tabs
        tabs={REQUEST_TAB_NAMES}
        selectedInd={0}
        onTabChanged={(i) => this.setState(s => ({...s, showHistory: i === 0}))}>
        <DestinationForm
          notifyFormValueChanged={(k, v) => this.onGroupChanged('destination', k, v)}
          services={this.props.deployment.services}
          pods={this.props.deployment.pods}
          {...this.state.destination}
        />
        <SourcePane
          notifyFormValueChanged={(k, v) => this.onGroupChanged('source', k, v)}
          namespaces={this.state.namespaces}
          {...this.state.source}
        />
        <CodeEditor
          body={this.state.headerText}
          placeholder={defaultHeaders}
          onCodeChanged={(headerText) => this.setState(s => ({...s, headerText}))}
        />
        <CodeEditor
          body={this.state.bodyText}
          placeholder={defaultBody}
          onCodeChanged={(bodyText) => this.setState(s => ({...s, bodyText}))}
        />
      </Tabs>
    )
  }

  onGroupChanged(group, key, value){
    const assignment = { [key]: value };
    const newDestination = {...this.state[group], ...assignment};
    this.setState(s => ({...s, [group]: newDestination}));
  }

  assessReadiness(){
    if(this.state.phase === 'editing'){
      if(this.state.source.type !== 'test-pod') return false;

      let blanksPresent = false;
      Object.values(this.state.destination).forEach(v => {
        blanksPresent = blanksPresent || !v;
      });
      return !blanksPresent;
    } else return true;
  }

  onSubmitted(response){
    if(this._isMounted){
      this.setState(s => ({...s,
        phase: 'response',
        httpResp: response['data']
      }));

      this.saveToHistory(response['data']['status']);
    }
  }

  onSubmitFailed(bundle){
    if(this._isMounted){
      this.setState(s => ({...s, phase: 'editing'}));
      console.log(bundle);
    }
  }

  submit(){
    this.setState(s => ({...s, phase: 'submitting'}));
    const {verb, path, host } = this.state.destination;
    const { namespace } = this.state.source;
    let payload = { verb, url: host, path, namespace };

    Kapi.aPost(
      "/api/run/curl",
      payload,
      this.onSubmitted,
      this.onSubmitFailed
    );
  }

  saveToHistory(status){
    let args = `dep_name=${this.props.deployment.name}`;
    args = `${args}&dep_namespace=${this.props.deployment.namespace}`;
    args = `${args}&kind=http_requests`;
    const { source, destination, headerText, bodyText } = this.state;
    const backendPayload = {
      source, destination, headerText, bodyText,
      status: status
    };

    Backend.aPost(
      `/dep_attachments?${args}`,
      { extras: backendPayload },
      this.historyCallback
    )
  }

  onHistoryItemSelected(data){
    const { source, destination, bodyText, headerText } = data;
    this.setState(s => ({
      ...s, source, destination, bodyText, headerText
    }))
  }

  enterEditState(){
    this.setState((s) => ({...s, phase: 'editing', showHistory: true}))
  }

  renderRunButton(){
    const phase = this.state.phase;

    const title = phase === 'response' ? 'Back to Edit' : 'Submit Request';
    const callback = phase === 'response' ? this.enterEditState : this.submit;

    return(
      <ModalButton
        isEnabled={phase !== 'submitting' && this.assessReadiness()}
        callback={callback}
        title={title}
      />
    )
  }

  static propTypes = {
    deployment: Types.Deployment,
    matching: Types.Matching,
    targetAddr: PropTypes.string,
    port: PropTypes.number
  }
}
