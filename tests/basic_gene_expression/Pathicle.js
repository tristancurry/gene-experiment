function Pathicle (options = {}) {
  var options = options;
  this.name = options.name || 'Bob';
  this.start = options.start || {x: 0, y: 200};
  this.end = options.end || {x:400, y: 200};
  this.segments = [];
  this.markers = [];
  //want to show lines from end points to control points
  //if C curve, start -> cpoint0; end -> cpoint1
  //if S curve, end -> cpoint0;
  //if Q curve, start and end -< cpoint0
  this.markup = '';


  // pathy.segments[0].end = pathy.end;
  this.createMarkup();
  this.render(being_1);
  this.element = document.getElementById(this.name);
}

Pathicle.prototype.assemblePath = function () {
  let d = `M ${this.start.x} ${this.start.y} `;
  for (let i = 0, l = this.segments.length; i < l; i++) {
    let thisSegment = this.segments[i];
    if (i == l - 1) {thisSegment.end = this.end;}
    d += `${thisSegment.type} `;

    if(thisSegment.seg_cpoints[thisSegment.type] > 0) {
      for (let j = 0, m = thisSegment.seg_cpoints[thisSegment.type]; j < m; j++) {
        d += `${thisSegment.cpoints[j].x} ${thisSegment.cpoints[j].y}, `;
      }
    }

    d += `${thisSegment.end.x} ${thisSegment.end.y} `; 	
  }
  d += `L 400 400 L 0 400 Z`;
  return d;
}

Pathicle.prototype.createMarkup = function () {
  this.markup = `<path id="${this.name}" d="${this.assemblePath()}" stroke="white" fill="black" />`;
}

Pathicle.prototype.alignSegments = function () {
  //go through list of segments. Match start of next seg with end of previous. Take average location in environment frame.
  for (let i = 0, l = this.segments.length; i < l; i++) {
    let thisSegment = this.segments[i];
    if (i == 0) {
      thisSegment.setPoint('start', this.start);
    } else {
      let avgPoint = {x:0, y:0};
      for (let j in thisSegment.start) {
        avgPoint[j] = (thisSegment.start[j] + this.segments[i - 1].end[j])/2;
      }
      thisSegment.setPoint('start', avgPoint);
      this.segments[i - 1].setPoint('end', avgPoint);


    }
    if (i == l - 1) {
      thisSegment.setPoint('end', this.end);
    }

    //if it's a S or T type, use this to store previous segment's control point (reflected through start point)
    //store it in the extrapoint....
    if(thisSegment.type === 'S' || thisSegment.type === 'T') {
      if(i == 0) {
        //maybe have a clause in here to handle it if the first point is a continuation of the final point...
      } else {
        //oops the calculation of this depends on whether the previous section is a continuation or not.
        //this is trifficult because if this is one of a series of 'T' continuations, then there is no previous control point...
        //unless we put one in.
        //if the previous one is 'S'...use that one's first cpoint.
        let refpoint = {x:0, y:0};
        if (this.segments[i - 1].type == 'S' || this.segments[i - 1].type == 'Q' ) {
          refpoint = {x:this.segments[i - 1].cpoints[0].x, y:this.segments[i - 1].cpoints[0].y}
        } else if (this.segments[i - 1].type == 'C') {
          refpoint = {x:this.segments[i - 1].cpoints[1].x, y:this.segments[i - 1].cpoints[1].y}
        }
        thisSegment.extrapoint.x = thisSegment.start.x + (thisSegment.start.x - refpoint.x);
        thisSegment.extrapoint.y = thisSegment.start.y + (thisSegment.start.y - refpoint.y);
      }

    }
  }
}

