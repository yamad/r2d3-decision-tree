import React from 'react';

/* A Sample represents one example/unit in a dataset */
class Sample extends React.Component {
	constructor(props) {
		super(props);
		this.state = { p: { x:0, y:0 } ,
		               progress: this.props.progress };
	}

	render() {
		return <circle cx={this.state.p.x} cy={this.state.p.y} ref="circle" r="2" fill="red" />;
	}

	// need SVG path DOM element to calculate position, so have to
	// re-render after DOM objects have been created
	componentDidMount() {
		this.updatePosition();
	}

	componentWillReceiveProps(newProps) {
		this.setState({ progress: newProps.progress });
		this.updatePosition();
	}

	updatePosition() {
		let path = document.getElementById("path-5");
		let dist = this.state.progress * path.getTotalLength();
		const p = path.getPointAtLength(dist);
		this.refs.circle.setAttribute('cx', p.x);
		this.refs.circle.setAttribute('cy', p.y);
//		this.setState({ p : p });
	}
}

Sample.propTypes = {
	progress: React.PropTypes.number.isRequired
//	pathID: React.PropTypes.number
};

export default Sample;
