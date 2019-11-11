import Kapi from "./Kapi";
import Backend from "./Backend";
import moment from "moment";
import Cookies from "js-cookie";
import MiscUtils from "./MiscUtils";
import type {RevisionStatus} from "../types/Types";

const KEY = "last_revision_check";
const THRESHOLD = { minutes: 1 };
const YEAR_2000 = "2000-01-01T00:00:00-00:00";

export default class UpdateChecker {

  async perform() {
    if (!this.shouldPerform()) return null;
    this.recordCheckTimestamp();
    const result = await this.fetchVerdict();
    return result['updateNecessary'] ? result : null;
  }

  async fetchVerdict(){
    const frontend = MiscUtils.REVISION;
    const kapi = await this.fetchKapiVersion();
    const currentVersions = { frontend, kapi };
    const payload = { currentVersions };
    const ep = '/revisions/compare';
    const verdict: RevisionStatus[] = await Backend.bPost(ep, payload);
    return verdict.filter(v => v.updateNecessary).length > 0;
  }

  async fetchKapiVersion(){
    const ep = '/api/status/revision';
    return (await Kapi.bFetch(ep))['sha'];
  }

  shouldPerform(){
    const nonDev = this.isNonDevEnvironment();
    const lastCheckOutdated = this.wasLastCheckAgesAgo();
    return nonDev && lastCheckOutdated;
  }

  recordCheckTimestamp(){
    const nowISOStr = moment().format();
    Cookies.set(KEY, nowISOStr);
  }

  lastCheckTime(){
    const rawStamp = Cookies.get(KEY) || YEAR_2000;
    return moment(rawStamp);
  }

  furthestBackAcceptableCheckTime(){
    return moment().subtract(THRESHOLD);
  }

  wasLastCheckAgesAgo(){
    return this.lastCheckTime() < this.furthestBackAcceptableCheckTime();
  }

  isNonDevEnvironment(){
    const myEnv = process.env.NODE_ENV;
    return myEnv !== 'development';
    // return true;
  }
}