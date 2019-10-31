import BaseOperator from "./BaseOperator";
import TarballJob from "../Jobs/TarballJob";
import DockerBuildJob from "../Jobs/DockerBuildJob";
import DockerPushJob from "../Jobs/DockerPushJob";

export default class BuildPushRunOperation extends BaseOperator {

  constructor(bundle) {
    super(bundle);
    this.outImageName = bundle.outImageName;
    this.gitCommit = bundle.gitCommit;
  }

  prepareJob(instance) {
    if (instance instanceof TarballJob)
      this.prepareTarballJob(instance);

    if (instance instanceof DockerBuildJob)
      this.prepareBuildJob(instance);

    if (instance instanceof DockerPushJob)
      this.preparePushJob(instance);
  }

  prepareTarballJob(instance){
    instance.prepare({
      matchingId: this.matching.id
    })
  }

  prepareBuildJob(instance){
    const tarJob = this.getJob(TarballJob);

    instance.prepare({
      tarballUrl: tarJob.getTarballUrl(),
      dockerfilePath: this.matching.dockerfilePath,
      outImageName: this.outImageName
    })
  }

  preparePushJob(instance){
    const tarJob = this.getJob(TarballJob);
    instance.prepare({
      imageName: this.outImageName,
      ...tarJob.getCredentials()
    })
  }

  progressItems(){
    const tarJob = this.getJob(TarballJob);
    return [
      ...tarJob.progressItems(),
      this.phaseTwoProgressItem()
    ];
  }

  phaseTwoProgressItem(){
    return this.buildProgressItem(
      "Image Build & Push",
      this.imageStatusFriendly(),
      this.imageChecklistStatus(),
    )
  }

  imageChecklistStatus() {
    const {buildJob: build} = this;
    if (build) return "working";
  }

  imageStatusFriendly() {
    const build = this.getJob(DockerBuildJob);
    const push = this.getJob(DockerPushJob);

    if (build.hasStarted()) {
      if (push.hasStarted()) {
        if (push.hasSucceeded()) return 'Pushed';
        else if (push.hasFailed()) return 'Push Failed';
        else return "Pushing";
      } else {
        if (build.hasSucceeded()) return 'Built';
        else if (build.hasFailed()) return 'Build Failed';
        else return "Building";
      }
    } else return "N/A";
  }

  successMessage() {
    return "Clone -> Build -> Push -> Scale -> Annotate";
  }

  supportsLogging() {
    return true;
  }

  static jobClasses(){
    return [
      TarballJob,
      DockerBuildJob,
      DockerPushJob
    ]
  }
}