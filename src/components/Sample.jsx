import React from 'react';

/* A Sample represents one example/unit in a dataset */
const Sample = ({ x, y }) => (
    <circle cx={x} cy={y} r="2" />
);

Sample.propTypes = {
    x: React.PropTypes.number.isRequired,
    y: React.PropTypes.number.isRequired,
    /* these properties are set in the original Backbone version. as
    we figure out what they are for, we'll move them to the right
    place for React */
    groupID: React.PropTypes.number,/* sample set identifier */
    attributes: React.PropTypes.object,/* example information */
    waypoints: React.PropTypes.arrayOf(React.PropTypes.object);
    treeCoordinates: React.PropTypes.arrayOf(React.PropTypes.object);
    path: React.PropTypes.object; /* path through tree DOM object, via D3 */
    circle: React.PropTypes.object;/* circle DOM object, via D3 */
};

export default Sample;
