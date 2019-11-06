//@flow
import React, {Fragment} from 'react';
import AuthenticatedComponent from '../../hocs/AuthenticatedComponent';
import LeftHeader from '../../widgets/LeftHeader/LeftHeader';
import DeploymentList from './DeploymentList';
import MatchModal from '../../modals/MatchModal/MatchModal';
import IntegrationsPrompt from "./IntegrationsPrompt";
import ErrComponent from "../../hocs/ErrComponent";
import ModalHostComposer from "../../hocs/ModalHostComposer";
import CenterAnnouncement from "../../widgets/CenterAnnouncement/CenterAnnouncement";
import Layout from "../../assets/layouts";
import Loader from "../../assets/loading-spinner";
import defaults from './defaults'
import Helper from './Helper'
import type {Matching, WideDeployment} from "../../types/Types";
import {Redirect} from "react-router";
import CenterLoader from "../../widgets/CenterLoader/CenterLoader";

class BulkMatchingClass extends React.Component<Props, State> {
  constructor(props){
    super(props);
    this.state = BulkMatchingClass.defaultState();
    this.update = this.update.bind(this);
    this.onIntegrationDone = this.onIntegrationDone.bind(this);
    this.notifyDeploymentSelected = this.notifyDeploymentSelected.bind(this);
    this.onMatchingEvent = this.onMatchingEvent.bind(this);
  }

  componentDidMount(){
    this.reload();
  }

  render(){
    return(
      <React.Fragment>
        { this.renderSkipAhead() }
        { this.renderObtLoading() }
        { this.renderLeftSide() }
        { this.renderRightSide() }
      </React.Fragment>
    )
  }

  renderSkipAhead(){
    if(!this.state.skipRequested) return null;
    return <Redirect to='/workspaces'/>
  }

  renderObtLoading(){
    if(!this.isIntChecking()) return null;

    return(
      <Fragment>
        <Layout.LeftPanel><CenterLoader/></Layout.LeftPanel>
        <Layout.RightPanel><CenterLoader/></Layout.RightPanel>
      </Fragment>
    )
  }

  renderLeftSide(){
    if(this.isIntChecking()) return null;

    return(
      <Layout.LeftPanel>
        <LeftHeader {...defaults.header} />
        { <Loader.TopRightSpinner there={this.state.isFetching} /> }
        { this.renderDeploymentsList() }
      </Layout.LeftPanel>
    )
  }

  renderRightSide(){
    if(this.isIntChecking()) return null;

    return(
      <Layout.RightPanel>
        { this.renderIntegrationsPrompt() }
        { this.renderMatchingModal() }
      </Layout.RightPanel>
    )
  }

  renderDeploymentsList(){
    if(!this.hasPassedIntCheck()) return null;
    const { deployments, selectedIndex } = this.state;

    return(
      <DeploymentList
        deployments={deployments}
        selectedIndex={selectedIndex}
        notifyDeploymentSelected={this.notifyDeploymentSelected}
      />
    )
  }

  renderIntegrationsPrompt(){
    if(this.hasPassedIntCheck()) return null;
    return <IntegrationsPrompt callback={this.onIntegrationDone}/>;
  }

  renderSubmitted(){
    if(!this.state.areAllSubmitted) return;

    return(
      <CenterAnnouncement
        contentType='nav-link'
        action='/workspaces'
        iconName='done_all'
        text="Nice. You can change these whenever. Click to continue."
      />
    )
  }

  renderMatchingModal(){
    if(!this.state.isIntegrated) return null;
    if(this.state.isSubmitting) return null;
    if(!this.selectedDeployment()) return null;

    const { matchings } = this.state;
    const deployment = this.selectedDeployment();
    const matching = Helper.depMatching(deployment, matchings);

    return(
      <MatchModal
        mode='tutorial'
        deployment={deployment}
        matching={matching}
        callback={this.onMatchingEvent}
      />
    )
  }

  selectedDeployment(){
    if(this.state.selectedIndex !== null)
      return this.state.deployments[this.state.selectedIndex];
    else return null;
  }

  onMatchingEvent(positive){
    if(positive) this.reloadMatchings();
    const selectedIndex = this.state.selectedIndex + 1;
    this.setState((s) => ({...s, selectedIndex}));
  }

  onIntegrationDone(status){
    if(status) this.reload();
    else this.setState(s => ({...s, skipRequested: true}));
  }

  notifyDeploymentSelected(name){
    const selectedIndex = this.state.deployments.findIndex(
      (d) => (d.name === name)
    );
    this.setState((s) => ({...s, selectedIndex}))
  }

  update(assignment){
    this.setState(s => ({...s, ...assignment}));
  }

  reload(){
    Helper.fetchIsIntegrated(this.update);
    Helper.fetchItems(this.update);
  }

  reloadMatchings(){ Helper.fetchMatchings(this.update); }
  hasPassedIntCheck(){ return !!this.state.isIntegrated; }
  isIntChecking(){ return !!this.state.isCheckingIntegration; }

  static defaultState(){
    return({
      deployments: [],
      matchings: [],
      isIntegrated: null,
      isCheckingIntegration: false,
      selectedIndex: 0,
      isSubmitting: false,
      areAllSubmitted: false,
      query: DEFAULT_QUERY,
      integrations: null,
      isOverriding: false
    })
  }
}

const DEFAULT_QUERY = [{
  field: "namespace",
  op: "one-of",
  challenge: ["default"]
}];

const BulkMatch = AuthenticatedComponent.compose(
  ModalHostComposer.compose(
    ErrComponent.compose(
      BulkMatchingClass
    )
  )
);

export { BulkMatch as default };

type State = {
  deployments: Array<WideDeployment>,
  matchings: Array<Matching>,
  isIntegrated: ?boolean,
  isCheckingIntegration: ?boolean,
  skipRequested: false,
  phase: 'fetching' | 'integrating' | 'submitting'
};

type Props = {};