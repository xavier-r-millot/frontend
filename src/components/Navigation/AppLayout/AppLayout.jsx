import React from 'react';
import SideBar from './../SideBar/SideBar'
import TopBar from './../TopBar/TopBar'
import {theme} from "../../../assets/constants";
import {ThemeProvider} from "styled-components";
import {AppContent} from "./AppLayoutStyles";
import Backend from "../../../utils/Backend";
import {setPath, setRemotes, setWorkspaces} from "../../../actions/action";
import {connect} from "react-redux";
import DataUtils from "../../../utils/DataUtils";

class AppLayoutClass extends React.Component {
  render(){
    return(
      <ThemeProvider theme={theme}>
        <React.Fragment>
          <TopBar/>
          <SideBar/>
          <AppContent>
            { this.props.children }
          </AppContent>
        </React.Fragment>
      </ThemeProvider>
    )
  }

  componentDidUpdate(nextProps){
    nextProps.setPath(window.location.pathname);
  }

  componentDidMount(){
    const { setWorkspaces, setRemotes } = this.props;

    Backend.raisingFetch(`/workspaces`, resp => {
      setWorkspaces(DataUtils.objKeysToCamel(resp['data']));
    });

    Backend.raisingFetch(`/remotes/connected`, resp => {
      setRemotes(DataUtils.objKeysToCamel(resp['data']));
    });
  }
}

function d2P(dispatch){
  return {
    setWorkspaces: (a) => dispatch(setWorkspaces(a)),
    setRemotes: (a) => dispatch(setRemotes(a)),
    setPath: (a) => dispatch(setPath(a))
  }
}

const AppLayout = connect(null, d2P)(AppLayoutClass);
export default AppLayout;