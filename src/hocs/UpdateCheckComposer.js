import React from 'react'
import RevisionChecker from "../utils/RevisionChecker";
import SelfUpdateModal from "../modals/UpdateSelf/SelfUpdateModal";

export default class UpdateCheckComposer {
  static compose(Component){
    return class extends React.Component {
      componentDidMount() {
        const props = this.props;
        const checker = new RevisionChecker();
        checker.perform().then(verdict => {
          if (verdict) {
            const { bundle } = verdict;
            props.openModal(SelfUpdateModal, { bundle });
          }
        });
      }
      render() {
        return <Component {...this.props} />
      }
    };
  };
}