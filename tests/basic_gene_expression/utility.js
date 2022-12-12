const SUB_PRECISION = 3;

	let splitcircle = document.getElementById('splitcircle');


	let rotateFrame = function (point, origin, angle) {
		let t = {x:0, y:0};
		for (let i in point) {
			t[i] = point[i] - origin[i];
		}
	
		let rot = {
			x: Math.cos(angle)*t.x + Math.sin(angle)*t.y,
			y: -1*Math.sin(angle)*t.x + Math.cos(angle)*t.y
		}

		return rot;
	}



	//for this test, 'proteinA' will affect the location of the control points for a cubic bezier
	let addParam = function (param, inc) {
		//aside from effects on other proteins, the protein may also have
		//a list of direct effects on the appearance of a structure
		//in this case, it's to increase the x-coordinate of the first control point
		//the effect needs to be applied as a component of a 'force' against the existing value
		//every modifiable parameter needs a temporary buffer for building this force calculation - create at 'gene expression' step

				return param + inc;


	}


	let subdivideSegment = function (segment, pieces = 2, smooth = false) {

		//need start/end and control points of this segment
		//that's going to depend on segment type
		//also - consider manipulating these in the horizontal frame of each segment (rather than the canvas frame)
		//that way, any distortions can be replicated across structures pointing in different directions.
		let s = segment;
		let z = 1;
		if(pieces !== 0 && typeof pieces === 'number') {
			z = 1/pieces;
		}

		let coeffs = {
			quadratic: [z**2, z*(z-1), (z-1)**2],
			cubic: [z**3, (z**2)*(z-1), z*((z-1)**2), (z-1)**3],
		}

		let P = {
			x: [],
			y: []
		}

		//before this, need some way of generating the right control points if we are dealing
		//with one of the 'continuation' types (i.e. S or T)
		//also need to alter the behaviour if type is linear or quadratic!


		//generate a pair of Q's that will store the control points for both new Beziers

		let Q_0 = {
			x: [],
			y: []
		};

		let Q_1 = {
			x: [],
			y: []
		}


		if(segment.type == 'C' || segment.type == 'S') {
			//let it rain. each Q.x and Q.y has length of 4 (4 cps)
			//do something different for type S segments
			for(let i in P) {
				P[i] = [s.start[i], s.cpoints[0][i], s.cpoints[1][i], s.end[i]];
				if(segment.type == 'S') {
					P[i][1] = s.extrapoint[i];
					P[i][2] = s.cpoints[0][i];
				}
			}




			for (let i in Q_0) {
				let thisP = P[i];
				Q_0[i] = [
					parseFloat((thisP[0]).toFixed(SUB_PRECISION)), 
					parseFloat((z*thisP[1] - (z-1)*thisP[0]).toFixed(SUB_PRECISION)),
					parseFloat((coeffs.quadratic[0]*thisP[2] - 2*coeffs.quadratic[1]*thisP[1] + coeffs.quadratic[2]*thisP[0]).toFixed(SUB_PRECISION)),
					parseFloat((coeffs.cubic[0]*thisP[3] - 3*coeffs.cubic[1]*thisP[2] + 3*coeffs.cubic[2]*thisP[1] - coeffs.cubic[3]*thisP[0]).toFixed(SUB_PRECISION))
				];
				Q_1[i] = [
					parseFloat((coeffs.cubic[0]*thisP[3] - 3*coeffs.cubic[1]*thisP[2] + 3*coeffs.cubic[2]*thisP[1] - coeffs.cubic[3]*thisP[0]).toFixed(SUB_PRECISION)),
					parseFloat((coeffs.quadratic[0]*thisP[3] - 2*coeffs.quadratic[1]*thisP[2] + coeffs.quadratic[2]*thisP[1]).toFixed(SUB_PRECISION)),
					parseFloat((z*thisP[3] - (z-1)*thisP[2]).toFixed(SUB_PRECISION)),
					parseFloat((thisP[3]).toFixed(SUB_PRECISION))
				]
			}

		} else if (segment.type == 'Q' || segment.type == 'T') {
			//each Q.x and Q.y has length of 3 (3cps)
			//Load start, end and cp into P and do the thing.
			for(let i in P) {
				P[i] = [s.start[i], s.cpoints[0][i], s.end[i]];
			}

			for (let i in Q_0) {
				let thisP = P[i];

				Q_0[i] = [
					parseFloat((thisP[0]).toFixed(SUB_PRECISION)), 
					parseFloat((z*thisP[1] - (z-1)*thisP[0]).toFixed(SUB_PRECISION)),
					parseFloat((coeffs.quadratic[0]*thisP[2] - 2*coeffs.quadratic[1]*thisP[1] + coeffs.quadratic[2]*thisP[0]).toFixed(SUB_PRECISION))
				];
				Q_1[i] = [
					parseFloat((coeffs.quadratic[0]*thisP[2] - 2*coeffs.quadratic[1]*thisP[1] + coeffs.quadratic[2]*thisP[0]).toFixed(SUB_PRECISION)),
					parseFloat((z*thisP[2] - (z-1)*thisP[1]).toFixed(SUB_PRECISION)),
					parseFloat((thisP[2]).toFixed(SUB_PRECISION))
				]
			}




		} else if (segment.type == 'L') {
			//Q.x and Q.y have length of 2. Just the start and end points.
			//use linear interpolation to find the splitting point and simply break the two pieces.
			//Load start and end points into P. then do the linear interp.
			for(let i in P) {
				P[i] = [s.start[i], s.end[i]];
			}


			for (let i in Q_0) {
				let thisP = P[i];
				Q_0[i] = [
					parseFloat((thisP[0]).toFixed(SUB_PRECISION)), 
					parseFloat((z*thisP[1] - (z-1)*thisP[0]).toFixed(SUB_PRECISION)),
				];
				Q_1[i] = [
					parseFloat((z*thisP[1] - (z-1)*thisP[0]).toFixed(SUB_PRECISION)),
					parseFloat((thisP[1]).toFixed(SUB_PRECISION))
				];
			}
		} else {
			//if it's not any of the allowable types, refuse to divide it
			console.log('segment could not be divided (was not a recognised type, e.g. C, S, Q, T or L)' );
			return segment;
		}




		//second piece gets recursively split unless it's no longer necessary. In that case, make segments and return both pieces.
		//if there's more subdividin...take second piece and subdivide with new ratio. and so on.
		//Each level has a holding array for generated segments.
		//what is left is two segments. return these as array. Previous level of recursion then goes through this returned array and
		//appends these to its own array. Finally at top level, the finished array is returned.

		
		let primrose = new Segment(segment.type, {x:Q_0.x[0], y:Q_0.y[0]}, {x:Q_0.x[Q_0.x.length - 1], y:Q_0.y[Q_0.y.length - 1]});
		primrose.cpoints[0] = {x:Q_0.x[1], y:Q_0.y[1]};
		primrose.cpoints[1] = {x:Q_0.x[2], y:Q_0.y[2]};
		
	    let subSegType = segment.type;
		if (smooth === true) {
			if(segment.type == 'C') {
				subSegType = 'S';

			} else if(segment.type == 'Q') {
				subSegType = 'T';
			}
		}

		primrose.updateEigenPoints();

		let peony = new Segment(subSegType, {x:Q_1.x[0], y:Q_1.y[0]}, {x:Q_1.x[Q_1.x.length - 1], y:Q_1.y[Q_0.y.length - 1]});
		peony.cpoints[0] = {x:Q_1.x[1], y:Q_1.y[1]};
		peony.cpoints[1] = {x:Q_1.x[2], y:Q_1.y[2]};

		if (segment.type == 'S' || (segment.type == 'C' && smooth == true)) {
			if(segment.type == 'S') {
				primrose.extrapoint = {x: primrose.cpoints[0].x, y: primrose.cpoints[0].y};
				primrose.cpoints[0] = primrose.cpoints[1];
			}
				peony.extrapoint = {x: peony.cpoints[0].x, y: peony.cpoints[0].y};
				peony.cpoints[0] = peony.cpoints[1];
		}

		peony.updateEigenPoints();



		let segArray  = [primrose];

		let lavender = [];
		if(pieces > 2) {
			lavender = subdivideSegment(peony, pieces - 1);
			lavender.forEach(seg => {
				segArray.push(seg);
			})
		} else {
			segArray.push(peony);
		}

		return segArray;

	}
