//@flow

import PropTypes from "prop-types";

export type RemoteBundle = {
  identifier: string,
  type: string,
  contents: Array<RemoteRepo>
}

type RemoteRepo = {
  id: number,
  name: string,
  framework: ?string,
};

export type Matching = {
  id: number,
  framework: ?string,
  gitRemoteName: ?string,
  imgRemoteName: ?string,
  gitRepoName: ?string,
  imgRepoName: ?string,
  gitRemoteId: ?number,
  imgRemoteId: ?number,
  dockerfilePath: ?string
};

export type Deployment = {
  name: string,
  namespace: string,
  replicas: number,
  imageName: string,
  containerName: string,
  imagePullPolicy: ('Always' | 'Never')
};
