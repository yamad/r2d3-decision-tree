import React from 'react';

import Sample from './Sample.jsx';

/* A SampleSet is a collection of Samples
 *
 * Used for holding training/cross-validation/test sets
 */
const SampleSet = ({ name, samples}) => (
	<g className={"samples "+name}>
	  {samples.map((s, i) =>
		       <Sample key={"sample-"+i} progress={s.progress} {...s} />)}
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
