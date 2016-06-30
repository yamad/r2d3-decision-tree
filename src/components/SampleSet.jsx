import React from 'react';
import { StaggeredMotion, spring, presets } from 'react-motion';
import _ from 'lodash';

import Sample from './Sample.jsx';

/* A SampleSet is a collection of Samples
 *
 * Used for holding training/cross-validation/test sets
 */
const SampleSet = ({ name, samples, progresses}) => (
	  <StaggeredMotion
	     defaultStyles={progresses.map(p => { return { progress: p }})}
	    styles={previousInterpolatedStyles => previousInterpolatedStyles.map((_, i) => {
		return { progress: spring(progresses[i], { stiffness: 76, damping: 26, precision: 0.001}) };
	  })}>
	  {interpolatedStyles =>
		<g className={"samples "+name}>
		  {samples.map((s, i) =>
			     <Sample key={"sample-"+i} progress={interpolatedStyles[i].progress} {...s} />)
		}
		</g>
	  }
	</StaggeredMotion>
);

SampleSet.propTypes = {
    // samples: React.PropTypes.arrayOf(
    //     PropTypes.shape({
    //         id: React.PropTypes.number.isRequired,
    //         ...Sample.propTypes,
    //     })).isRequired
};

export default SampleSet;
