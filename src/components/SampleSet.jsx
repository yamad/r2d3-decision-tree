import React from 'react';
import _ from 'lodash';

import Sample from './Sample.jsx';

/* A SampleSet is a collection of Samples
 *
 * Used for holding training/cross-validation/test sets
 */
const SampleSet = ({ name, samples, progresses}) => (
	<g className={"samples "+name}>
	  {samples.map((s, i) =>
		       <Sample key={"sample-"+i} progress={progresses[i]} {...s} />)}
	</g>
);

SampleSet.propTypes = {
    // samples: React.PropTypes.arrayOf(
    //     PropTypes.shape({
    //         id: React.PropTypes.number.isRequired,
    //         ...Sample.propTypes,
    //     })).isRequired
};

export default SampleSet;
