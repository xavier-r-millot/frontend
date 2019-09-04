import Kapi from "../../utils/Kapi";
import DataUtils from "../../utils/DataUtils";
import React from "react";
import {DesiredStatePodTable, DesiredTagPodTable, StdPodTable} from "./HocPodTables";

export class ImageActionsModalHelper {

  static fetchPods(inst, field, runAfter){
    const { name, namespace } = inst.props.deployment;
    const endpoint = `/api/deployments/${namespace}/${name}/pods`;
    Kapi.fetch(endpoint, (resp) => {
      if(!inst._isMounted) return;
      const data = DataUtils.objKeysToCamel(resp)['data'];
      console.table(data);
      inst.setState(s => ({...s, [field]: data}));
      runAfter && runAfter(data);
    })
  }

  static podSource(inst){
    if(inst.isConfiguring())
      return StdImageHelper;
    else{
      if(inst.isReload()) return SameImageHelper;
      else return ChangeImageHelper;
    }
  }

  static podsRenderer(inst){
    if(inst.isConfiguring()) return StdPodTable;
    else if(inst.isSubmitted() || inst.isConcluded()){
      if(inst.isReload()) return DesiredStatePodTable;
      else return DesiredTagPodTable;
    }
  }
}

export class SameImageHelper {
  static enrichOldPod(newPods, pod){
    let actualState;
    if(newPods != null){
      const newSelf = newPods.find(newPod => newPod.name === pod.name);
      actualState = newSelf ? newSelf.state : 'gone';
    } else actualState = pod.state;
    return { ...pod, desiredState: 'gone', state: actualState }
  }

  static enrichNewPod(pod){
    return { ...pod, desiredState: 'running' }
  }

  static strictlyNewPods(initialPods, updatedPods){
    if(updatedPods === null) return null;

    const oldNames = initialPods.map(op => op.name);
    return updatedPods.filter(newPod => (
      !oldNames.includes(newPod.name)
    ));
  }

  static buildPodList(initialPods, updatedPods){
    const initial = initialPods;
    const updated = this.strictlyNewPods(initial, updatedPods);
    const enrichedOldPods = initial.map(p => this.enrichOldPod(updated, p));
    const enrichedNewPods = (updated || []).map(p => this.enrichNewPod(p));
    return enrichedOldPods.concat(enrichedNewPods);
  }

  static isStableState(initial, updated){
    updated = this.strictlyNewPods(initial, updated);
    const updatedPodStates = updated.map(p => p.state.toLowerCase());
    const synthList = [...new Set(updatedPodStates)];

    if(initial.length === updated.length)
      return synthList.length === 1 && synthList[0] === 'running';
    return false;
  }

  static progressItems(initial, updated){
    // const enrichedOldPods = initial.map(p => this.enrichOldPod(updated, p));

    return [
      { name: "Old pods gone", detail: "1/3", status: 'working' },
      { name: "New pods created", detail: "2/2", status: 'done' },
      { name: "New pods running", detail: '2/2', status: 'failed' },
    ];
  }
}

export class StdImageHelper {
  static buildPodList(initialPods, _){
    return initialPods;
  }
}

export class ChangeImageHelper {
  static buildPodList(_, updatedPods){
    return updatedPods;
  }
}
