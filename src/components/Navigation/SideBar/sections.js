
const workbench = {
  title: 'Workbench',
  icon: 'developer_board',
  items: [
    { title: "Workspaces", path: '/workspaces' },
    { title: "Playground", path: '/1' },
    { title: "Observatory", path: '/2' }
  ]
};

const laboratory = {
  title: 'Laboratory',
  icon: 'highlight',
  items: [
    { title: "Experiments", path: '/1' },
    { title: "Regression Tests", path: '/2' },
    { title: "Compliance", path: '/3' }
  ]
};

const canteen = {
  title: 'Cost Control',
  icon: 'money_off',
  items: [
    { title: "Policies", path: '/1' },
    { title: "Trend & Analysis", path: '/2' },
    { title: "Predictions", path: '/3' }
  ]
};

const settings = {
  title: 'Settings',
  icon: 'settings',
  items: [
    { title: "My Account", path: '/1' },
    { title: "My Cluster", path: '/2' },
  ]
};

const sections = [workbench, laboratory, canteen, settings];
export default sections;