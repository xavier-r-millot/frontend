import React from 'react'
import AuthenticatedComponent from "../../../hocs/AuthenticatedComponent";
import ModalHostComposer from "../../../hocs/ModalHostComposer";
import ErrComponent from "../../../hocs/ErrComponent";
import ls from "../../../assets/content-layouts.sass";
import TopLoader from "../../../widgets/TopLoader/TopLoader";
import {ICON, LeftHeader} from "../../../widgets/LeftHeader/LeftHeader";
import WorkspaceForm from "./WorkspaceForm";

class WorkspaceEditClass extends React.Component{

  constructor(props){
    super(props);
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
        <LeftHeader
          graphicType={ICON}
          graphicName='developer_board'
          title="My New Workspace"
          subtitle={"Made for organizing"}
          />
        <TopLoader isFetching={false}/>
        <WorkspaceForm

        />
      </div>
    )
  }

  renderRightSide(){
    return(
      <div className={ls.halfScreePanelRight}>
        <TopLoader isFetching={false}/>
      </div>
    )
  }
}

const WorkspaceEdit = AuthenticatedComponent.compose(
  ModalHostComposer.compose(
    ErrComponent.compose(
      WorkspaceEditClass
    )
  )
);

export default WorkspaceEdit;