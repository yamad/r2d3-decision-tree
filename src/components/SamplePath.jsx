updateSamplePath: function(s, si) {
    var pathString = 'M ' + this.funnelStart.x + ' ' + this.funnelStart.y + ' ';

    var px = 0;

    _.each(s.treeCoordinates, function(p, i) {
        px = x_scaler(p.x);

        pathString += 'L ' + x_scaler(p.x) + ' ' + y_scaler(p.y) + ' ';
        pathString += 'L ' + x_scaler(p.x) + ' ' + (y_scaler(p.y) + offset) + ' ';
    }, this);

    pathString += 'L ' + px + ' ' + y_scaler(1.1) + ' ';

    var baseline = this.baseline.training;
    if (s.groupID === "test") {
        baseline = this.baseline.test;
    }

    if (s.classification === "isTarget") {
        // Top of Bin
        pathString += 'L ' + x_scaler(0.75) + ' ' + y_scaler(1.2) + ' ';

        var x = x_scaler(1.05) + s.pileCoordinates.row * spacing * -1 + (-spacing / 2 * s.pileCoordinates.col); // + 8 * spacing;
        var y = s.pileCoordinates.col * spacing * -0.86 + baseline;

        pathString += 'L ' + x + ' ' + y + ' ';
    } else {
        // Top of Bin
        pathString += 'L ' + x_scaler(0.25) + ' ' + y_scaler(1.2) + ' ';

        var x = x_scaler(0.02) + s.pileCoordinates.row * spacing + (spacing / 2 * s.pileCoordinates.col);
        var y = s.pileCoordinates.col * spacing * -0.86 + baseline;

        pathString += 'L ' + x + ' ' + y + ' ';
    }

    s.path.attr('d', pathString);

    s.pathLength = s.path.node().getTotalLength();
};
