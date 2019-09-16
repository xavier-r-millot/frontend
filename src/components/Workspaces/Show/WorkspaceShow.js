import React, {Fragment} from 'react'
import AuthenticatedComponent from "../../../hocs/AuthenticatedComponent";
import ModalHostComposer from "../../../hocs/ModalHostComposer";
import ErrComponent from "../../../hocs/ErrComponent";
import Kapi from "../../../utils/Kapi";
import Backend from "../../../utils/Backend";
import CenterLoader from "../../../widgets/CenterLoader/CenterLoader";
import CenterAnnouncement from "../../../widgets/CenterAnnouncement/CenterAnnouncement";
import {makeRoute, ROUTES} from "../../../containers/RoutesConsts";
import DeploymentCard from "./DeploymentCard";
import DataUtils from "../../../utils/DataUtils";

class WorkspaceShowClass extends React.Component{

  constructor(props){
    super(props);
    this.state = {
      workspace: null,
      deployments: [],
      microservices: [],
      selectedIndex: 0,
      isEntered: false,
      isFetching: false
    };

    this.fetchDeployments = this.fetchDeployments.bind(this);
  }

  componentDidMount() {
    this.setState((s) => ({...s, isFetching: true}));
    this.fetchDeployments();
  }

  fetchDeployments(){
    Backend.raisingFetch(`/workspaces/${this.workspaceId()}`, (workspace) => {
      workspace = DataUtils.objKeysToCamel(workspace);
      Kapi.filterFetch('/api/deployments', workspace, (depsResp) => {
        const deployments = DataUtils.objKeysToCamel(depsResp)['data'];
        this.setState((s) => ({
          ...s,
          workspace,
          deployments,
          isFetching: false
        }));
      }, this.props.kubeErrorCallback);
    });
  }

  render(){
    return(
      <Fragment>
        { this.renderLoading() }
        { this.renderCards() }
        { this.renderEmpty() }
      </Fragment>
    );
  }

  renderLoading(){
    if(!this.state.isFetching) return null;
    return <CenterLoader/>;
  }

  renderEmpty(){
    if(this.state.isFetching) return null;
    if(this.state.deployments.length > 0) return null;
    const pathBase = ROUTES.workspaces.edit.path;
    const editPath = makeRoute(pathBase, { id: this.workspaceId() });

    return(
      <CenterAnnouncement
        contentType='nav-link'
        text={"No Deployments. Edit your filters."}
        iconName='search'
        action={editPath}
      />
    )
  }

  renderCards(){
    if(this.state.isFetching) return null;

    return this.state.deployments.map((deployment) => (
      <DeploymentCard
        key={deployment.name}
        deployment={deployment}
        microservice={this.microserviceForDeployment(deployment)}
        openModal={this.props.openModal}
        refreshCallback={this.fetchDeployments}
      />
    ));
  }

  microserviceForDeployment(deployment){
    return this.state.microservices.find((microservice) => (
      microservice.deploymentName === deployment.name
    ));
  }

  workspaceId(){
    return this.props.match.params['id'];
  }
}

const WorkspaceShow = AuthenticatedComponent.compose(
  ModalHostComposer.compose(
    ErrComponent.compose(
      WorkspaceShowClass
    )
  )
);

export default WorkspaceShow;