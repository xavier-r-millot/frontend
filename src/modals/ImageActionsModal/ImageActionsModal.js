import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {Container, Intro} from "./ImageActionsModalStyles";
import LeftHeader from "../../widgets/LeftHeader/LeftHeader";
import MiscUtils from "../../utils/MiscUtils";
import {FULL_DEPLOYMENT} from "../../types/Deployment";
import ModalButton from "../../widgets/Buttons/ModalButton";
import ImageForm from "./ImageForm";
import {ThemeProvider} from "styled-components";
import {theme} from "../../assets/constants";
import Kapi from "../../utils/Kapi";
import {defaults} from "./defaults";
import Checklist from "./Checklist";
import {ImageActionsModalHelper as Helper} from "./ImageActionsModalHelper";
import TextOverLineSubtitle from "../../widgets/TextOverLineSubtitle/TextOverLineSubtitle";
import CenterLoader from "../../widgets/CenterLoader/CenterLoader";
import Conclusion from "./Conclusion";

const PHASE_CONFIG = 'configuring';
const PHASE_SUBMITTING = 'submitting';
const PHASE_SUBMITTED = 'submitted';
const PHASE_CONCLUDED = 'concluded';

export default class ImageActionsModal extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      config: {
        operationType: 'change',
        imageName: this.imgDebug(),
        scaleTo: (props.deployment.replicas + 1).toString()
      },
      phase: PHASE_CONFIG,
      initialPods: [],
      imageRegs: [],
      updatedPods: null,
      conclusion: null,
      conclusionReason: null
    };

    this._isMounted = true;
    this.repeater = this.repeater.bind(this);
    this.reloadPods = this.reloadPods.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
    this.onFailure = this.onFailure.bind(this);
  }

  imgDebug(){
    if(this.props.deployment.imageName.includes('rube'))
      return 'nginx';
    else return 'xnectar/rube:latest';
  }

  componentDidMount(){
    Helper.fetchPods(this, 'initialPods')
  }

  componentWillUnmount(){
    this._isMounted = false;
  }

  render(){
    return(
      <ThemeProvider theme={theme}>
        <Container>
          { this.renderHeader() }
          { this.renderLoader() }
          { this.renderIntro() }
          { this.renderChecklist() }
          { this.renderConclusion() }
          { this.renderConfigForm() }
          { this.renderPodList() }
          { this.renderButton() }
        </Container>
      </ThemeProvider>
    )
  }

  renderHeader(){
    return(
      <LeftHeader
        graphicName={MiscUtils.frameworkImage('docker')}
        title={`${this.props.deployment.name} / image ops`}
        subtitle={'Not connected to Git'}
      />
    )
  }

  renderLoader(){
    if(this.isSubmitting())
      return <CenterLoader/>;
    else return null;
  }

  renderIntro(){
    if(this.isSubmitting()) return null;
    const introCopy = defaults.copy.intro.preSubmit;
    const title = this.isConfiguring() ? 'Options' : 'Progress';

    return(
      <Fragment>
        <TextOverLineSubtitle text={title}/>
        {  this.isConfiguring() ? <Intro>{introCopy}</Intro> : null }
      </Fragment>
    )
  }

  renderChecklist(){
    if(!(this.isSubmitted() || this.isConcluded())) return null;

    const { initialPods, updatedPods } = this.state;
    const opHelper = Helper.opHelper(this);
    const items = opHelper.progressItems(
      initialPods,
      updatedPods
    );

    return <Checklist items={items}/>
  }

  renderConclusion(){
    if(!this.isConcluded()) return null;

    const opHelper = Helper.opHelper(this);
    const reason = opHelper.successMessage();

    return(
      <Conclusion
        isSuccess={true}
        reason={reason}
      />
    )
  }

  renderConfigForm(){
    if(!this.isConfiguring()) return null;
    return(
      <ImageForm
        operationType={this.state.config.operationType}
        imageName={this.state.config.imageName}
        scaleTo={this.state.config.scaleTo}
        initialReplicas={this.props.deployment.replicas}
        onAssignment={(a) => this.onAssignment(a)}
        imageRegs={this.state.imageRegs}
      />
    )
  }

  renderPodList(){
    if(this.isSubmitting()) return null;
    const podsFilter = Helper.opHelper(this);
    const pods = podsFilter.buildPodList();
    const PodTableRenderer = Helper.podsRenderer(this);
    return <PodTableRenderer pods={pods}/>;
  }

  renderButton(){
    return(
      <ModalButton
        callback={() => this.submit()}
        title='Apply'
      />
    )
  }

  onFailure(){
    console.log("Failure");
    this.setState(s => ({...s,  phase: PHASE_SUBMITTED}));
  }

  onSuccess(){
    console.log("Success");
    this.submittedAt = new Date().getTime();
    this.setState(s => ({...s, phase: PHASE_SUBMITTED}));
    this.reloadPods(true);
    this.notifySubscribers();
  }

  submit() {
    const payload = {
      dep_namespace: this.props.deployment.namespace,
      dep_name: this.props.deployment.name,
      scale_to: this.state.config.scaleTo,
      target_name: this.state.config.imageName
    };

    const endpoint = `/api/run/${Helper.urlAction(this)}`;
    this.setState(s => ({...s, phase: PHASE_SUBMITTING}));
    Kapi.post(endpoint, payload, this.onSuccess, this.onFailure);
  }

  repeater(updatedPods){
    if(!this.tryHaltingReloadLoop(updatedPods))
      setTimeout(this.reloadPods, 1000);
  }

  tryHaltingReloadLoop(){
    const opHelper = Helper.opHelper(this);
    let conclusion = null, conclusionReason = null;

    if(opHelper.isStableState()) {
      conclusion = true;
      conclusionReason = opHelper.successMessage();
    }
    else if(opHelper.isTimedOut()) {
      conclusion = false;
      conclusionReason = "Failed to reach the desired state in time";
    }
    else{
      const crash = opHelper.isCrashedState();
      if(crash.isCrashed) {
        conclusion = false;
        conclusionReason = crash.reason;
      }
    }

    if(conclusion !== null) {
      console.log(`HALT ${conclusion} ${conclusionReason}`);
      let bundle = {phase: PHASE_CONCLUDED, conclusion, conclusionReason};
      this.notifySubscribers();
      this.setState(s => ({...s, ...bundle}));
      return true;
    }
    else return false;
  }

  reloadPods(force){
    if(force || this.isSubmitted()){
      Helper.fetchPods(this, 'updatedPods', this.repeater)
    }
  }

  isSubmitting(){ return this.state.phase === PHASE_SUBMITTING }
  isConfiguring(){ return this.state.phase === PHASE_CONFIG }
  isConcluded(){ return this.state.phase === PHASE_CONCLUDED }
  isSubmitted(){ return this.state.phase === PHASE_SUBMITTED }

  onAssignment(assignment){
    const merged = {...this.state.config, ...assignment};
    this.setState(s => ({...s, config: merged}));
  }

  notifySubscribers(){
    const broadcast = this.props.refreshCallback;
    if(broadcast) broadcast();
  }

  static propTypes = {
    ...FULL_DEPLOYMENT,
    refreshCallback: PropTypes.func
  }
}