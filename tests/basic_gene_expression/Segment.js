function Segment (type = 'C', start = {x:0, y: 0}, end = {x:0, y:0}) {
  this.cpoints = [];
  this.start= {x: start.x, y: start.y};
  this.end = {x: end.x, y: end.y};
  this.eigenCpoints = [];
  this.eigenStart = {x: 0, y: 0};
  this.eigenEnd = {x: 0, y: 0};
  this.exprs = {};
  this.extrapoint = {x: 0, y: 0};
  for (let i = 0, l = 2; i < l; i++) {
    this.cpoints.push({x:0, y:0});
    this.eigenCpoints.push({x:0, y:0});
    this.exprs[`cpoint${i}x`] = {val: this.cpoints[i].x, ref: ['cpoints', i, 'x']};
    this.exprs[`cpoint${i}y`] = {val: this.cpoints[i].y, ref: ['cpoints', i, 'y']};
    this.exprs[`ecpoint${i}x`] = {val: this.eigenCpoints[i].x, ref: ['eigenCpoints', i, 'x']};
    this.exprs[`ecpoint${i}y`] = {val: this.eigenCpoints[i].y, ref: ['eigenCpoints', i, 'y']};
  }
  if(this.seg_cpoints.hasOwnProperty(type)) {
    this.type = type;
  } else {
    this.type = 'C';
  }
}

Segment.prototype.seg_cpoints = {
  C: 2,
  S: 1,
  Q: 1,
  T: 0,
  L: 0,
}

Segment.prototype.updateExprVals = function () {
  console.log(this.exprs);
  for(let expr in this.exprs) {
    let e = this.exprs[expr];
    // console.log(this[e.ref[0]][e.ref[1]][e.ref[2]]);
    e.val = this[e.ref[0]][e.ref[1]][e.ref[2]];
  }

}

Segment.prototype.effectLookup = {
  A: [
      {
        effect:	addParam, 
        expr: 'cpoint1x',
        args: [0],
        aux: 'updateEigenPoints',
        aux_args: []
      },

      {
        effect: addParam,
        expr: 'cpoint0x',
        args: [-0],
        aux: 'updateEigenPoints',
        aux_args: []
      }

    ],

  B: [
      {
        effect:addParam, 
        expr: 'ecpoint1y',
        args: [-5],
        aux: 'updatePoints',
        aux_args: []
      },
      
      {
        effect:addParam, 
        expr: 'ecpoint0y',
        args: [-5],
        aux: 'updatePoints',
        aux_args: []
      }
  ],
}



Segment.prototype.setPoint = function (attribute, coords = {x: 0, y: 0}) {
  //use this one to set either eigen or regular points, and the corresponding value will change
  let eigen = true;
  if(attribute === 'end' || attribute === 'bend' || attribute === 'cpoints0' || attribute === 'cpoints1') {
    eigen = false;
  }
  switch (attribute) {
    case 'start':
      this.start = coords;
      this.updatePoints();
      break;
    
    case 'end':
      this.end = coords;
      //update eigenpoints
      // this.updateEigenPoints();
      this.updatePoints();
      break;

    case 'cpoints0':
      this.cpoints[0] = coords;
      this.updateEigenPoints();
      break;
    
      
    case 'cpoints1':
      this.cpoints[1] = coords;
      this.updateEigenPoints();
      break;
    
    case 'eend':
      this.eigenEnd = coords;
      break;

    case 'ecpoints0':
      this.eigenCpoints[0] = coords;
      this.updatePoints();
      break;
    
      
    case 'ecpoints1':
      this.eigenCpoints[1] = coords;
      this.updatePoints();
      break;
  
    default:
      return;
  }

}

Segment.prototype.updateEigenEnd = function() {
  let ang = Math.atan2((this.end.y - this.start.y), (this.end.x - this.start.x));
  let new_eigenEnd = rotateFrame(this.end, this.start, ang);
  let endChange = new_eigenEnd.x - this.eigenEnd.x;

  let idx = 1;
  if(this.type == 'S' || this.type == 'Q') {idx = 0};

  let fac = 1;
  if (this.type == 'Q') {
    fac = 0.5;
  }
  this.eigenCpoints[idx].x += fac*endChange;
}

Segment.prototype.updateEigenPoints = function () {
  //eigen_cpoints: the segment thinks it is horizontal, and starting at origin. Need coordinate transformation so we can act in this domain.
  //first determine angle between local horizontal and outside coordinates.
  let ang = Math.atan2((this.end.y - this.start.y), (this.end.x - this.start.x));
  let eigenStart = {x: 0, y: 0};
  let eigenEnd = rotateFrame(this.end, this.start, ang);

  let eigenCpoints = [];

  this.cpoints.forEach(c => {
    let ec = rotateFrame(c, this.start, ang);

    eigenCpoints.push(ec);
  });

  this.eigenEnd  = eigenEnd;
  this.eigenCpoints = eigenCpoints;
  this.eigenStart = eigenStart;	

  //question is now - how to go the other way? It's easy enough if the start and end points are fixed,
  //but what if there is some transformation on these in the eigenframe?
}

Segment.prototype.updatePoints = function () {
  //use this one to move the control points according to the eigen control points (say, for instance, if the start and end points are moved
  //and you want to keep same basic shape)
  let ang = Math.atan2((this.end.y - this.start.y), (this.end.x - this.start.x));
  let new_eigenEnd = rotateFrame(this.end, this.start, ang);
  let endChange = new_eigenEnd.x - this.eigenEnd.x;


  let idx = 1;
  if(this.type == 'S' || this.type == 'Q') {idx = 0};

  let fac = 1;
  if (this.type == 'Q') {
    fac = 0.5;
  }
  this.eigenCpoints[idx].x += fac*endChange;
  this.eigenEnd = new_eigenEnd;

  //if it's a C curve -> grab the second eigen control point and translate in direction of end point by the change in eigenEnd
  //if it's a S curve -> grab first eigen control point and translate in direction of end point by the change in eigenEnd
  //if it's a Q curve -> grab first eigen control point and translate in direction of end point by half the change in eigenEnd
  //if it's a T or L, do nothing!

  let cpoints = []
  this.eigenCpoints.forEach(ec => {
    let c = rotateFrame(ec, this.eigenStart, -1*ang);
    for (let i in c) {
      c[i] += this.start[i];
    }
    cpoints.push(c);
  });	

  this.cpoints = cpoints;

}
