import Kapi from "../../utils/Kapi";
import DataUtils from "../../utils/DataUtils";
import Backend from "../../utils/Backend";


export default class Helper{

  static depName(inst){ return inst.props.match.params['id'] }
  static depNs(inst){ return inst.props.match.params['ns'] }

  static structToState(tree){
    if(tree === 'done'){
      return { name: "Terminal" }
    } else {
      return {
        key: tree.ask,
        _collapsed: true,
        name: tree.friendly,
        children: [
          this.structToState(tree.negative),
          this.structToState(tree.positive)
        ]
      }
    }
  }

  static fetchDeployment(inst){
    const ep = `/api/deployments/${this.depNs(inst)}/${this.depName(inst)}`;
    Kapi.fetch(ep, resp => {
      const deployment = DataUtils.objKeysToCamel(resp);
      inst.setState(s => ({...s, deployment}));
    });
  }

  static fetchMatching(inst){
    const ep = `/microservices/${this.depNs(inst)}/${this.depName(inst)}`;
    Backend.raisingFetch(ep, resp => {
      const matching = DataUtils.objKeysToCamel(resp)['data'];
      inst.setState(s => ({...s, matching}));
    }, () => inst.setState(s => ({...s, matching: null})));
  }

  static fetchTreeStruct(inst, callback){
    const ep = `/api/debug/${inst.type()}/decision_tree`;
    Kapi.fetch(ep, resp => {
      callback(DataUtils.objKeysToCamel(resp['data']));
    });
  }
}