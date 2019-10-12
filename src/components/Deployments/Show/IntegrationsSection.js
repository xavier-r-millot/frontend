import React from 'react'
import Section from "./Section";
import MatchPreview from "../Matching/MatchPreview";

export default class IntegrationsSection extends Section {

  defaultDetail(source){
    const { deployment } = source || this.props;
    return(
      <MatchPreview
        mode='detail'
        deployment={deployment}
        onDeploymentReviewed={null}
        setIsFetching={null}
        hasGitRemote={true}
        hasImageRegistry={true}
      />
    )
  }
}