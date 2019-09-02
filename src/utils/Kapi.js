const DEFAULT_URL = "http://localhost:5000";
const BACKEND_URL = process.env['KUBE_HANDLER_URL'] || DEFAULT_URL;

export default class Kapi {
  static filterFetch(endpoint, ws, callback, errorCallback=null){
    const nsFilterType = `ns_filter_type=${ws.nsFilterType}`;
    const nsFilter = `ns_filters=${ws.nsFilters.join(',')}`;

    const lbFilterType = `lb_filter_type=${ws.lbFilterType}`;
    const lbFilter = `lb_filters=${ws.lbFilters.join(',')}`;

    const args = `${nsFilterType}&${nsFilter}&${lbFilterType}&${lbFilter}`;
    endpoint = `${endpoint}?${args}&full=true`;

    this.fetch(endpoint, callback, errorCallback);
  }

  static fetch(endpoint, callback, errorCallback=null){
    this.raisingRequest('GET', endpoint, null, callback, errorCallback);
  }

  static post(endpoint, body, callback, errorCallback=null){
    this.raisingRequest('POST', endpoint, body, callback, errorCallback);
  }

  static raisingRequest(method, endpoint, body, callback, errorCallback=null){
    let url = `${BACKEND_URL}${endpoint}`;

    body = body ? JSON.stringify(body) : null;

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    fetch(url, {method, headers, body})
    .then(
      (response) => (
        response.json().then(
          (data) => {
            if(response.ok){
              if(callback) callback(data);
              else return data;
            } else {
              if(errorCallback) {
                errorCallback && errorCallback({
                  kind: "soft",
                  error: data,
                  status: response.status
                })
              }
            }
          }
        )
      ),
      (error) => {
        const bundle = {
          kind: "hard",
          error,
          status: error.status
        };
        errorCallback && errorCallback(bundle);
      }
    )
  }
}