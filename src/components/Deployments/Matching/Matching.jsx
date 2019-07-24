import React, {Fragment} from 'react';
import AuthenticatedComponent from '../../../hocs/AuthenticatedComponent';
import ls from '../../../assets/content-layouts.sass';
import {LeftHeader, ICON} from '../../../widgets/LeftHeader/LeftHeader';
import Backend from '../../../utils/Backend';
import DeploymentList from './DeploymentList';
import TopLoader from '../../../widgets/TopLoader/TopLoader';
import MatchPreview from './MatchPreview';
import KubeHandler from "../../../utils/KubeHandler";
import GithubAuth from "./GithubAuth";

const GIT_STATES = { CHECKING: 'checking', FINISHED: 'offer', INVALID: 'waiting' };

const Header = function(){
  return(
    <LeftHeader
      title='Workspace Setup'
      subtitle='Choose deployments and map them to source code.'
      graphicType={ICON}
      graphicName='grid_on'
    />
  )
};

class MatchingClass extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      isFetching: false,
      isRightFetching: false,
      githubState: null,
      authUrl: null,
      deployments: [],
      selectedIndex: null,
      isSubmitting: false,
      areAllSubmitted: false,
    };

    this.onDeploymentReviewed = this.onDeploymentReviewed.bind(this);
    this.fetchClusterDeploys = this.fetchClusterDeploys.bind(this);
    this.submit = this.submit.bind(this);
    this.notifyGithubConcluded = this.notifyGithubConcluded.bind(this);
    this.notifyCheckAllChanged = this.notifyCheckAllChanged.bind(this);
    this.notifyCheckChanged = this.notifyCheckChanged.bind(this);
    this.matches = [];
  }

  componentDidMount(){
    this.fetchGithubAuth();
    this.fetchClusterDeploys();
  }

  render(){
    return(
      <React.Fragment>
        { this.renderLeftSide() }
        { this.renderRightSide() }
      </React.Fragment>
    )
  }

  renderLeftSide(){
    return(
      <div className={ls.halfScreePanelLeft}>
        <Header/>
        <TopLoader isFetching={this.state.isFetching}/>
        <DeploymentList
          selectedIndex={this.state.selectedIndex}
          deployments={this.bundleDeployments()}
          notifyCheckChanged={this.notifyCheckChanged}
          notifyCheckAllChanged={this.notifyCheckAllChanged}
        />
      </div>
    )
  }

  renderRightSide(){
    return(
      <div className={ls.halfScreePanelRight}>
        <TopLoader isFetching={this.state.isRightFetching}/>
        { this.decideRightSideContent() }
      </div>
    )
  }

  decideRightSideContent(){
    if(this.state.githubState === GIT_STATES.CHECKING)
      return null;
    else if(this.state.githubState === GIT_STATES.INVALID)
      return(
        <GithubAuth
          authUrl={this.state.authUrl}
          notifyGithubConcluded={this.notifyGithubConcluded}/>
      );
    else if(this.state.githubState === GIT_STATES.FINISHED)
      return this.renderMatchingPreview();
  }

  renderMatchingPreview(){
    return(
      <Fragment>
        <TopLoader isFetching={this.state.isRightFetching}/>
        <MatchPreview
          deployment={this.selectedDeployment()}
          onDeploymentReviewed={this.onDeploymentReviewed}
          isReviewComplete={this.isSubmitReady()}
          submitFunction={this.submit}
          isSubmitted={this.state.areAllSubmitted}
          isSubmitting={this.state.isSubmitting}
          setIsFetching={(v) => this.setState((s) => ({...s, isRightFetching: v}))}
          notifyCheckChanged={this.notifyCheckChanged}
        />
      </Fragment>
    )
  }

  bundleDeployments(){
    return this.state.deployments.map((deployment, i) => {
      if(this.state.selectedIndex === i)
        return {...deployment, isSelected: true};
       else if(this.matches[i])
        return {...deployment, status: this.matches[i].status};
       else return {...deployment, status: 'pending'};
    });
  }

  selectedDeployment(){
    if(this.state.selectedIndex !== null)
      return this.state.deployments[this.state.selectedIndex];
    else return null;
  }

  onDeploymentReviewed(bundle){
    const newIndex = this.state.selectedIndex + 1;
    this.matches.push(bundle);
    this.setState((s) => ({...s, selectedIndex: newIndex}))
  }

  isSubmitReady(){
    if(this.state.selectedIndex){
      return this.matches.length === this.state.deployments.length;
    } else return false;
  }

  fetchGithubAuth(){
    this.setState((s) => ({...s, githubState: GIT_STATES.CHECKING}));
    Backend.fetchJson('/github/token', (payload) => {
      const githubState = payload['access_token'] ? GIT_STATES.FINISHED : GIT_STATES.INVALID;
      const authUrl = payload['auth_url'];
      this.setState((s) => ({...s, githubState, authUrl}));
      if(payload['access_token']) this.fetchClusterDeploys();
    });
  }

  fetchClusterDeploys(){
    this.setState((s) => ({...s, isFetching: true}));
    KubeHandler.fetchJson('/api/deployments', (payload) => {
      const deployments = payload['data'].map((d) => ({...d, isChecked: true}));
      const selectedIndex = deployments.length > 0 ? 0 : null;
      this.setState((s) => ({...s, deployments, isFetching: false, selectedIndex}));
    });
  }

  notifyGithubConcluded(status){
    this.setState((s) => ({...s, githubState: GIT_STATES.FINISHED}));
  }

  notifyCheckAllChanged(value){
    const deployments = this.state.deployments.map((d) => ({
      ...d, isChecked: value
    }));
    this.setState((s) => ({...s, deployments}));
  }

  notifyCheckChanged(name){
    const deployments = this.state.deployments.map((d) => {
      if(d.name === name) return {...d, isChecked: !d.isChecked};
      return d;
    });
    this.setState((s) => ({...s, deployments}));
  }

  submit(){
    if(this.state.isSubmitting) return;
    this.setState((s) => ({...s, isSubmitting: true}));

    let formatted = this.matches.map((match, i) => ({
      deployment_name: this.state.deployments[i].name,
      repo_name: match.repoName,
      ms_name: match.msName,
      ms_desc: match.msDescription,
      ms_framework: match.msFramework
    }));

    const payload = { data: formatted };
    Backend.postJson('/microservices/', payload, (result) => {
      this.setState((s) => ({...s, isSubmitting: false, areAllSubmitted: true}));
    });
  }
}

const Matching = AuthenticatedComponent.compose(
  MatchingClass
);

export { Matching as default };