Pathicle.prototype.update = function () {
  this.alignSegments();
  this.element.setAttribute('d', this.assemblePath());
  let circs = this.element.parentNode.getElementsByClassName('seg_circle');
  let cpoint_circs_num = 0;
  let cpoint_circs = this.element.parentNode.getElementsByClassName('cpoint_circle');
  let cpoint_lines_num = 0;
  let cpoint_lines = this.element.parentNode.getElementsByClassName('cpoint_line');
  for (let i = 0, l = this.segments.length; i < l; i++) {
    let thisSegment = this.segments[i];
    let seg_cpoints = thisSegment.seg_cpoints[thisSegment.type];
    let thisCirc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    if (!circs[i]) {
      thisCirc.setAttribute('r', 5); 
      thisCirc.setAttribute('class', 'seg_circle');
      this.element.parentNode.appendChild(thisCirc); 
    } else {
      thisCirc = circs[i]
    }
    thisCirc.setAttribute('cx', thisSegment.end.x);
    thisCirc.setAttribute('cy', thisSegment.end.y);



    for (let j = 0; j < seg_cpoints; j++) {
      let thisCpointCirc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      if (!cpoint_circs[cpoint_circs_num]) {
        thisCpointCirc.setAttribute('r', 3);
        thisCpointCirc.setAttribute('class', 'cpoint_circle');
        this.element.parentNode.appendChild(thisCpointCirc); 
      } else {
        thisCpointCirc = cpoint_circs[cpoint_circs_num];
      }
      thisCpointCirc.setAttribute('cx', thisSegment.cpoints[j].x);
      thisCpointCirc.setAttribute('cy', thisSegment.cpoints[j].y);
      cpoint_circs_num++;
    }

    //for the lines...need to know again the number of cpoints.
    //if it's zero, then don't worry about it.
    if(seg_cpoints > 0) {
      let newLines = [];
      for (let t = 0; t < seg_cpoints; t++) {
        newLines.push(document.createElementNS('http://www.w3.org/2000/svg', 'path'));
        //create paths.
      }
      if (seg_cpoints == 2) {
        //this is a cubic bezier. Need two paths.
        //connect cpoint0 with start, cpoint1 with end.
        newLines[0].setAttribute('d', `M ${thisSegment.start.x} ${thisSegment.start.y} L ${thisSegment.cpoints[0].x} ${thisSegment.cpoints[0].y}`);
        newLines[1].setAttribute('d', `M ${thisSegment.end.x} ${thisSegment.end.y} L ${thisSegment.cpoints[1].x} ${thisSegment.cpoints[1].y}`);


      } else if (seg_cpoints == 1) {
        //if there is one
        if (thisSegment.type == 'Q') {
          //if type is Q - connect cpoint0 with start and end
          newLines[0].setAttribute('d', `M ${thisSegment.start.x} ${thisSegment.start.y} L ${thisSegment.cpoints[0].x} ${thisSegment.cpoints[0].y}`);
          newLines[1].setAttribute('d', `M ${thisSegment.end.x} ${thisSegment.end.y} L ${thisSegment.cpoints[0].x} ${thisSegment.cpoints[0].y}`);
 


    
        } else if (thisSegment.type == 'S') {
          //if type is S - connect cpoint0 with end
          newLines[0].setAttribute('d', `M ${thisSegment.end.x} ${thisSegment.end.y} L ${thisSegment.cpoints[0].x} ${thisSegment.cpoints[0].y}`);  
        }
      }
      console.log(newLines);

      for (let j = 0; j < newLines.length; j++) {
        newLines[j].setAttribute('class', 'cpoint_line');
        if(!cpoint_lines[cpoint_lines_num]) {
          this.element.parentNode.appendChild(newLines[j]);
        } else {
          console.log(newLines[j].getAttribute('d'));
          cpoint_lines[cpoint_lines_num].setAttribute('d', newLines[j].getAttribute('d'));
        }
        cpoint_lines_num++;
      }
    }
    
  }


  
  circs = this.element.parentNode.getElementsByClassName('seg_circle');
  if(circs.length > this.segments.length) {
    for (let i = circs.length - 1; i >= 0; i--) {
      if (!segments[i]) {
        circs[i].remove();
      }
      
    }
  }

  cpoint_circs = this.element.parentNode.getElementsByClassName('cpoint_circle');
  if(cpoint_circs.length > cpoint_circs_num) {
    for (let i = cpoint_circs.length - 1; i > cpoint_circs_num; i--) {
        cpoint_circs[i].remove();  
    }
  }

  cpoint_lines = this.element.parentNode.getElementsByClassName('cpoint_line');
  if(cpoint_lines.length > cpoint_lines_num) {
    for (let i = cpoint_lines.length - 1; i > cpoint_lines_num; i--) {
        cpoint_lines[i].remove();  
    }
  }
}

Pathicle.prototype.render = function (target) {
    target.insertAdjacentHTML('afterbegin', this.markup);
}

Pathicle.prototype.subdivideSegment = function (segment, pieces = 2, smooth = false) {
  let subSegs = subdivideSegment(segment, pieces, smooth);
  let idx = this.segments.indexOf(segment);
  for (let i = subSegs.length - 1; i >= 0; i--) {
    this.segments.splice(idx + 1, 0, subSegs[i]);
  }
  this.segments = this.segments.filter(seg => seg !== segment);
  this.update();
}
