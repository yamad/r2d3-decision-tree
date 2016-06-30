import React from 'react';
import d3 from 'd3';
import { pointsToSVGLinePath } from '../util.js';

/* A Sample represents one example/unit in a dataset */
class Sample extends React.Component {
	constructor(props) {
		super(props);
		this.state = { p: { x:0, y:0 },
		               path: pointsToSVGLinePath(this.props.path),
		               progress: this.props.progress,
		               pathID: this.props.pathID,
		               targetclass: this.props.isTarget ? "target" : "nontarget"
		             };
	}

	render() {
		return <g>
			<path d={this.state.path} className="sample-path" ref="path" />;
			<circle cx={this.state.p.x} cy={this.state.p.y} ref="circle" r="2"
		                className={"sample "+this.state.targetclass} />
			</g>;
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
		let path = document.getElementById("path-"+this.state.pathID);
		path = this.refs.path;
		let dist = this.state.progress * path.getTotalLength();
		const p = path.getPointAtLength(dist);
		this.setState({ p: p });
	}
}

export default Sample;
