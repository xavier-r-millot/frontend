import React from 'react';
import s from './LeftHeader.sass'
import PropTypes from 'prop-types'

export const IMAGE = "image";
export const ICON = "icon";

export default class LeftHeader extends React.Component {

  render(){
    return(
      <div className={s.leftHeader}>
        { this.renderGraphic() }
        <div className={s.textBox}>
          <h2 className={s.title}>{this.props.title}</h2>
          <p className={s.subtitle}>{this.props.subtitle}</p>
        </div>
      </div>
    )
  }

  renderGraphic() {
    if(this.props.graphicType === ICON){
      return this.renderMaterialIcon();
    } else return this.renderImage();
  }

  renderMaterialIcon(){
    return(
      <i className={`material-icons ${s.icon}`}>
        { this.props.graphicName }
      </i>
    )
  }

  renderImage(){
    const source = this.props.graphicName;
    return <img src={source} className={s.image} alt={null}/>;
  }

  static propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    graphicType: PropTypes.string,
    graphicName: PropTypes.string.isRequired,
  };

  static defaultProps = {
    graphicType: 'material-icon'
  };
}