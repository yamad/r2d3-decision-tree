import React from 'react';

import Sample from './Sample';

/* A SampleSet is a collection of Samples
 *
 * Used for holding training/cross-validation/test sets
 */
const SampleSet = ({samples}) => (
    <g>{samples.map(sample =>
        <Sample key={sample.id} {...sample} />
        )}
    </g>
);

SampleSet.propTypes = {
    samples: React.PropTypes.arrayOf(
        PropTypes.shape({
            id: React.PropTypes.number.isRequired,
            ...Sample.propTypes,
        })).isRequired
};

export default SampleSet
