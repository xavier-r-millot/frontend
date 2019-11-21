import Kapi from "./Kapi";
import Backend from "./Backend";
import moment from "moment";
import Cookies from "js-cookie";
import Utils from "./Utils";
import type {RevisionStatus} from "../types/Types";

const KEY = "last_revision_check";
const THRESHOLD = { minutes: 10 };
const YEAR_2000 = "2000-01-01T00:00:00-00:00";

export default class UpdateChecker {

  async perform() {
    if (!this.shouldPerform()) return null;
    this.recordCheckTimestamp();
    return await this.fetchVerdict();
  }

  async fetchVerdict(){
    const frontend = Utils.REVISION;
    const kapi = await this.fetchKapiVersion();
    const currentVersions = { frontend, kapi };
    const payload = { currentVersions };
    const ep = '/revisions/compare';
    const statuses = await Backend.bPost(ep, payload);
    const needingUpdate = (statuses || []).filter(v => v.updateNecessary);
    return needingUpdate.length > -1;
  }

  async fetchKapiVersion(){
    const ep = '/api/status/revision';
    return (await Kapi.bFetch(ep))['sha'];
  }

  shouldPerform(){
    const nonDev = Utils.isNonDev();
    const lastCheckOutdated = this.wasLastCheckTooLongAgo();
    return nonDev && lastCheckOutdated;
  }

  recordCheckTimestamp(){
    const nowISOStr = moment().utc().format();
    Cookies.set(KEY, nowISOStr);
  }

  lastCheckTime(){
    const rawStamp = Cookies.get(KEY) || YEAR_2000;
    return moment(rawStamp).utc();
  }

  furthestBackAcceptableCheckTime(){
    return moment().utc().subtract(THRESHOLD).utc();
  }

  wasLastCheckTooLongAgo(){
    const lastTime = this.lastCheckTime();
    const deadline = this.furthestBackAcceptableCheckTime();
    return lastTime.isBefore(deadline);
  }
}